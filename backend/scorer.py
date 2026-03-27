# scorer.py
# The brain of PhalanxAI — the rule-based threat scoring engine.
#
# How it works:
#   1. Receives a ThreatEvent
#   2. Matches it against known threat patterns
#   3. Returns: severity label, numeric score, plain-English explanation, recommendation
#
# Why rule-based instead of ML?
#   - Fully explainable ("it matched THIS pattern")
#   - Zero inference latency
#   - Easy to extend with new rules
#   - ML layer can plug in later as a second pass

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ScoringResult:
    severity: str        # "critical" | "high" | "medium" | "low" | "info"
    score: int           # 0–100
    explanation: str     # Plain English: what happened
    recommendation: str  # Plain English: what to do
    blocked: bool        # Should this be auto-blocked?


# ---------------------------------------------------------------------------
# Pattern libraries — add more patterns here to improve detection over time
# ---------------------------------------------------------------------------

XSS_PATTERNS = [
    r"<script[\s\S]*?>",          # <script> tags
    r"javascript\s*:",            # javascript: protocol
    r"on\w+\s*=",                 # onerror=, onclick=, etc. in unexpected places
    r"<iframe",                   # iframe injection
    r"eval\s*\(",                 # eval() calls
    r"document\.cookie",          # cookie stealing
    r"document\.write\s*\(",      # document.write injection
    r"\.innerHTML\s*=",           # innerHTML assignment
    r"fromcharcode",              # character encoding obfuscation
    r"atob\s*\(",                 # base64 decode (often used to hide payloads)
]

SQL_INJECTION_PATTERNS = [
    r"'\s*(or|and)\s+['\"]?\d",   # ' OR 1, ' AND 1
    r"\bunion\s+select\b",        # UNION SELECT
    r"\bdrop\s+table\b",          # DROP TABLE
    r";\s*delete\s+from\b",       # ; DELETE FROM
    r"\binsert\s+into\b.*\bvalues\b",  # INSERT INTO ... VALUES
    r"--\s*$",                    # SQL comment at end of input
    r"\bxp_cmdshell\b",           # MSSQL command execution
    r"\binformation_schema\b",    # Schema enumeration
    r"\bsleep\s*\(\d+\)",         # Time-based blind injection
    r"\bbenchmark\s*\(",          # MySQL time-based injection
    r"\bselect\b.+\bfrom\b",      # Generic SELECT ... FROM payloads
]

DATA_EXFILTRATION_PATTERNS = [
    r"document\.cookie",
    r"localstorage",
    r"sessionstorage",
    r"indexeddb",
    r"navigator\.sendbeacon",     # Silent data sending API
]

REDIRECT_PATTERNS = [
    r"window\.location\s*=",
    r"location\.href\s*=",
    r"location\.replace\s*\(",
    r"<meta[^>]*refresh",         # meta refresh redirects
]


# ---------------------------------------------------------------------------
# Core scoring function
# ---------------------------------------------------------------------------

def score_threat(threat_type: str, payload: Optional[str]) -> ScoringResult:
    """
    Main entry point. Routes to the right scorer based on threat_type,
    then returns a ScoringResult with severity, score, and human explanation.
    """
    payload_lower = (payload or "").lower().strip()
    threat_type = (threat_type or "").strip().lower()

    scorers = {
        "xss_attempt":         _score_xss,
        "sql_injection":       _score_sql_injection,
        "form_skimmer":        _score_form_skimmer,
        "bot_behavior":        _score_bot_behavior,
        "suspicious_redirect": _score_redirect,
        "data_exfiltration":   _score_exfiltration,
        "csrf_attempt":        _score_csrf,
    }

    scorer_fn = scorers.get(threat_type)

    if scorer_fn:
        return scorer_fn(payload_lower)

    # Unknown threat type — log it but treat as low severity
    return ScoringResult(
        severity="low",
        score=10,
        explanation=f"Unknown threat type '{threat_type}' was reported by the agent. "
                    f"This may be a new detection pattern or a misconfiguration.",
        recommendation="Review the raw payload manually and update scoring rules if needed.",
        blocked=False
    )


# ---------------------------------------------------------------------------
# Individual threat scorers
# ---------------------------------------------------------------------------

def _score_xss(payload: str) -> ScoringResult:
    matches = _count_pattern_matches(XSS_PATTERNS, payload)

    if matches >= 3:
        return ScoringResult(
            severity="critical",
            score=95,
            explanation="A highly suspicious cross-site scripting (XSS) payload was intercepted. "
                        "The injected code attempts to run malicious scripts in visitors' browsers, "
                        "which can steal session cookies, redirect users, or silently harvest credentials.",
            recommendation="Block this visitor's IP immediately. Audit your site's input fields for "
                           "missing sanitization. Enable Content-Security-Policy headers.",
            blocked=True
        )
    elif matches >= 1:
        return ScoringResult(
            severity="high",
            score=70,
            explanation="A potential XSS injection pattern was detected in user-submitted content. "
                        "This may be an automated scanner probing for vulnerabilities, or an active attack attempt.",
            recommendation="Review the flagged input field. Ensure all user inputs are HTML-escaped "
                           "before rendering. Consider rate-limiting this IP.",
            blocked=False
        )

    return ScoringResult(
        severity="medium",
        score=40,
        explanation="Content flagged as a possible XSS attempt, but no high-confidence patterns matched. "
                    "Could be a false positive from unusual but legitimate user input.",
        recommendation="Review the payload manually before taking action.",
        blocked=False
    )


def _score_sql_injection(payload: str) -> ScoringResult:
    matches = _count_pattern_matches(SQL_INJECTION_PATTERNS, payload)

    if matches >= 2:
        return ScoringResult(
            severity="critical",
            score=98,
            explanation="A SQL injection attack was intercepted. The attacker is attempting to manipulate "
                        "your database queries — this can lead to unauthorised data access, data deletion, "
                        "or full database compromise.",
            recommendation="Block this IP immediately. Ensure all database queries use parameterised "
                           "statements (prepared statements). Never concatenate user input into SQL strings.",
            blocked=True
        )

    return ScoringResult(
        severity="high",
        score=65,
        explanation="A SQL injection pattern was detected. This is likely an automated vulnerability "
                    "scanner testing your site's database layer.",
        recommendation="Review your database query patterns. Use an ORM or prepared statements. "
                       "Log this IP for further monitoring.",
        blocked=False
    )


def _score_form_skimmer(payload: str) -> ScoringResult:
    exfil_matches = _count_pattern_matches(DATA_EXFILTRATION_PATTERNS, payload)

    if exfil_matches >= 1:
        return ScoringResult(
            severity="critical",
            score=99,
            explanation="A Magecart-style form skimmer was detected. Malicious code is attempting to "
                        "intercept payment or login form data and silently send it to an external server. "
                        "This is the same technique used in major e-commerce data breaches.",
            recommendation="Immediately audit all third-party scripts loaded on your site. "
                           "Enable Subresource Integrity (SRI) on all external scripts. "
                           "Check your payment provider integration for tampering.",
            blocked=True
        )

    return ScoringResult(
        severity="high",
        score=75,
        explanation="Suspicious form submission behaviour detected — data may be being sent to "
                    "an unexpected destination.",
        recommendation="Audit your form submission handlers and check for unauthorised third-party scripts.",
        blocked=False
    )


def _score_bot_behavior(payload: str) -> ScoringResult:
    # Payload for bot detection contains behavioral signals as a JSON string
    # e.g. "no_mouse_movement,click_speed_ms:12,no_scroll"
    high_confidence_signals = ["no_mouse_movement", "headless", "webdriver", "click_speed_ms:1"]
    medium_signals = ["no_scroll", "rapid_requests", "uniform_timing", "tab_hidden"]

    high_hits = sum(1 for s in high_confidence_signals if s in payload)
    med_hits = sum(1 for s in medium_signals if s in payload)

    if high_hits >= 2:
        return ScoringResult(
            severity="high",
            score=80,
            explanation=f"Automated bot behaviour detected with high confidence. "
                        f"Signals: {high_hits} high-confidence indicators. "
                        f"This is likely a scraper, credential stuffer, or vulnerability scanner.",
            recommendation="Enable CAPTCHA on sensitive forms. Rate-limit this IP. "
                           "Consider blocking headless browser user agents.",
            blocked=False
        )
    elif high_hits >= 1 or med_hits >= 2:
        return ScoringResult(
            severity="medium",
            score=50,
            explanation="Possible bot or automated tool detected based on unusual interaction patterns. "
                        "Could be a monitoring tool, SEO crawler, or low-sophistication bot.",
            recommendation="Monitor this IP for further activity. No immediate action required.",
            blocked=False
        )

    return ScoringResult(
        severity="low",
        score=20,
        explanation="Minor anomaly in visitor behaviour. Likely a legitimate user with unusual browsing habits.",
        recommendation="No action required. Continue monitoring.",
        blocked=False
    )


def _score_redirect(payload: str) -> ScoringResult:
    matches = _count_pattern_matches(REDIRECT_PATTERNS, payload)

    if matches >= 2:
        return ScoringResult(
            severity="critical",
            score=90,
            explanation="A highly suspicious redirect chain was intercepted. Malicious code may be attempting to "
                        "send visitors to a phishing site, scam landing page, or malware download destination.",
            recommendation="Immediately inspect recent JavaScript changes and third-party scripts. "
                           "Review redirect logic and remove any injected code.",
            blocked=True
        )
    elif matches >= 1:
        return ScoringResult(
            severity="high",
            score=72,
            explanation="A suspicious page redirect was intercepted. Malicious code may be attempting to "
                        "send your visitors to a phishing site or malware download page.",
            recommendation="Audit all JavaScript files loaded on this page. Check for injected script tags. "
                           "Review recent changes to your site's codebase.",
            blocked=True
        )

    return ScoringResult(
        severity="medium",
        score=45,
        explanation="Unusual redirect behaviour detected.",
        recommendation="Review redirect logic on this page.",
        blocked=False
    )


def _score_exfiltration(payload: str) -> ScoringResult:
    matches = _count_pattern_matches(DATA_EXFILTRATION_PATTERNS, payload)

    if matches >= 2:
        return ScoringResult(
            severity="critical",
            score=97,
            explanation="Silent data exfiltration detected. Malicious code is attempting to read and "
                        "transmit sensitive browser data (cookies, local storage, session data) "
                        "to an external server without the user's knowledge.",
            recommendation="This is a serious compromise indicator. Immediately audit all third-party "
                           "scripts. Notify affected users to change passwords. Consider taking the "
                           "site offline for a security review.",
            blocked=True
        )

    return ScoringResult(
        severity="high",
        score=68,
        explanation="Possible data exfiltration attempt detected.",
        recommendation="Audit third-party scripts and external network requests.",
        blocked=False
    )


def _score_csrf(payload: str) -> ScoringResult:
    return ScoringResult(
        severity="high",
        score=70,
        explanation="A Cross-Site Request Forgery (CSRF) attempt was detected. An attacker may be trying "
                    "to trick authenticated users into performing unintended actions on your site.",
        recommendation="Ensure all state-changing requests include CSRF tokens. "
                       "Verify the Origin and Referer headers on sensitive endpoints.",
        blocked=False
    )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _count_pattern_matches(patterns: list, text: str) -> int:
    """Count how many regex patterns match the given text."""
    return sum(1 for pattern in patterns if re.search(pattern, text, re.IGNORECASE))