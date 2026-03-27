// agent.js
// PhalanxAI browser security agent
//
// Drop this into any website using:
// <script src="https://your-backend-url/agent.js" data-key="phx_xxxxx" defer></script>
//
// What it does:
//   - Runs silently in the visitor's browser
//   - Detects suspicious client-side attack behavior
//   - Sends threat events to the PhalanxAI backend
//
// NOTE:
// Replace BACKEND_URL + INTERNAL_SECRET before production use.

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  const CURRENT_SCRIPT =
    document.currentScript ||
    [...document.getElementsByTagName("script")].find((s) =>
      (s.src || "").includes("agent.js")
    );

  const SITE_KEY = CURRENT_SCRIPT?.dataset?.key || null;

  const BACKEND_URL = "http://localhost:8000"; // ← change this in production
  const THREAT_ENDPOINT = `${BACKEND_URL}/threat`;

  const INTERNAL_SECRET = "phalanx-dev-secret-2026"; // ← must match config.py

  if (!SITE_KEY) {
    console.warn("[PhalanxAI] Missing data-key in script tag.");
    return;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    mouseMoved: false,
    scrolled: false,
    keyPressed: false,
    clicks: 0,
    clickTimes: [],
    firstInteractionAt: Date.now(),
    hiddenTransitions: 0,
    threatCooldowns: {},
    sentThreats: new Set(),
  };

  const COOLDOWN_MS = 15000; // avoid spamming same threat repeatedly
  const MAX_PAYLOAD_LENGTH = 1000;

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  function nowISO() {
    return new Date().toISOString();
  }

  function safeString(value) {
    return String(value || "").slice(0, MAX_PAYLOAD_LENGTH);
  }

  function shouldSend(threatType, fingerprint = "") {
    const key = `${threatType}:${fingerprint}`;
    const last = state.threatCooldowns[key] || 0;
    const now = Date.now();

    if (now - last < COOLDOWN_MS) return false;

    state.threatCooldowns[key] = now;
    return true;
  }

  async function reportThreat(threatType, payload, url = window.location.href) {
    try {
      const fingerprint = safeString(payload).slice(0, 150);
      if (!shouldSend(threatType, fingerprint)) return;

      const body = {
        site_key: SITE_KEY,
        threat_type: threatType,
        payload: safeString(payload),
        url: safeString(url),
        visitor_ip: null, // backend can log request IP if needed
        user_agent: navigator.userAgent,
        timestamp: nowISO(),
      };

      const res = await fetch(THREAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_SECRET,
        },
        body: JSON.stringify(body),
      });

      // Optional: if backend decides this should be blocked, log it
      if (res.ok) {
        const result = await res.json().catch(() => null);

        if (result?.blocked) {
          console.warn("[PhalanxAI] Threat blocked:", threatType, result);
        } else {
          console.info("[PhalanxAI] Threat reported:", threatType, result);
        }
      } else {
        console.warn("[PhalanxAI] Threat report failed:", res.status);
      }
    } catch (err) {
      console.warn("[PhalanxAI] Failed to report threat:", err);
    }
  }

  function isExternalUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  function matchesAny(text, patterns) {
    const lower = String(text || "").toLowerCase();
    return patterns.some((p) => lower.includes(p));
  }

  // ---------------------------------------------------------------------------
  // Pattern libraries
  // ---------------------------------------------------------------------------

  const XSS_KEYWORDS = [
    "<script",
    "javascript:",
    "onerror=",
    "onload=",
    "onclick=",
    "eval(",
    "document.cookie",
    "document.write(",
    "innerhtml",
    "fromcharcode",
    "atob(",
    "<iframe",
  ];

  const SQLI_KEYWORDS = [
    "' or 1=1",
    "\" or 1=1",
    "union select",
    "drop table",
    "insert into",
    "delete from",
    "information_schema",
    "xp_cmdshell",
    "sleep(",
    "benchmark(",
    "--",
  ];

  const EXFIL_KEYWORDS = [
    "document.cookie",
    "localstorage",
    "sessionstorage",
    "indexeddb",
    "sendbeacon",
  ];

  // ---------------------------------------------------------------------------
  // 1) XSS / malicious input detection
  // ---------------------------------------------------------------------------

  function inspectValueForInjection(value, context = "input") {
    const lower = String(value || "").toLowerCase();

    if (!lower || lower.length < 4) return;

    if (matchesAny(lower, XSS_KEYWORDS)) {
      reportThreat("xss_attempt", `[${context}] ${value}`);
    }

    if (matchesAny(lower, SQLI_KEYWORDS)) {
      reportThreat("sql_injection", `[${context}] ${value}`);
    }
  }

  function monitorInputs() {
    document.addEventListener(
      "input",
      (e) => {
        const el = e.target;
        if (!el) return;

        if (
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable
        ) {
          inspectValueForInjection(el.value || el.innerHTML || "", "input");
        }
      },
      true
    );

    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
          inspectValueForInjection(`${key}=${value}`, "form_submit");
        }

        // Simple CSRF-ish signal: suspicious external action
        const action = form.action || window.location.href;
        if (isExternalUrl(action)) {
          reportThreat(
            "csrf_attempt",
            `Form submitted to external domain: ${action}`
          );
        }
      },
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 2) Form skimmer / Magecart-style monitoring
  // ---------------------------------------------------------------------------

  function monitorSensitiveForms() {
    const sensitiveKeywords = [
      "card",
      "cvv",
      "otp",
      "password",
      "upi",
      "email",
      "login",
      "payment",
    ];

    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        const inputs = [...form.querySelectorAll("input, textarea")];
        const suspiciousFields = inputs.filter((input) => {
          const name = (input.name || "").toLowerCase();
          const type = (input.type || "").toLowerCase();
          const placeholder = (input.placeholder || "").toLowerCase();
          return sensitiveKeywords.some(
            (k) => name.includes(k) || type.includes(k) || placeholder.includes(k)
          );
        });

        if (suspiciousFields.length > 0) {
          const action = form.action || window.location.href;
          if (isExternalUrl(action)) {
            reportThreat(
              "form_skimmer",
              `Sensitive form submitted to external destination: ${action}`
            );
          }
        }
      },
      true
    );
  }

  // ---------------------------------------------------------------------------
  // 3) Redirect hijack detection
  // ---------------------------------------------------------------------------

  function monitorRedirects() {
    try {
      const originalAssign = window.location.assign.bind(window.location);
      const originalReplace = window.location.replace.bind(window.location);

      window.location.assign = function (url) {
        if (isExternalUrl(url)) {
          reportThreat("suspicious_redirect", `location.assign(${url})`);
        }
        return originalAssign(url);
      };

      window.location.replace = function (url) {
        if (isExternalUrl(url)) {
          reportThreat("suspicious_redirect", `location.replace(${url})`);
        }
        return originalReplace(url);
      };
    } catch {
      // Some browsers restrict overriding these; ignore gracefully
    }

    // Catch meta refresh redirects
    const metas = document.querySelectorAll('meta[http-equiv="refresh"]');
    metas.forEach((meta) => {
      const content = meta.getAttribute("content") || "";
      if (content.toLowerCase().includes("url=")) {
        reportThreat("suspicious_redirect", `<meta refresh> ${content}`);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4) Data exfiltration detection
  // ---------------------------------------------------------------------------

  function monitorExfiltration() {
    // Hook fetch()
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        const body = args[1]?.body ? String(args[1].body) : "";

        const suspicious =
          matchesAny(body, EXFIL_KEYWORDS) ||
          body.toLowerCase().includes("cookie=") ||
          body.toLowerCase().includes("localstorage");

        if (isExternalUrl(url) && suspicious) {
          reportThreat(
            "data_exfiltration",
            `fetch → ${url} | body=${body.slice(0, 300)}`
          );
        }
      } catch {}

      return originalFetch.apply(this, args);
    };

    // Hook navigator.sendBeacon()
    if (navigator.sendBeacon) {
      const originalBeacon = navigator.sendBeacon.bind(navigator);

      navigator.sendBeacon = function (url, data) {
        try {
          const payload = String(data || "");
          if (
            isExternalUrl(url) &&
            (matchesAny(payload, EXFIL_KEYWORDS) ||
              payload.toLowerCase().includes("cookie"))
          ) {
            reportThreat(
              "data_exfiltration",
              `sendBeacon → ${url} | data=${payload.slice(0, 300)}`
            );
          }
        } catch {}

        return originalBeacon(url, data);
      };
    }

    // Hook localStorage reads in a light-touch way
    try {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        const lowerKey = String(key || "").toLowerCase();
        if (
          ["token", "auth", "jwt", "session", "cookie", "password"].some((k) =>
            lowerKey.includes(k)
          )
        ) {
          reportThreat("data_exfiltration", `Storage read: ${key}`);
        }
        return originalGetItem.apply(this, arguments);
      };
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // 5) Bot / automation detection
  // ---------------------------------------------------------------------------

  function monitorBehavior() {
    document.addEventListener("mousemove", () => {
      state.mouseMoved = true;
    });

    document.addEventListener("scroll", () => {
      state.scrolled = true;
    });

    document.addEventListener("keydown", () => {
      state.keyPressed = true;
    });

    document.addEventListener("click", () => {
      state.clicks += 1;
      state.clickTimes.push(Date.now());

      if (state.clickTimes.length > 10) {
        state.clickTimes.shift();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        state.hiddenTransitions += 1;
      }
    });

    // Evaluate after a short interaction window
    setTimeout(() => {
      const signals = [];

      if (!state.mouseMoved) signals.push("no_mouse_movement");
      if (!state.scrolled) signals.push("no_scroll");
      if (!state.keyPressed) signals.push("no_keypress");

      // Headless / webdriver
      if (navigator.webdriver) signals.push("webdriver");
      if (/HeadlessChrome/i.test(navigator.userAgent)) signals.push("headless");

      // Very fast click pattern
      if (state.clickTimes.length >= 2) {
        const diffs = [];
        for (let i = 1; i < state.clickTimes.length; i++) {
          diffs.push(state.clickTimes[i] - state.clickTimes[i - 1]);
        }

        const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        if (avg < 100) signals.push("click_speed_ms:1");
        else if (avg < 250) signals.push("uniform_timing");
      }

      if (signals.length >= 2) {
        reportThreat("bot_behavior", signals.join(","));
      }
    }, 7000);
  }

  // ---------------------------------------------------------------------------
  // 6) DOM tampering / injected script observation
  // ---------------------------------------------------------------------------

  function monitorDomInjection() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          // Suspicious script injection
          if (node.tagName === "SCRIPT") {
            const src = node.getAttribute("src") || "";
            const inline = node.textContent || "";

            if (src && isExternalUrl(src)) {
              reportThreat("form_skimmer", `External script injected: ${src}`);
            }

            if (matchesAny(inline, XSS_KEYWORDS) || matchesAny(inline, EXFIL_KEYWORDS)) {
              reportThreat("xss_attempt", `Injected inline script: ${inline.slice(0, 300)}`);
            }
          }

          // Suspicious iframe injection
          if (node.tagName === "IFRAME") {
            const src = node.getAttribute("src") || "";
            if (src && isExternalUrl(src)) {
              reportThreat("xss_attempt", `Suspicious iframe injected: ${src}`);
            }
          }
        }
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  function init() {
    monitorInputs();
    monitorSensitiveForms();
    monitorRedirects();
    monitorExfiltration();
    monitorBehavior();
    monitorDomInjection();

    console.info("[PhalanxAI] Agent active for site:", SITE_KEY);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();