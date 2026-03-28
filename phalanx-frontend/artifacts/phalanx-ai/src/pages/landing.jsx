import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Shield, Activity, Lock, Server, ArrowRight, PlayCircle,
  X, Zap, Eye, Globe, ChevronRight, CheckCircle, AlertTriangle,
  Cpu, Wifi, Terminal
} from "lucide-react";
import { useThreatSimulation } from "@/hooks/use-threat-simulation";

// ─── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: "#3b82f6",
  critical: "#ef4444",
  secure: "#22c55e",
  warning: "#f59e0b",
  anomaly: "#a855f7",
  muted: "#475569",
  bg: "#000000",
};

// ─── Particle Canvas Background ────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let mouse = { x: W / 2, y: H / 2 };

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    // Grid lines
    const COLS = 30, ROWS = 18;
    // Particles
    const PCOUNT = 80;
    const particles = Array.from({ length: PCOUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random(),
    }));

    let frame = 0;
    let animId;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Pure black base
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      // Radial gradient center light
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.55);
      grd.addColorStop(0, "rgba(59,130,246,0.07)");
      grd.addColorStop(0.5, "rgba(168,85,247,0.03)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Mouse reactive glow
      const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
      mg.addColorStop(0, "rgba(59,130,246,0.04)");
      mg.addColorStop(1, "transparent");
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, H);

      // Cyber grid
      const cw = W / COLS, ch = H / ROWS;
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(W, r * ch); ctx.stroke();
      }

      // Occasional grid node highlights
      if (frame % 90 === 0) {
        const nx = Math.floor(Math.random() * COLS) * cw + cw / 2;
        const ny = Math.floor(Math.random() * ROWS) * ch + ch / 2;
        ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59,130,246,0.6)"; ctx.fill();
      }

      // Particles + connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${p.a * 0.4})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(59,130,246,${(1 - dist / 120) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Occasional scan line
      const scanY = ((frame * 1.2) % (H + 60)) - 30;
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(59,130,246,0.04)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, W, 40);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMouse); };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Rotating Shield SVG (hero holographic) ────────────────────────────────────
function HolographicShield() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer pulse rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 80 + i * 60, height: 80 + i * 60,
            borderColor: `rgba(59,130,246,${0.15 - i * 0.04})`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2 + i * 0.7, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
      {/* Rotating outer ring */}
      <motion.svg
        className="absolute"
        width={260} height={260}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <circle cx={130} cy={130} r={120} fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="8 12" />
        <circle cx={130} cy={130} r={108} fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="0.5" strokeDasharray="4 20" />
      </motion.svg>
      {/* Counter-rotating inner ring */}
      <motion.svg
        className="absolute"
        width={180} height={180}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <circle cx={90} cy={90} r={82} fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="3 9" />
      </motion.svg>

      {/* Central shield icon */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        style={{ width: 100, height: 100 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        <Shield
          className="w-16 h-16 relative z-10"
          style={{ color: C.primary, filter: `drop-shadow(0 0 16px ${C.primary})` }}
        />
      </motion.div>
    </div>
  );
}

// ─── Simulation Modal ──────────────────────────────────────────────────────────
function SimulationModal({ onClose }) {
  const [phase, setPhase] = useState(0);
  const [log, setLog] = useState([]);

  const SIM_STEPS = [
    { t: 400,  msg: "[INIT] Phalanx sentinel layer active…",           color: C.primary },
    { t: 900,  msg: "[SCAN] Incoming vector detected — 103.14.22.98",  color: C.warning },
    { t: 1400, msg: "[THREAT] SQL injection payload identified",        color: C.critical },
    { t: 1900, msg: "[AI] Threat score: 97.4 / 100 — CRITICAL",        color: C.critical },
    { t: 2400, msg: "[FIREWALL] Countermeasure deployed in 4ms",        color: C.anomaly },
    { t: 2900, msg: "[BLOCK] Packet dropped. IP flagged.",              color: C.warning },
    { t: 3400, msg: "[GEO] Region AS14061 added to deny-list",         color: C.anomaly },
    { t: 3900, msg: "[SECURE] Attack surface restored — 0 breaches",   color: C.secure },
    { t: 4400, msg: "[STATUS] Shield integrity: 100% ✓",               color: C.secure },
  ];

  useEffect(() => {
    SIM_STEPS.forEach(({ t, msg, color }) => {
      setTimeout(() => setLog(prev => [...prev, { msg, color }]), t);
    });
    setTimeout(() => setPhase(1), 4600);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.95)",
          border: "1px solid rgba(59,130,246,0.3)",
          boxShadow: "0 0 60px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(59,130,246,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.critical }} />
            <span className="font-display text-sm font-bold tracking-widest" style={{ color: C.primary }}>
              LIVE ATTACK SIMULATION
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal */}
        <div className="p-6 font-mono text-xs space-y-2" style={{ minHeight: 300, background: "rgba(0,0,0,0.8)" }}>
          <p style={{ color: C.muted }}>$ phalanx --simulate-attack --mode=realtime --target=edge-node-01</p>
          <p style={{ color: C.muted }}>──────────────────────────────────────────</p>
          {log.map((entry, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ color: entry.color }}
            >
              {entry.msg}
            </motion.p>
          ))}
          {phase === 0 && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ color: C.primary }}
            >▌</motion.span>
          )}
        </div>

        {/* Footer */}
        {phase === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: C.secure }} />
              <span className="text-sm font-mono font-bold" style={{ color: C.secure }}>THREAT NEUTRALIZED — 0 BREACHES</span>
            </div>
            <Link href="/dashboard" onClick={onClose}>
              <button className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
                style={{ background: C.primary }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Open Dashboard →
              </button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Marquee trust band ────────────────────────────────────────────────────────
function Marquee({ items, direction = 1, speed = 40 }) {
  const doubled = [...items, ...items];
  const duration = items.length * speed / 10;

  return (
    <div className="overflow-hidden relative">
      <motion.div
        className="flex gap-16 items-center"
        animate={{ x: direction > 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{ width: "max-content" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <item.icon className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
            </div>
            <span className="font-display font-bold text-base tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
              {item.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const duration = 2000;
          const step = (ts) => {
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(eased * target);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString();

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Unsplash image URLs ───────────────────────────────────────────────────────
const IMGS = {
  datacenter:  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  network:     "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  servers:     "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800&q=80",
  binary:      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
  // AI imagery
  aiBrain:     "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1000&q=80",
  aiRobot:     "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  aiCircuit:   "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
  aiNeural:    "https://images.unsplash.com/photo-1655720840564-a35c5f0a2c55?w=800&q=80",
  aiEye:       "https://images.unsplash.com/photo-1614064548016-0b5c13ca2c85?w=800&q=80",
  aiGlow:      "https://images.unsplash.com/photo-1685117579133-232b89b2df0b?w=1200&q=80",
};

const TRUST_ITEMS = [
  { name: "AXIOM SYSTEMS",   icon: Cpu },
  { name: "WEYLAND CORP",    icon: Globe },
  { name: "CYBERDYNE",       icon: Shield },
  { name: "OMNICORP",        icon: Terminal },
  { name: "STARK TECH",      icon: Zap },
  { name: "UMBRELLA INT.",   icon: Lock },
  { name: "TYRELL CORP",     icon: Eye },
  { name: "APERTURE SEC",    icon: Wifi },
];

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export default function Landing() {
  const { events } = useThreatSimulation();
  const [simOpen, setSimOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "#000000", color: "#f1f5f9" }}>
      <ParticleCanvas />

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}
          >
            <Shield className="w-5 h-5" style={{ color: C.primary }} />
          </div>
          <span className="font-display font-bold text-xl tracking-widest text-white" style={{ textShadow: `0 0 20px ${C.primary}50` }}>
            PHALANX<span style={{ color: C.primary }}>AI</span>
          </span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#architecture" className="text-sm font-medium transition-colors hidden md:block" style={{ color: C.muted }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >Architecture</a>
          <a href="#telemetry" className="text-sm font-medium transition-colors hidden md:block" style={{ color: C.muted }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >Telemetry</a>
          <a href="#trust" className="text-sm font-medium transition-colors hidden md:block" style={{ color: C.muted }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = C.muted}
          >Network</a>
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: C.primary, boxShadow: `0 0 0 0 ${C.primary}` }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            Command Center <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>

        {/* ── Full-bleed background image ── */}
        <div className="absolute inset-0">
          <img
            src={IMGS.aiBrain}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.18) saturate(1.4) hue-rotate(190deg)", transform: "scale(1.06)" }}
          />
          {/* Dark overlay gradients */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 80%, #000 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.8) 100%)" }} />
        </div>

        {/* ── Central deep glow orb ── */}
        <div className="absolute pointer-events-none" style={{
          top: "35%", left: "50%", transform: "translate(-50%, -50%)",
          width: 700, height: 700,
          background: `radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(168,85,247,0.07) 40%, transparent 70%)`,
          filter: "blur(40px)",
        }} />
        {/* Secondary anomaly glow */}
        <div className="absolute pointer-events-none" style={{
          top: "45%", left: "48%", transform: "translate(-50%,-50%)",
          width: 400, height: 400,
          background: `radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 60%)`,
          filter: "blur(30px)",
        }} />

        {/* ── Rotating hex grid lines in background ── */}
        <motion.svg
          className="absolute pointer-events-none opacity-10"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        >
          {[60,120,180,240,300,360].map((r, i) => (
            <circle key={i} cx={400} cy={400} r={r} fill="none" stroke={i % 2 === 0 ? C.primary : C.anomaly} strokeWidth="0.5" strokeDasharray={`${i * 3 + 4} ${i * 4 + 12}`} opacity={0.5} />
          ))}
        </motion.svg>
        <motion.svg
          className="absolute pointer-events-none opacity-[0.06]"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 900 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          {[80,160,240,320,400].map((r, i) => (
            <circle key={i} cx={450} cy={450} r={r} fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 16" />
          ))}
        </motion.svg>

        {/* ── MAIN CONTENT ── */}
        <div className="relative w-full max-w-6xl mx-auto px-6 flex flex-col items-center text-center pt-32 pb-20" style={{ zIndex: 2 }}>

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10 font-mono text-xs font-bold tracking-widest"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: C.primary,
              backdropFilter: "blur(12px)",
              boxShadow: `0 0 30px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: C.secure }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            SENTINEL NETWORK ONLINE — v3.0.4
            <span className="w-px h-3 mx-1" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span style={{ color: C.secure }}>ALL SYSTEMS NOMINAL</span>
          </motion.div>

          {/* HEADLINE — staggered word reveal */}
          <div className="overflow-hidden mb-4">
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                className="font-display font-black text-white leading-none"
                style={{ fontSize: "clamp(4.5rem, 11vw, 9rem)", letterSpacing: "-0.03em", lineHeight: 0.9 }}
              >
                YOUR
              </h1>
            </motion.div>
          </div>
          <div className="overflow-hidden mb-2">
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.38, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                className="font-display font-black text-white leading-none"
                style={{ fontSize: "clamp(4.5rem, 11vw, 9rem)", letterSpacing: "-0.03em", lineHeight: 0.9 }}
              >
                WEBSITE'S
              </h1>
            </motion.div>
          </div>
          <div className="overflow-hidden mb-10">
            <motion.div
              initial={{ y: 140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.52, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                className="font-display font-black leading-none"
                style={{
                  fontSize: "clamp(4.5rem, 11vw, 9rem)",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.9,
                  background: `linear-gradient(110deg, ${C.primary} 0%, #818cf8 40%, ${C.anomaly} 70%, #ec4899 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 0 60px rgba(59,130,246,0.5)) drop-shadow(0 0 120px rgba(168,85,247,0.3))`,
                }}
              >
                IMMUNE SYSTEM
              </h1>
            </motion.div>
          </div>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="text-xl leading-relaxed max-w-2xl mb-10"
            style={{ color: "rgba(148,163,184,0.85)" }}
          >
            Military-grade AI cybersecurity that predicts, intercepts, and neutralizes
            threats in under <span style={{ color: C.primary, fontWeight: 700 }}>12 milliseconds</span> —
            before they ever reach your infrastructure.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-14"
          >
            <Link href="/dashboard">
              <button
                className="group relative flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white overflow-hidden transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${C.primary}, #6366f1)` }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow = `0 20px 60px rgba(59,130,246,0.55), 0 0 0 1px rgba(99,102,241,0.4)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Shimmer sweep */}
                <span className="absolute inset-0 pointer-events-none" style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                  transform: "translateX(-100%)",
                  transition: "transform 0.6s",
                }} />
                <Shield className="w-5 h-5" />
                Deploy Shield
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            </Link>
            <button
              onClick={() => setSimOpen(true)}
              className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(12px)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
            >
              <PlayCircle className="w-5 h-5" />
              Watch Simulation
            </button>
          </motion.div>

          {/* Trust badges row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {[
              { icon: CheckCircle, label: "SOC 2 Type II", color: C.secure },
              { icon: CheckCircle, label: "ISO 27001",      color: C.secure },
              { icon: CheckCircle, label: "GDPR Compliant", color: C.secure },
              { icon: CheckCircle, label: "Zero Downtime",  color: C.primary },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "#334155" }}>
                <b.icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                {b.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Floating live intercept panel (bottom-right) ── */}
        <motion.div
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
          className="absolute bottom-16 right-8 w-80"
          style={{ zIndex: 3 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: C.primary }} />
                <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: C.primary }}>LIVE INTERCEPT</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px]" style={{ color: C.muted }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.secure }} />
                TLS 1.3
              </div>
            </div>
            {/* Rows */}
            <div className="px-3 py-2 space-y-1.5 max-h-52 overflow-hidden">
              <AnimatePresence initial={false}>
                {events.slice(0, 5).map((evt) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{
                      background: evt.severity === "CRITICAL" ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${evt.severity === "CRITICAL" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                        background: evt.severity === "CRITICAL" ? C.critical : evt.severity === "WARNING" ? C.warning : C.anomaly,
                        boxShadow: `0 0 6px ${evt.severity === "CRITICAL" ? C.critical : C.warning}`,
                      }} />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-white truncate">{evt.ip}</p>
                        <p className="text-[9px] truncate" style={{ color: "#475569" }}>{evt.type}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ml-2" style={{
                      background: evt.action === "BLOCKED" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                      color: evt.action === "BLOCKED" ? C.critical : C.primary,
                      border: `1px solid ${evt.action === "BLOCKED" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
                    }}>
                      {evt.action}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 font-mono text-[9px]" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(34,197,94,0.04)" }}>
              <span style={{ color: C.secure }}>● SHIELD 99.9%</span>
              <span style={{ color: "#334155" }}>AVG 12ms</span>
              <span style={{ color: C.critical }}>
                ⚠ {events.filter(e => e.severity === "CRITICAL").length} CRITICAL
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Floating live stat chips (left side) ── */}
        <div className="absolute left-8 bottom-16 flex flex-col gap-3" style={{ zIndex: 3 }}>
          {[
            { label: "THREATS TODAY",    val: "2,438,921", color: C.primary   },
            { label: "UPTIME",           val: "99.98%",    color: C.secure    },
            { label: "AVG RESPONSE",     val: "12ms",      color: C.warning   },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 + i * 0.1 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-mono"
              style={{
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(16px)",
                border: `1px solid rgba(255,255,255,0.07)`,
              }}
            >
              <span className="text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
              <span className="text-[9px] tracking-widest" style={{ color: "#334155" }}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom vignette to section below */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ color: "#1e293b", zIndex: 3 }}
        >
          <span className="text-[9px] font-mono tracking-[0.3em]">SCROLL</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </motion.div>
      </section>

      {/* ── AI IMAGERY SHOWCASE ──────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="font-mono text-xs tracking-widest mb-3" style={{ color: C.anomaly }}>
              POWERED BY
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
              AUTONOMOUS AI ENGINE
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: C.muted }}>
              Neural threat intelligence that never sleeps. Our AI core processes
              over 2 billion signals per second to keep your perimeter locked.
            </p>
          </motion.div>

          {/* Mosaic grid */}
          <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[520px]">

            {/* Large left feature — AI brain */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="col-span-5 row-span-2 relative rounded-2xl overflow-hidden group"
              style={{ border: "1px solid rgba(168,85,247,0.2)" }}
            >
              <img src={IMGS.aiBrain} alt="AI neural brain" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(0.5) saturate(1.3) hue-rotate(200deg)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.08) 60%, transparent 100%)" }} />
              {/* Animated scan */}
              <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${C.anomaly}90, transparent)` }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              {/* Label overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}>
                <p className="font-mono text-xs tracking-widest mb-1" style={{ color: C.anomaly }}>NEURAL CORE v4.1</p>
                <p className="font-display font-bold text-xl text-white">Adaptive Threat Brain</p>
                <p className="text-sm mt-1" style={{ color: "#475569" }}>Self-learning model updated every 90 seconds</p>
              </div>
              {/* Corner brackets */}
              {[["top-4 left-4","border-t border-l"],["top-4 right-4","border-t border-r"]].map(([pos,b],i)=>(
                <div key={i} className={`absolute ${pos} w-5 h-5 ${b}`} style={{ borderColor: `${C.anomaly}60` }} />
              ))}
            </motion.div>

            {/* Top-right wide — AI robot/face */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-4 row-span-1 relative rounded-2xl overflow-hidden group"
              style={{ border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <img src={IMGS.aiRobot} alt="AI robot" className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(0.4) saturate(0.8) hue-rotate(180deg)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: C.primary }}>INFERENCE ENGINE</p>
                <p className="font-bold text-sm text-white mt-0.5">97.4% Threat Accuracy</p>
              </div>
              {/* Pulse dot */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.primary }} />
                <span className="font-mono text-[9px]" style={{ color: C.primary }}>ACTIVE</span>
              </div>
            </motion.div>

            {/* Top-far-right — Neural network */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="col-span-3 row-span-1 relative rounded-2xl overflow-hidden group"
              style={{ border: "1px solid rgba(34,197,94,0.15)" }}
            >
              <img src={IMGS.aiNeural} alt="Neural network" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(0.35) saturate(1.2) hue-rotate(100deg)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }} />
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: C.secure }}>SIGNAL ANALYSIS</p>
                <p className="font-bold text-sm text-white mt-0.5">2B+ signals/sec</p>
              </div>
            </motion.div>

            {/* Bottom-mid — Circuit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-4 row-span-1 relative rounded-2xl overflow-hidden group"
              style={{ border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <img src={IMGS.aiCircuit} alt="Circuit board AI" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(0.3) saturate(1.5) hue-rotate(200deg)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)" }} />
              {/* Live stat pills */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <div className="px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.7)", color: C.warning, border: `1px solid ${C.warning}30` }}>
                  EDGE COMPUTE · 0.4ms
                </div>
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: C.primary }}>EDGE HARDWARE</p>
                <p className="font-bold text-sm text-white mt-0.5">Silicon-Level Security</p>
              </div>
            </motion.div>

            {/* Bottom-right — AI eye / glowing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="col-span-3 row-span-1 relative rounded-2xl overflow-hidden group"
              style={{ border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <img src={IMGS.aiEye} alt="AI surveillance eye" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(0.35) saturate(1.2) hue-rotate(300deg)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)" }} />
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: C.critical }}>SURVEILLANCE</p>
                <p className="font-bold text-sm text-white mt-0.5">Zero Blind Spots</p>
              </div>
              {/* Pulsing ring overlay */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: `1px solid ${C.critical}` }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* AI Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-4 gap-4 mt-4"
          >
            {[
              { label: "MODEL ACCURACY", val: "99.97%", color: C.secure, icon: "◈" },
              { label: "INFERENCE LATENCY", val: "< 1ms", color: C.primary, icon: "⚡" },
              { label: "TRAINING DATA POINTS", val: "14.8T", color: C.anomaly, icon: "◎" },
              { label: "MODELS IN PRODUCTION", val: "312", color: C.warning, icon: "◇" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-4 rounded-xl font-mono"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span className="text-lg" style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[9px] tracking-wider mt-0.5" style={{ color: "#334155" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="architecture" className="relative py-32 px-6" style={{ zIndex: 1 }}>
        {/* Section accent */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.05) 0%, transparent 60%)",
        }} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: C.primary }}>
              HOW IT WORKS
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-5">TACTICAL ARCHITECTURE</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              Three-stage autonomous defense protocol executes in less time than it takes to blink.
            </p>
          </motion.div>

          {/* Steps with connecting line */}
          <div className="relative grid md:grid-cols-3 gap-6">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-px" style={{
              background: `linear-gradient(90deg, transparent, ${C.primary}50, ${C.anomaly}50, ${C.secure}50, transparent)`,
            }} />

            {[
              {
                num: "01", icon: Eye, title: "DETECT",
                desc: "Continuous global monitoring mapping anomalies against trillions of known threat signatures in real time.",
                color: C.primary, img: IMGS.network,
                features: ["Deep packet inspection", "Behavioral analysis", "Zero-day pattern matching"],
              },
              {
                num: "02", icon: Cpu, title: "ANALYZE",
                desc: "Edge-deployed machine learning scores threat intent and payload toxicity within microseconds.",
                color: C.anomaly, img: IMGS.datacenter,
                features: ["AI threat scoring", "Context classification", "Automated triage"],
              },
              {
                num: "03", icon: Lock, title: "NEUTRALIZE",
                desc: "Surgical countermeasures deployed at the firewall level, neutralizing attacks silently with zero latency impact.",
                color: C.secure, img: IMGS.servers,
                features: ["4ms block deployment", "IP geo-blacklisting", "Incident logging"],
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.15 }}
              >
                <div
                  className="group relative rounded-2xl overflow-hidden cursor-default transition-all duration-500"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.borderColor = `${step.color}40`;
                    e.currentTarget.style.boxShadow = `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${step.color}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img src={step.img} alt={step.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.25) saturate(0.5)" }} />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, #000)` }} />
                    {/* Step number */}
                    <div className="absolute top-4 left-5 font-display font-black text-5xl" style={{ color: `${step.color}20` }}>{step.num}</div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                        <step.icon className="w-5 h-5" style={{ color: step.color }} />
                      </div>
                      <h3 className="font-display font-black text-xl tracking-widest text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>{step.desc}</p>
                    <div className="space-y-2">
                      {step.features.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-xs font-mono" style={{ color: "#475569" }}>
                          <div className="w-1 h-1 rounded-full" style={{ background: step.color }} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom glow line */}
                  <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${step.color}50, transparent)` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section id="telemetry" className="relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 60%)",
        }} />
        {/* Top & bottom border lines */}
        <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <div className="absolute bottom-0 left-12 right-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: C.anomaly }}>
              LIVE TELEMETRY
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white">DEFENSE AT SCALE</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "THREATS NEUTRALIZED", target: 2438921, suffix: "+", color: C.primary },
              { label: "UPTIME SLA",          target: 99.98,   suffix: "%", color: C.secure, decimals: 2 },
              { label: "MEDIAN RESPONSE",     target: 12,      suffix: "ms", color: C.warning },
              { label: "COUNTRIES MONITORED", target: 147,     suffix: "",   color: C.anomaly },
            ].map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div
                  className="font-mono font-black leading-none mb-3"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: s.color, filter: `drop-shadow(0 0 20px ${s.color}50)` }}
                >
                  <Counter target={s.target} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="text-xs font-display font-bold tracking-widest" style={{ color: "#334155" }}>{s.label}</div>
                <div className="mt-4 w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREAT MAP PREVIEW ────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: C.critical }}>
                REAL-TIME INTELLIGENCE
              </p>
              <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-6">
                GLOBAL<br />THREAT MAP
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: C.muted }}>
                Monitor live attack vectors from 147 countries. Every threat is tracked,
                analyzed, and neutralized before it touches your infrastructure.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Attack Detection Rate", val: "99.97%", color: C.secure },
                  { label: "False Positive Rate", val: "0.003%", color: C.primary },
                  { label: "Avg Block Time", val: "< 12ms", color: C.warning },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <span className="text-sm font-mono" style={{ color: C.muted }}>{stat.label}</span>
                    <span className="font-mono font-bold" style={{ color: stat.color }}>{stat.val}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard">
                <button
                  className="mt-8 flex items-center gap-2 text-sm font-bold font-mono transition-all"
                  style={{ color: C.primary }}
                  onMouseEnter={e => e.currentTarget.style.gap = "12px"}
                  onMouseLeave={e => e.currentTarget.style.gap = "8px"}
                >
                  Open Command Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Image panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 60%)`,
              }} />
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(239,68,68,0.15)", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
              >
                <img src={IMGS.binary} alt="Threat monitoring" className="w-full h-80 object-cover" style={{ filter: "brightness(0.3) saturate(0.7) hue-rotate(200deg)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(59,130,246,0.08))" }} />
                {/* Overlay scan animation */}
                <motion.div
                  className="absolute left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${C.critical}, transparent)` }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                {/* Corner brackets */}
                {[["top-3 left-3", "border-t border-l"], ["top-3 right-3", "border-t border-r"], ["bottom-3 left-3", "border-b border-l"], ["bottom-3 right-3", "border-b border-r"]].map(([pos, borders], i) => (
                  <div key={i} className={`absolute ${pos} w-6 h-6 ${borders}`} style={{ borderColor: `${C.critical}60` }} />
                ))}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-xs" style={{ color: C.critical }}>
                  <span>SCANNING GLOBAL VECTORS</span>
                  <span className="animate-pulse">● LIVE</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAND ───────────────────────────────────────────────────────── */}
      <section id="trust" className="relative py-20 overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />

        <p className="text-center font-mono text-xs tracking-widest mb-10" style={{ color: "#1e293b" }}>
          SECURING CRITICAL INFRASTRUCTURE FOR
        </p>
        <div className="space-y-6">
          <Marquee items={TRUST_ITEMS.slice(0, 5)} direction={1} speed={50} />
          <Marquee items={TRUST_ITEMS.slice(3)} direction={-1} speed={60} />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 65%)",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <div
            className="rounded-3xl overflow-hidden relative px-12 py-20"
            style={{
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(30px)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 80px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Corner brackets */}
            {[["top-6 left-6", "border-t-2 border-l-2"], ["top-6 right-6", "border-t-2 border-r-2"], ["bottom-6 left-6", "border-b-2 border-l-2"], ["bottom-6 right-6", "border-b-2 border-r-2"]].map(([pos, borders], i) => (
              <div key={i} className={`absolute ${pos} w-8 h-8 ${borders}`} style={{ borderColor: `${C.primary}40` }} />
            ))}

            <p className="font-mono text-xs tracking-widest mb-6" style={{ color: C.primary }}>
              MISSION CRITICAL
            </p>
            <h2 className="font-display font-black text-5xl md:text-6xl text-white mb-6">
              READY TO<br />
              <span style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.anomaly})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>FORTIFY?</span>
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: C.muted }}>
              Deploy Phalanx AI to your edge network in under 5 minutes.
              Zero downtime. Infinite protection.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <button
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, #1d4ed8)` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.02)"; e.currentTarget.style.boxShadow = `0 20px 50px ${C.primary}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  Enter Command Center <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button
                onClick={() => setSimOpen(true)}
                className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                <PlayCircle className="w-5 h-5" /> See It In Action
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="relative py-12 px-6 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", zIndex: 1 }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Shield className="w-4 h-4" style={{ color: C.primary, opacity: 0.6 }} />
            </div>
            <span className="font-display font-bold text-sm tracking-widest" style={{ color: "#1e293b" }}>
              PHALANX AI
            </span>
          </div>
          <p className="font-mono text-xs tracking-widest" style={{ color: "#1e293b" }}>
            © {new Date().getFullYear()} PHALANX AI SYSTEMS. ALL SYSTEMS CLASSIFIED.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Security", "Docs", "Status"].map((link) => (
              <a key={link} href="#" className="font-mono text-xs transition-colors" style={{ color: "#1e293b" }}
                onMouseEnter={e => e.currentTarget.style.color = "#64748b"}
                onMouseLeave={e => e.currentTarget.style.color = "#1e293b"}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Simulation Modal */}
      <AnimatePresence>
        {simOpen && <SimulationModal onClose={() => setSimOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
