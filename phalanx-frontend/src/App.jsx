import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [form, setForm] = useState({
    site_name: "",
    domain: "",
    admin_email: "",
  });

  const [siteData, setSiteData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const siteKey = siteData?.site_key || localStorage.getItem("phalanx_site_key");

  useEffect(() => {
    if (siteKey) {
      fetchDashboard(siteKey);
      const interval = setInterval(() => fetchDashboard(siteKey), 5000);
      return () => clearInterval(interval);
    }
  }, [siteKey]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const registerSite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setSiteData(data);
      localStorage.setItem("phalanx_site_key", data.site_key);
      fetchDashboard(data.site_key);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (key) => {
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/${key}`);
      const data = await res.json();
      if (res.ok) {
        setDashboard(data);
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const simulateThreat = async (type) => {
    if (!siteKey) return;

    try {
      await fetch(
        `${API_BASE}/demo/simulate?site_key=${siteKey}&threat_type=${type}`,
        {
          method: "POST",
        }
      );
      fetchDashboard(siteKey);
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  const copyText = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const scriptTag = siteData?.script_tag || (siteKey
    ? `<script src="${API_BASE}/agent.js" data-key="${siteKey}" defer></script>`
    : "");

  return (
    <div className="min-h-screen text-white">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_40%)] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-blue-500/20 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] text-blue-400">
              PHALANXAI
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200/60">
              Browser Threat Defense Layer
            </p>
          </div>

          <div className="hidden gap-3 md:flex">
            <a href="#features" className="text-sm text-white/70 hover:text-blue-300">
              Features
            </a>
            <a href="#register" className="text-sm text-white/70 hover:text-blue-300">
              Protect Site
            </a>
            <a href="#dashboard" className="text-sm text-white/70 hover:text-blue-300">
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 shadow-[0_0_25px_rgba(59,130,246,0.2)]">
              Real-time website attack detection for SMEs
            </div>

            <h2 className="mb-6 text-5xl font-black leading-tight md:text-6xl">
              Defend Any Website
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 bg-clip-text text-transparent">
                With One Script Tag
              </span>
            </h2>

            <p className="mb-8 max-w-xl text-lg leading-8 text-white/70">
              PhalanxAI silently monitors the browser layer for XSS, SQL injection,
              bot abuse, redirect hijacks, and form skimmers — then alerts site owners
              in near real-time.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#register"
                className="rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-[0_0_35px_rgba(59,130,246,0.35)] transition hover:scale-105"
              >
                Protect My Site
              </a>

              <a
                href="#dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80 backdrop-blur hover:border-blue-400/30 hover:text-blue-300"
              >
                View Command Center
              </a>
            </div>
          </div>

          {/* Hero Panel */}
          <div className="relative">
            <div className="rounded-[2rem] border border-blue-400/20 bg-white/5 p-6 shadow-[0_0_60px_rgba(37,99,235,0.18)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">
                    Threat Monitor
                  </p>
                  <h3 className="text-2xl font-bold text-white">
                    Live Security Telemetry
                  </h3>
                </div>
                <div className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
              </div>

              <div className="space-y-4">
                {[
                  ["XSS Injection Attempt", "Critical", "Blocked"],
                  ["SQL Injection Probe", "High", "Investigating"],
                  ["Bot Behaviour", "Medium", "Monitoring"],
                  ["Suspicious Redirect", "High", "Blocked"],
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item[0]}</p>
                        <p className="text-sm text-white/50">Live browser detection event</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-300">{item[1]}</p>
                        <p className="text-xs text-white/50">{item[2]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300/60">
              Detection Modules
            </p>
            <h3 className="text-4xl font-black">Browser-Layer Threat Intelligence</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {[
              "XSS Injection Detection",
              "SQL Injection Probes",
              "Magecart / Form Skimmers",
              "Credential Bots & Automation",
              "Redirect / Phishing Hijacks",
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-3xl border border-blue-400/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_0_35px_rgba(59,130,246,0.15)]"
              >
                <div className="mb-4 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_0_25px_rgba(59,130,246,0.4)]" />
                <h4 className="text-lg font-bold">{feature}</h4>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  Real-time in-browser detection with low-latency alerting.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Register */}
      <section id="register" className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300/60">
              Onboard a Site
            </p>
            <h3 className="mb-4 text-4xl font-black">Deploy in Under 60 Seconds</h3>
            <p className="max-w-xl text-lg leading-8 text-white/70">
              Register a website, generate a site key, and embed PhalanxAI with a single script tag.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-400/20 bg-white/5 p-8 shadow-[0_0_60px_rgba(37,99,235,0.12)] backdrop-blur-xl">
            <form onSubmit={registerSite} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-blue-200/80">Site Name</label>
                <input
                  name="site_name"
                  value={form.site_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="Demo Store"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-blue-200/80">Domain</label>
                <input
                  name="domain"
                  value={form.domain}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="demo-site.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-blue-200/80">Admin Email</label>
                <input
                  name="admin_email"
                  value={form.admin_email}
                  onChange={handleChange}
                  required
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-blue-400"
                  placeholder="you@gmail.com"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-bold shadow-[0_0_30px_rgba(59,130,246,0.35)] transition hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Registering..." : "Generate Site Key"}
              </button>
            </form>

            {siteKey && (
              <div className="mt-8 space-y-4 rounded-3xl border border-blue-400/20 bg-black/30 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-blue-300/60">Site Key</p>
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <code className="overflow-x-auto text-sm text-cyan-300">{siteKey}</code>
                    <button
                      onClick={() => copyText(siteKey, "key")}
                      className="rounded-xl border border-blue-400/20 px-3 py-1 text-sm text-blue-300 hover:bg-blue-500/10"
                    >
                      {copied === "key" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-blue-300/60">Script Tag</p>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <code className="block whitespace-pre-wrap break-all text-sm text-green-300">
                      {scriptTag}
                    </code>
                  </div>
                  <button
                    onClick={() => copyText(scriptTag, "script")}
                    className="mt-3 rounded-xl border border-blue-400/20 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                  >
                    {copied === "script" ? "Copied!" : "Copy Script Tag"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300/60">
                Security Command Center
              </p>
              <h3 className="text-4xl font-black">Live Threat Dashboard</h3>
            </div>

            {siteKey && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => simulateThreat("xss_attempt")}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300"
                >
                  Simulate XSS
                </button>
                <button
                  onClick={() => simulateThreat("sql_injection")}
                  className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-300"
                >
                  Simulate SQLi
                </button>
                <button
                  onClick={() => simulateThreat("bot_behavior")}
                  className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300"
                >
                  Simulate Bot
                </button>
              </div>
            )}
          </div>

          {!siteKey ? (
            <div className="rounded-[2rem] border border-blue-400/20 bg-white/5 p-10 text-center backdrop-blur-xl">
              <p className="text-lg text-white/70">
                Register a site first to activate your dashboard.
              </p>
            </div>
          ) : dashboardLoading && !dashboard ? (
            <div className="rounded-[2rem] border border-blue-400/20 bg-white/5 p-10 text-center backdrop-blur-xl">
              <p className="text-lg text-white/70">Loading command center...</p>
            </div>
          ) : dashboard ? (
            <>
              <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Incidents" value={dashboard.stats.total} />
                <StatCard title="Critical Threats" value={dashboard.stats.critical} />
                <StatCard title="Blocked Events" value={dashboard.stats.blocked} />
                <StatCard title="Last 24 Hours" value={dashboard.stats.last_24h} />
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-blue-400/20 bg-white/5 backdrop-blur-xl">
                <div className="border-b border-white/10 px-6 py-5">
                  <h4 className="text-xl font-bold">Recent Threat Incidents</h4>
                  <p className="text-sm text-white/50">
                    Live telemetry from browser-side detection modules
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-black/30 text-sm text-blue-200/70">
                      <tr>
                        <th className="px-6 py-4">Threat</th>
                        <th className="px-6 py-4">Severity</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Blocked</th>
                        <th className="px-6 py-4">URL</th>
                        <th className="px-6 py-4">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.incidents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-white/50">
                            No incidents yet. Simulate one to test the system.
                          </td>
                        </tr>
                      ) : (
                        dashboard.incidents.map((incident) => (
                          <tr
                            key={incident.id}
                            className="border-t border-white/5 hover:bg-white/5"
                          >
                            <td className="px-6 py-4 font-medium">
                              {formatThreat(incident.threat_type)}
                            </td>
                            <td className="px-6 py-4">
                              <SeverityBadge severity={incident.severity} />
                            </td>
                            <td className="px-6 py-4">{incident.severity_score}</td>
                            <td className="px-6 py-4">
                              {incident.blocked ? "Yes" : "No"}
                            </td>
                            <td className="max-w-xs truncate px-6 py-4 text-white/60">
                              {incident.url}
                            </td>
                            <td className="px-6 py-4 text-white/50">
                              {incident.timestamp}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-500/10 px-6 py-8 text-center text-sm text-white/40">
        PhalanxAI — Browser-layer security for the modern web
      </footer>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-[2rem] border border-blue-400/20 bg-white/5 p-6 shadow-[0_0_40px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.25em] text-blue-300/60">{title}</p>
      <h4 className="mt-3 text-4xl font-black text-white">{value}</h4>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: "bg-red-500/15 text-red-300 border-red-500/20",
    high: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    low: "bg-green-500/15 text-green-300 border-green-500/20",
    info: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        styles[severity] || styles.info
      }`}
    >
      {severity}
    </span>
  );
}

function formatThreat(threat) {
  const labels = {
    xss_attempt: "XSS Injection",
    sql_injection: "SQL Injection",
    form_skimmer: "Form Skimmer",
    bot_behavior: "Bot Behaviour",
    suspicious_redirect: "Suspicious Redirect",
    data_exfiltration: "Data Exfiltration",
    csrf_attempt: "CSRF Attempt",
  };

  return labels[threat] || threat.replaceAll("_", " ");
}