import { useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Activity, Globe, Terminal, Settings,
  Search, Bell, LogOut, ChevronRight, AlertTriangle,
  Crosshair, X, Eye, Ban, Clock, Cpu, Wifi, Lock,
  TrendingUp, TrendingDown, Zap, BarChart2, List,
  RefreshCw, CheckCircle, XCircle, Filter
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, LineChart, Line
} from "recharts";
import { CyberMap } from "@/components/cyber-map";
import { ShieldCore } from "@/components/shield-core";
import { useThreatSimulation } from "@/hooks/use-threat-simulation";

// ─── Color constants (hex for SVG compatibility) ──────────────────────────────
const C = {
  primary: "#3b82f6",
  critical: "#ef4444",
  secure: "#22c55e",
  warning: "#f59e0b",
  anomaly: "#a855f7",
  muted: "#64748b",
  void: "#050508",
  glass: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
};

// ─── Static chart data ─────────────────────────────────────────────────────────
const areaData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  threats: Math.floor(Math.random() * 5000) + 800,
  blocked: Math.floor(Math.random() * 4200) + 600,
}));

const barData = Array.from({ length: 7 }, (_, i) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    day: days[i],
    critical: Math.floor(Math.random() * 300) + 50,
    warning: Math.floor(Math.random() * 600) + 100,
    anomaly: Math.floor(Math.random() * 400) + 80,
  };
});

const pieData = [
  { name: "DDoS", value: 34, color: C.critical },
  { name: "SQLi", value: 22, color: C.warning },
  { name: "XSS", value: 18, color: C.anomaly },
  { name: "Botnet", value: 14, color: C.primary },
  { name: "Brute Force", value: 12, color: C.secure },
];

const uptimeData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  uptime: 99.5 + Math.random() * 0.5,
}));

// ─── Glass Panel base component ───────────────────────────────────────────────
function Panel({ children, className = "", glow = "" }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderColor: glow ? `${glow}40` : "rgba(255,255,255,0.08)",
        boxShadow: glow
          ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${glow}20`
          : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────────
function PanelHeader({ title, badge, action }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-3">
        <span className="font-display text-xs font-bold tracking-widest text-slate-300">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono" style={{ background: "rgba(239,68,68,0.15)", color: C.critical, border: `1px solid ${C.critical}40` }}>
            {badge}
          </span>
        )}
      </div>
      {action && <div className="text-xs font-mono" style={{ color: C.muted }}>{action}</div>}
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ title, value, unit, trend, trendUp, icon: Icon, color, barPct }) {
  const colorVal = C[color] || C.primary;
  return (
    <Panel glow={colorVal}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest font-display" style={{ color: C.muted }}>{title}</span>
          <Icon className="w-4 h-4" style={{ color: `${colorVal}80` }} />
        </div>
        <div>
          <span className="text-2xl font-mono font-bold text-white">{value}</span>
          {unit && <span className="text-sm font-mono ml-1" style={{ color: C.muted }}>{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {trendUp ? <TrendingUp className="w-3 h-3" style={{ color: C.secure }} /> : <TrendingDown className="w-3 h-3" style={{ color: C.critical }} />}
            <span style={{ color: trendUp ? C.secure : C.critical }}>{trend}</span>
          </div>
        )}
        {barPct !== undefined && (
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${barPct}%`, background: colorVal }} />
          </div>
        )}
      </div>
    </Panel>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ sev }) {
  const map = {
    CRITICAL: { bg: "rgba(239,68,68,0.15)", color: C.critical, border: `${C.critical}40` },
    WARNING:  { bg: "rgba(245,158,11,0.15)", color: C.warning,  border: `${C.warning}40` },
    ANOMALY:  { bg: "rgba(168,85,247,0.15)", color: C.anomaly,  border: `${C.anomaly}40` },
    SECURE:   { bg: "rgba(34,197,94,0.15)",  color: C.secure,   border: `${C.secure}40` },
  };
  const s = map[sev] || map.ANOMALY;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {sev}
    </span>
  );
}

// ─── Action badge ─────────────────────────────────────────────────────────────
function ActionBadge({ action }) {
  const map = {
    BLOCKED:   { color: C.critical },
    DIVERTED:  { color: C.warning },
    LOGGED:    { color: C.primary },
    ANALYZING: { color: C.anomaly },
  };
  const s = map[action] || { color: C.muted };
  return <span className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{action}</span>;
}

// ─── DETAIL DRAWER ────────────────────────────────────────────────────────────
function DetailDrawer({ event, onClose }) {
  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 flex flex-col"
            style={{
              background: "rgba(5,5,8,0.97)",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(30px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div>
                <p className="text-[11px] font-mono tracking-widest" style={{ color: C.muted }}>INCIDENT DOSSIER</p>
                <h2 className="font-display font-bold text-xl tracking-widest mt-0.5">{event.id}</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: C.muted }}>SEVERITY</p>
                  <SeverityBadge sev={event.severity} />
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: C.muted }}>ACTION TAKEN</p>
                  <ActionBadge action={event.action} />
                </div>
              </div>

              {/* Threat info */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: C.muted }}>THREAT TYPE</p>
                  <p className="font-medium text-white">{event.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: C.muted }}>SOURCE IP / REGION</p>
                  <p className="font-mono text-white">{event.ip} <span style={{ color: C.muted }}>[{event.country}]</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: C.muted }}>TIMESTAMP</p>
                  <p className="font-mono text-sm text-white">{new Date(event.timestamp).toISOString()}</p>
                </div>
              </div>

              {/* Packet trace */}
              <div>
                <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: C.muted }}>PACKET TRACE</p>
                <div className="rounded-xl p-4 font-mono text-xs space-y-1.5 relative overflow-hidden" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: C.muted }}>0x0000: 4500 003c 1c46 4000 4006 b1e6 c0a8</p>
                  <p style={{ color: C.muted }}>0x0010: 0101 c0a8 01c8 0050 01bb 0000 0000</p>
                  <p style={{ color: C.critical }}>0x0020: 5002 2000 4c2a 0000 4745 5420 2f20</p>
                  <p style={{ color: C.critical }}>0x0030: 4854 5450 2f31 2e31 0d0a 486f 7374</p>
                  <p style={{ color: C.muted }}>0x0040: 3a20 3139 322e 3136 382e 312e 3230</p>
                  <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))" }} />
                </div>
              </div>

              {/* Rule triggered */}
              <div className="rounded-xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: `1px solid ${C.primary}30` }}>
                <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: C.primary }}>RULE TRIGGERED</p>
                <p className="font-mono text-sm text-white">WAF-RULE-{Math.floor(Math.random() * 9000) + 1000} / OWASP-CRS-3.3</p>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: `1px solid ${C.secure}30` }}>
                <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: C.secure }}>RECOMMENDATION</p>
                <p className="text-sm text-white opacity-80">
                  {event.severity === "CRITICAL"
                    ? "Immediately block this IP range at the firewall level. Consider geo-blocking the originating region."
                    : "Monitor for repeat activity. Add to watchlist and review access logs for correlated requests."}
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t flex gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all"
                style={{ background: C.primary }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Extract Profile
              </button>
              <button className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all"
                style={{ background: "rgba(239,68,68,0.15)", border: `1px solid ${C.critical}40` }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
              >
                Add to Blacklist
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Custom Tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs font-mono" style={{ background: "rgba(5,5,8,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="mb-1" style={{ color: C.muted }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

// ─── VIEW: OVERVIEW ───────────────────────────────────────────────────────────
function OverviewView({ events, stats, onSelectEvent }) {
  const criticalCount = events.filter(e => e.severity === "CRITICAL").length;

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="THREATS NEUTRALIZED" value={stats.neutralized.toLocaleString()} icon={Crosshair} color="primary" barPct={72} trend="+2.4% today" trendUp={false} />
        <MetricCard title="SYSTEM LOAD" value={stats.systemLoad.toFixed(1)} unit="%" icon={Cpu} color="warning" barPct={stats.systemLoad} trend="-1.2% vs avg" trendUp={true} />
        <MetricCard title="LIVE SESSIONS" value={stats.activeSessions.toLocaleString()} icon={Wifi} color="secure" barPct={58} trend="+134 active" trendUp={true} />
        <MetricCard title="FIREWALL ACTIONS" value={stats.firewallActions.toLocaleString()} icon={Shield} color="anomaly" barPct={45} trend={`${criticalCount} critical`} trendUp={false} />
      </div>

      {/* Second row: metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="CRITICAL THREATS" value={criticalCount.toString()} icon={AlertTriangle} color="critical" barPct={criticalCount * 5} />
        <MetricCard title="UPTIME" value="99.98" unit="%" icon={CheckCircle} color="secure" barPct={99.98} />
        <MetricCard title="RESPONSE TIME" value="12" unit="ms" icon={Zap} color="primary" barPct={20} />
        <MetricCard title="COUNTRIES MONITORED" value="147" icon={Globe} color="anomaly" barPct={80} />
      </div>

      {/* Map + Incident Feed */}
      <div className="grid xl:grid-cols-3 gap-5" style={{ minHeight: 380 }}>
        <div className="xl:col-span-2 flex flex-col">
          <Panel className="flex-1 flex flex-col">
            <PanelHeader title="GLOBAL THREAT VECTOR" action={<span className="animate-pulse" style={{ color: C.primary }}>● LIVE</span>} />
            <div className="flex-1 relative" style={{ minHeight: 300 }}>
              <CyberMap />
            </div>
          </Panel>
        </div>

        <Panel className="flex flex-col" style={{ maxHeight: 420 }}>
          <PanelHeader title="INCIDENT STREAM" badge={`${criticalCount} CRITICAL`} />
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            <AnimatePresence initial={false}>
              {events.slice(0, 20).map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onSelectEvent(evt)}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: evt.severity === "CRITICAL" ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${evt.severity === "CRITICAL" ? `${C.critical}30` : "rgba(255,255,255,0.06)"}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = evt.severity === "CRITICAL" ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)"}
                >
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{
                    background: evt.severity === "CRITICAL" ? C.critical : evt.severity === "WARNING" ? C.warning : C.anomaly,
                    boxShadow: `0 0 6px ${evt.severity === "CRITICAL" ? C.critical : evt.severity === "WARNING" ? C.warning : C.anomaly}`,
                  }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold truncate text-white">{evt.type}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: C.muted }}>{evt.ip} [{evt.country}]</p>
                  </div>
                  <div className="text-right shrink-0">
                    <SeverityBadge sev={evt.severity} />
                    <p className="text-[9px] font-mono mt-1" style={{ color: C.muted }}>{new Date(evt.timestamp).toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-7 gap-5">
        {/* Area chart */}
        <Panel className="xl:col-span-4 flex flex-col" style={{ height: 280 }}>
          <PanelHeader title="ATTACK VOLUME (24H)" />
          <div className="flex-1 p-4 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.secure} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.secure} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="threats" name="Threats" stroke={C.primary} fill="url(#gThreats)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke={C.secure} fill="url(#gBlocked)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Pie chart */}
        <Panel className="xl:col-span-2 flex flex-col" style={{ height: 280 }}>
          <PanelHeader title="THREAT CATEGORIES" />
          <div className="flex-1 flex flex-col p-3 min-h-0">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} style={{ filter: `drop-shadow(0 0 4px ${entry.color}60)` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 pb-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                  </div>
                  <span className="text-white font-bold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Shield core */}
        <Panel className="xl:col-span-1 flex items-center justify-center p-4" style={{ height: 280 }}>
          <ShieldCore health={stats.health} />
        </Panel>
      </div>
    </div>
  );
}

// ─── VIEW: THREAT INTEL ───────────────────────────────────────────────────────
function ThreatIntelView({ events, onSelectEvent }) {
  const [filter, setFilter] = useState("ALL");
  const severities = ["ALL", "CRITICAL", "WARNING", "ANOMALY"];
  const filtered = filter === "ALL" ? events : events.filter(e => e.severity === filter);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "CRITICAL", count: events.filter(e => e.severity === "CRITICAL").length, color: C.critical },
          { label: "WARNING",  count: events.filter(e => e.severity === "WARNING").length,  color: C.warning },
          { label: "ANOMALY",  count: events.filter(e => e.severity === "ANOMALY").length,  color: C.anomaly },
          { label: "TOTAL",    count: events.length, color: C.primary },
        ].map((s, i) => (
          <Panel key={i} glow={s.color}>
            <div className="p-4">
              <p className="text-[10px] font-bold tracking-widest font-display mb-2" style={{ color: s.color }}>{s.label}</p>
              <p className="text-3xl font-mono font-bold text-white">{s.count}</p>
            </div>
          </Panel>
        ))}
      </div>

      {/* Incident table */}
      <Panel>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-display text-xs font-bold tracking-widest text-slate-300">THREAT EVENTS</span>
          <div className="flex gap-2">
            {severities.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="text-[10px] font-bold font-mono px-3 py-1 rounded-full transition-all"
                style={{
                  background: filter === s ? (s === "ALL" ? C.primary : C[s.toLowerCase()] || C.primary) + "20" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filter === s ? (s === "ALL" ? C.primary : C[s.toLowerCase()] || C.primary) + "50" : "rgba(255,255,255,0.08)"}`,
                  color: filter === s ? (s === "ALL" ? C.primary : C[s.toLowerCase()] || C.primary) : C.muted,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold tracking-widest font-display border-b" style={{ borderColor: "rgba(255,255,255,0.04)", color: C.muted }}>
          <span className="col-span-2">ID</span>
          <span className="col-span-3">TYPE</span>
          <span className="col-span-2">SOURCE IP</span>
          <span className="col-span-1">REGION</span>
          <span className="col-span-2">SEVERITY</span>
          <span className="col-span-1">ACTION</span>
          <span className="col-span-1 text-right">TIME</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
          <AnimatePresence initial={false}>
            {filtered.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => onSelectEvent(evt)}
                className="grid grid-cols-12 px-5 py-3 text-xs font-mono cursor-pointer border-b transition-all"
                style={{ borderColor: "rgba(255,255,255,0.04)", color: C.muted }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span className="col-span-2 font-bold text-white">{evt.id}</span>
                <span className="col-span-3 truncate text-white">{evt.type}</span>
                <span className="col-span-2">{evt.ip}</span>
                <span className="col-span-1">{evt.country}</span>
                <span className="col-span-2"><SeverityBadge sev={evt.severity} /></span>
                <span className="col-span-1"><ActionBadge action={evt.action} /></span>
                <span className="col-span-1 text-right">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-12 font-mono text-sm" style={{ color: C.muted }}>No events for selected filter.</div>
          )}
        </div>
      </Panel>

      {/* Weekly bar chart */}
      <Panel style={{ height: 260 }}>
        <PanelHeader title="WEEKLY ATTACK DISTRIBUTION" />
        <div className="flex-1 p-4" style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke={C.muted} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={C.muted} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="critical" name="Critical" fill={C.critical} radius={[2, 2, 0, 0]} fillOpacity={0.8} />
              <Bar dataKey="warning"  name="Warning"  fill={C.warning}  radius={[2, 2, 0, 0]} fillOpacity={0.8} />
              <Bar dataKey="anomaly"  name="Anomaly"  fill={C.anomaly}  radius={[2, 2, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

// ─── VIEW: GLOBAL MAP ─────────────────────────────────────────────────────────
function GlobalMapView({ events }) {
  const criticalCount = events.filter(e => e.severity === "CRITICAL").length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "ATTACK ORIGINS", value: "47 countries", color: C.critical },
          { label: "BLOCKED ROUTES", value: "2,341 IPs", color: C.warning },
          { label: "PROTECTED NODES", value: "12 endpoints", color: C.secure },
        ].map((s, i) => (
          <Panel key={i} glow={s.color}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest font-display mb-1" style={{ color: s.color }}>{s.label}</p>
                <p className="text-xl font-mono font-bold text-white">{s.value}</p>
              </div>
              <Globe className="w-8 h-8 opacity-20" style={{ color: s.color }} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="flex flex-col" style={{ height: 520 }}>
        <PanelHeader title="GLOBAL THREAT VECTOR MAP" action={<span className="animate-pulse" style={{ color: C.critical }}>● {criticalCount} CRITICAL VECTORS</span>} />
        <div className="flex-1 relative">
          <CyberMap />
        </div>
      </Panel>

      {/* Live region breakdown */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { region: "EAST ASIA", threats: 847, pct: 34, color: C.critical },
          { region: "EUROPE",    threats: 623, pct: 25, color: C.warning },
          { region: "N. AMERICA",threats: 411, pct: 17, color: C.anomaly },
          { region: "OTHER",     threats: 582, pct: 24, color: C.primary },
        ].map((r, i) => (
          <Panel key={i}>
            <div className="p-4">
              <p className="text-[10px] font-bold tracking-widest font-display mb-2" style={{ color: C.muted }}>{r.region}</p>
              <p className="text-2xl font-mono font-bold text-white mb-3">{r.threats}</p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
              <p className="text-[10px] font-mono mt-1.5" style={{ color: C.muted }}>{r.pct}% of traffic</p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─── VIEW: SYSTEM LOGS ────────────────────────────────────────────────────────
function SystemLogsView({ events }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "LOG ENTRIES",    value: events.length, color: C.primary },
          { label: "ERRORS",         value: events.filter(e => e.severity === "CRITICAL").length, color: C.critical },
          { label: "WARNINGS",       value: events.filter(e => e.severity === "WARNING").length,  color: C.warning },
          { label: "LOG RETENTION",  value: "30d",  color: C.secure },
        ].map((s, i) => (
          <Panel key={i} glow={s.color}>
            <div className="p-4">
              <p className="text-[10px] font-bold tracking-widest font-display mb-2" style={{ color: s.color }}>{s.label}</p>
              <p className="text-2xl font-mono font-bold text-white">{s.value}</p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader title="SYSTEM LOG STREAM" action="LIVE" />
        <div className="overflow-y-auto font-mono text-xs" style={{ maxHeight: 580, background: "rgba(0,0,0,0.4)" }}>
          {events.map((evt, i) => {
            const prefix = evt.severity === "CRITICAL" ? "[CRIT]" : evt.severity === "WARNING" ? "[WARN]" : "[INFO]";
            const prefixColor = evt.severity === "CRITICAL" ? C.critical : evt.severity === "WARNING" ? C.warning : C.muted;
            return (
              <div key={evt.id} className="flex items-start gap-3 px-5 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                <span style={{ color: C.muted, whiteSpace: "nowrap" }}>{new Date(evt.timestamp).toISOString().split("T")[1].split(".")[0]}</span>
                <span className="font-bold shrink-0" style={{ color: prefixColor }}>{prefix}</span>
                <span className="text-white">{evt.type}</span>
                <span style={{ color: C.muted }}>from {evt.ip} [{evt.country}]</span>
                <span className="ml-auto shrink-0" style={{ color: C.anomaly }}>→ {evt.action}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Uptime chart */}
      <Panel style={{ height: 200 }}>
        <PanelHeader title="SYSTEM UPTIME (30D)" />
        <div style={{ height: 155 }} className="p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={uptimeData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis dataKey="day" stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} domain={[99, 100.1]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="uptime" name="Uptime %" stroke={C.secure} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

// ─── VIEW: CONFIGURATION ──────────────────────────────────────────────────────
function ConfigurationView() {
  const [rules, setRules] = useState([
    { id: "WAF-001", name: "SQL Injection Detection", enabled: true, severity: "CRITICAL" },
    { id: "WAF-002", name: "XSS Pattern Matching", enabled: true, severity: "WARNING" },
    { id: "WAF-003", name: "DDoS Rate Limiter", enabled: true, severity: "CRITICAL" },
    { id: "WAF-004", name: "Bot Fingerprinting", enabled: false, severity: "ANOMALY" },
    { id: "WAF-005", name: "Geo-IP Blocking", enabled: true, severity: "WARNING" },
    { id: "WAF-006", name: "Zero-Day Heuristics", enabled: true, severity: "CRITICAL" },
    { id: "WAF-007", name: "API Abuse Detection", enabled: false, severity: "ANOMALY" },
    { id: "WAF-008", name: "Credential Stuffing Guard", enabled: true, severity: "WARNING" },
  ]);

  const toggle = useCallback((id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  return (
    <div className="space-y-5">
      {/* System status */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "WAF STATUS",    value: "ACTIVE",    color: C.secure,   icon: CheckCircle },
          { label: "RULES LOADED",  value: `${rules.filter(r => r.enabled).length}/${rules.length}`, color: C.primary, icon: List },
          { label: "ENGINE VERSION",value: "v3.0.4",    color: C.anomaly,  icon: Cpu },
          { label: "LAST SYNC",     value: "2 min ago", color: C.warning,  icon: RefreshCw },
        ].map((s, i) => (
          <Panel key={i} glow={s.color}>
            <div className="p-4 flex items-center gap-4">
              <s.icon className="w-8 h-8 shrink-0" style={{ color: s.color, opacity: 0.7 }} />
              <div>
                <p className="text-[10px] font-bold tracking-widest font-display mb-0.5" style={{ color: C.muted }}>{s.label}</p>
                <p className="text-lg font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Rules table */}
      <Panel>
        <PanelHeader title="WAF RULE CONFIGURATION" action={`${rules.filter(r => r.enabled).length} ACTIVE`} />
        <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{
                background: rule.enabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                borderColor: rule.enabled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold" style={{ color: C.muted }}>{rule.id}</span>
                  <SeverityBadge sev={rule.severity} />
                </div>
                <p className="text-sm font-medium text-white truncate">{rule.name}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggle(rule.id)}
                className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
                style={{ background: rule.enabled ? C.secure : "rgba(255,255,255,0.1)", boxShadow: rule.enabled ? `0 0 10px ${C.secure}60` : "none" }}
              >
                <span
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                  style={{ left: rule.enabled ? "calc(100% - 20px)" : "4px" }}
                />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      {/* Blocked regions */}
      <Panel>
        <PanelHeader title="BLOCKED REGIONS" action="EDIT" />
        <div className="p-4 flex flex-wrap gap-2">
          {["NORTH KOREA", "IRAN", "RUSSIA (AS43690)", "CHINA (AS4134)", "DARKNET EXIT NODES"].map((region, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.critical}30` }}>
              <Ban className="w-3 h-3" style={{ color: C.critical }} />
              <span className="text-xs font-mono text-white">{region}</span>
            </div>
          ))}
          <button className="px-3 py-1.5 rounded-full text-xs font-mono text-white transition-all" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >+ Add Region</button>
        </div>
      </Panel>
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",      icon: Activity,       label: "Command Overview" },
  { id: "threats",       icon: AlertTriangle,   label: "Threat Intel" },
  { id: "map",           icon: Globe,           label: "Global Map" },
  { id: "logs",          icon: Terminal,        label: "System Logs" },
  { id: "config",        icon: Settings,        label: "Configuration" },
];

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { events, stats } = useThreatSimulation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const criticalCount = events.filter(e => e.severity === "CRITICAL").length;

  const viewProps = { events, stats, onSelectEvent: setSelectedEvent };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: C.void, color: "#f1f5f9" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside
        className="w-16 md:w-60 flex flex-col py-5 shrink-0 z-20"
        style={{ borderRight: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-4 md:px-5 mb-8 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)" }}
          >
            <Shield className="w-5 h-5" style={{ color: C.primary }} />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ background: C.critical }} />
            )}
          </div>
          <span className="font-display font-bold text-base tracking-widest text-white hidden md:block" style={{ textShadow: `0 0 20px ${C.primary}60` }}>
            PHALANX
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full text-left"
                style={{
                  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(59,130,246,0.35)" : "transparent"}`,
                  color: isActive ? C.primary : C.muted,
                  boxShadow: isActive ? `inset 3px 0 0 ${C.primary}` : "none",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fff"; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium hidden md:block flex-1">{item.label}</span>
                {item.id === "threats" && criticalCount > 0 && (
                  <span className="hidden md:flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: C.critical, color: "#fff", minWidth: 20 }}>
                    {criticalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom exit */}
        <div className="px-2 mt-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl w-full transition-all" style={{ color: C.muted }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium hidden md:block">Exit Console</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="h-14 flex items-center gap-4 px-5 shrink-0 z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,5,8,0.7)", backdropFilter: "blur(20px)" }}
        >
          {/* Page title */}
          <h1 className="font-display font-bold text-sm tracking-widest text-white hidden md:block">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label.toUpperCase()}
          </h1>

          {/* Search */}
          <div className="relative flex-1 max-w-xs ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search IPs, events, nodes..."
              className="w-full pl-9 pr-4 py-1.5 text-sm font-mono text-white rounded-lg outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={e => e.target.style.borderColor = `${C.primary}60`}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold" style={{ background: "rgba(34,197,94,0.1)", border: `1px solid ${C.secure}40`, color: C.secure }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.secure }} />
              <span className="hidden sm:inline">PROTECTED</span>
            </div>

            {/* Notifications */}
            <button className="relative" style={{ color: C.muted }}>
              <Bell className="w-5 h-5" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: C.critical }}>
                  {criticalCount}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" alt="Operator" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {activeTab === "overview" && <OverviewView {...viewProps} />}
              {activeTab === "threats"  && <ThreatIntelView events={events} onSelectEvent={setSelectedEvent} />}
              {activeTab === "map"      && <GlobalMapView events={events} />}
              {activeTab === "logs"     && <SystemLogsView events={events} />}
              {activeTab === "config"   && <ConfigurationView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Detail drawer */}
      <DetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
