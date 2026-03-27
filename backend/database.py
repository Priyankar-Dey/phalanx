# database.py
# Handles all database operations using SQLite.
#
# Why SQLite for the hackathon?
#   - Zero setup. It's just a file (phalanx.db) that gets created automatically.
#   - No separate database server to run or install.
#   - You swap to PostgreSQL in one line when you deploy to Railway/Render later.
#
# The database has 2 tables:
#   1. sites       — registered websites + their admin email
#   2. incidents   — every threat event that was detected

import sqlite3
from config import settings
from typing import Optional


def get_connection():
    """Open a connection to the SQLite database file."""
    conn = sqlite3.connect(settings.DATABASE_URL, check_same_thread=False)
    conn.row_factory = sqlite3.Row   # Makes rows behave like dicts: row["column_name"]
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """
    Create the database tables if they don't already exist.
    Call this once when the server starts.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Sites table — one row per registered website
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sites (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            site_key      TEXT UNIQUE NOT NULL,   -- The key embedded in agent.js
            domain        TEXT UNIQUE NOT NULL,
            site_name     TEXT NOT NULL,
            admin_email   TEXT NOT NULL,
            created_at    TEXT DEFAULT (datetime('now'))
        )
    """)

    # Incidents table — one row per detected threat
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            site_key        TEXT NOT NULL,
            threat_type     TEXT NOT NULL,
            severity        TEXT NOT NULL,
            severity_score  INTEGER NOT NULL,
            payload         TEXT,
            url             TEXT NOT NULL,
            visitor_ip      TEXT,
            explanation     TEXT NOT NULL,
            recommendation  TEXT NOT NULL,
            blocked         INTEGER DEFAULT 0,     -- 0 = false, 1 = true (SQLite has no bool)
            timestamp       TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (site_key) REFERENCES sites(site_key) ON DELETE CASCADE
        )
    """)

    # Helpful indexes for dashboard queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_site_key ON incidents(site_key)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)")

    conn.commit()
    conn.close()
    print("✅ Database initialised")


# ---------------------------------------------------------------------------
# Site operations
# ---------------------------------------------------------------------------

def register_site(site_key: str, domain: str, site_name: str, admin_email: str) -> bool:
    """
    Register a new website. Returns True if successful, False if site_key or domain already exists.
    """
    conn = None
    try:
        conn = get_connection()
        conn.execute("""
            INSERT INTO sites (site_key, domain, site_name, admin_email)
            VALUES (?, ?, ?, ?)
        """, (site_key, domain, site_name, admin_email))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # site_key/domain is UNIQUE — this fires if you try to register the same one twice
        return False
    finally:
        if conn:
            conn.close()


def get_site(site_key: str) -> Optional[dict]:
    """
    Look up a site by its key. Returns a dict or None if not found.
    """
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM sites WHERE site_key = ?", (site_key,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Incident operations
# ---------------------------------------------------------------------------

def save_incident(
    site_key: str,
    threat_type: str,
    severity: str,
    severity_score: int,
    payload: Optional[str],
    url: str,
    visitor_ip: Optional[str],
    explanation: str,
    recommendation: str,
    blocked: bool
) -> int:
    """
    Save a new incident to the database. Returns the new incident's ID.
    """
    conn = get_connection()
    cursor = conn.execute("""
        INSERT INTO incidents
            (site_key, threat_type, severity, severity_score, payload,
             url, visitor_ip, explanation, recommendation, blocked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        site_key, threat_type, severity, severity_score, payload,
        url, visitor_ip, explanation, recommendation, 1 if blocked else 0
    ))
    incident_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return incident_id


def get_incidents(site_key: str, limit: int = 50) -> list:
    """
    Get the most recent incidents for a site. Used by the dashboard.
    """
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM incidents
        WHERE site_key = ?
        ORDER BY id DESC
        LIMIT ?
    """, (site_key, limit)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_incident_stats(site_key: str) -> dict:
    """
    Get summary stats for the dashboard's health score widget.
    """
    conn = get_connection()

    total = conn.execute(
        "SELECT COUNT(*) FROM incidents WHERE site_key = ?", (site_key,)
    ).fetchone()[0]

    critical = conn.execute(
        "SELECT COUNT(*) FROM incidents WHERE site_key = ? AND severity = 'critical'", (site_key,)
    ).fetchone()[0]

    blocked = conn.execute(
        "SELECT COUNT(*) FROM incidents WHERE site_key = ? AND blocked = 1", (site_key,)
    ).fetchone()[0]

    last_24h = conn.execute("""
        SELECT COUNT(*) FROM incidents
        WHERE site_key = ?
        AND timestamp >= datetime('now', '-24 hours')
    """, (site_key,)).fetchone()[0]

    conn.close()

    return {
        "total": total,
        "critical": critical,
        "blocked": blocked,
        "last_24h": last_24h
    }