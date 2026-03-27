# models.py
# Pydantic models = the "shape" of your data.
# FastAPI uses these to automatically validate incoming JSON.
# If the JSON doesn't match the shape, FastAPI rejects it with a clear error.

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- What agent.js sends TO the backend ---
class ThreatEvent(BaseModel):
    site_key: str                         # Identifies which website this came from
    threat_type: str                      # e.g. "xss_attempt", "sql_injection"
    payload: Optional[str] = None         # The actual suspicious string/content (optional)
    url: str                              # The page URL where it happened
    visitor_ip: Optional[str] = None      # Visitor's IP (optional, for logging)
    user_agent: Optional[str] = None      # Browser info (optional)
    timestamp: Optional[datetime] = None  # ISO datetime string (auto-parsed by Pydantic)

# --- What the backend stores in the database + sends to dashboard ---
class StoredIncident(BaseModel):
    id: int
    site_key: str
    threat_type: str
    severity: str                         # "critical", "high", "medium", "low"
    severity_score: int                   # 0-100 numeric score
    payload: Optional[str] = None
    url: str
    visitor_ip: Optional[str] = None
    explanation: str                      # Plain English: "What happened and why it's dangerous"
    recommendation: str                   # Plain English: "What the admin should do"
    blocked: bool                         # Did we auto-block it?
    timestamp: str

# --- Site registration (for the dashboard) ---
class SiteRegistration(BaseModel):
    domain: str                           # e.g. "mystore.com"
    admin_email: EmailStr                 # Where alerts get sent
    site_name: str                        # e.g. "My Online Store"