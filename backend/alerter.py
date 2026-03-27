# alerter.py
# Sends email alerts to the site admin when a threat is detected.
#
# Uses Gmail's SMTP server with an App Password (not your regular password).
# How to get an App Password:
#   1. Go to myaccount.google.com
#   2. Security → 2-Step Verification (must be enabled)
#   3. Search "App Passwords" → Generate one → Copy the 16-char code
#   4. Paste it as SMTP_PASSWORD in config.py

import smtplib
import html
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings


SEVERITY_COLORS = {
    "critical": "#DC2626",   # Red
    "high":     "#EA580C",   # Orange
    "medium":   "#D97706",   # Amber
    "low":      "#16A34A",   # Green
    "info":     "#2563EB",   # Blue
}

SEVERITY_EMOJI = {
    "critical": "🚨",
    "high":     "⚠️",
    "medium":   "🔶",
    "low":      "ℹ️",
    "info":     "📋",
}


def send_alert(
    admin_email: str,
    site_name: str,
    site_domain: str,
    threat_type: str,
    severity: str,
    score: int,
    url: str,
    explanation: str,
    recommendation: str,
    blocked: bool,
    incident_id: int,
    timestamp: str = "Just now"
):
    """
    Send an HTML email alert to the site admin.
    Called immediately after saving an incident to the database.
    """
    # Escape dynamic values before inserting into HTML
    admin_email = html.escape(admin_email)
    site_name = html.escape(site_name)
    site_domain = html.escape(site_domain)
    threat_type = html.escape(threat_type)
    severity = html.escape(severity)
    url = html.escape(url)
    explanation = html.escape(explanation)
    recommendation = html.escape(recommendation)
    timestamp = html.escape(timestamp)

    color = SEVERITY_COLORS.get(severity.lower(), "#6B7280")
    emoji = SEVERITY_EMOJI.get(severity.lower(), "🔔")
    blocked_text = "🛡️ Mitigated" if blocked else "⚡ Monitoring"
    severity_upper = severity.upper()

    subject = f"{emoji} [{severity_upper}] PhalanxAI Alert — {site_name}: {_format_threat_type(threat_type)}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #f9fafb; margin: 0; padding: 24px;">

      <div style="max-width: 600px; margin: 0 auto; background: white;
                  border-radius: 12px; overflow: hidden;
                  border: 1px solid #e5e7eb;">

        <!-- Header bar -->
        <div style="background: {color}; padding: 20px 28px;">
          <div style="font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 4px;">
            PHALANXAI SECURITY ALERT
          </div>
          <div style="font-size: 22px; font-weight: 700; color: white;">
            {emoji} {severity_upper} — {_format_threat_type(threat_type)}
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 28px;">

          <!-- Site + status row -->
          <div style="display: flex; justify-content: space-between;
                      align-items: center; margin-bottom: 20px;">
            <div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">PROTECTED SITE</div>
              <div style="font-size: 16px; font-weight: 600; color: #111827;">{site_name}</div>
              <div style="font-size: 13px; color: #6b7280;">{site_domain}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">STATUS</div>
              <div style="font-size: 14px; font-weight: 600;">{blocked_text}</div>
              <div style="font-size: 12px; color: #6b7280;">Score: {score}/100</div>
              <div style="font-size: 12px; color: #6b7280;">Detected: {timestamp}</div>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;">

          <!-- What happened -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #6b7280;
                        text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              What happened
            </div>
            <div style="font-size: 14px; color: #374151; line-height: 1.6;
                        background: #f9fafb; border-radius: 8px; padding: 14px;
                        border-left: 3px solid {color};">
              {explanation}
            </div>
          </div>

          <!-- URL -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #6b7280;
                        text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              Affected page
            </div>
            <div style="font-size: 13px; color: #374151; background: #f9fafb;
                        border-radius: 6px; padding: 10px 14px; font-family: monospace;
                        word-break: break-all;">
              {url}
            </div>
          </div>

          <!-- Recommendation -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 600; color: #6b7280;
                        text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              Recommended action
            </div>
            <div style="font-size: 14px; color: #374151; line-height: 1.6;
                        background: #ecfdf5; border-radius: 8px; padding: 14px;
                        border-left: 3px solid #16a34a;">
              {recommendation}
            </div>
          </div>

          <!-- Incident ID -->
          <div style="font-size: 12px; color: #9ca3af; text-align: center;">
            Incident #{incident_id} · PhalanxAI · Your site's security partner
          </div>

        </div>
      </div>

    </body>
    </html>
    """

    # Build the email message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.ALERT_FROM
    msg["To"] = admin_email
    msg.attach(MIMEText(html_body, "html"))

    # Send via Gmail SMTP
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()                                          # Encrypt the connection
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)  # Log in
            server.send_message(msg)
        print(f"📧 Alert sent to {admin_email} — Incident #{incident_id}")
        return True
    except Exception as e:
        # Don't crash the whole request if email fails
        # In production: log this to a monitoring service
        print(f"❌ Email failed: {e}")
        return False


def _format_threat_type(threat_type: str) -> str:
    """Convert snake_case threat type to a readable label."""
    labels = {
        "xss_attempt":         "XSS Injection Attempt",
        "sql_injection":       "SQL Injection Attack",
        "form_skimmer":        "Form Skimmer / Magecart",
        "bot_behavior":        "Automated Bot Detected",
        "suspicious_redirect": "Suspicious Redirect",
        "data_exfiltration":   "Data Exfiltration Attempt",
        "csrf_attempt":        "CSRF Attack Attempt",
    }
    return labels.get(threat_type, threat_type.replace("_", " ").title())