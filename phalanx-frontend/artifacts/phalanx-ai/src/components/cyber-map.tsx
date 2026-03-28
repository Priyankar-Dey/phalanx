import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreatSimulation } from '@/hooks/use-threat-simulation';

// Lat/lng → SVG x,y (equirectangular projection for a 1000×500 viewport)
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

// Major world cities / regions used as origin points (mapped to approximate lat/lng)
const PROTECTED_NODE = project(38, -97); // USA center — the "defended" hub

// Draw simplified continent outlines as polyline points
const CONTINENTS = [
  // North America (rough outline)
  "M 60 80 L 80 60 L 120 55 L 170 80 L 200 130 L 195 170 L 220 200 L 200 230 L 170 250 L 150 280 L 120 300 L 100 280 L 80 240 L 70 200 L 50 170 Z",
  // South America
  "M 170 280 L 200 260 L 220 300 L 230 360 L 210 420 L 190 450 L 170 430 L 155 390 L 150 340 Z",
  // Europe
  "M 440 60 L 500 55 L 540 70 L 560 90 L 530 110 L 510 130 L 480 120 L 450 110 L 430 90 Z",
  // Africa
  "M 460 150 L 510 140 L 550 160 L 570 210 L 560 280 L 530 350 L 500 400 L 470 380 L 450 320 L 440 260 L 440 200 Z",
  // Asia
  "M 570 60 L 700 50 L 820 70 L 900 90 L 920 130 L 870 160 L 800 150 L 740 170 L 700 140 L 640 160 L 600 140 L 570 110 Z",
  // Australia
  "M 760 320 L 830 300 L 880 310 L 900 360 L 870 400 L 810 410 L 770 390 L 750 360 Z",
];

export function CyberMap() {
  const { events } = useThreatSimulation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render animated attack arcs on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const ARCS = events.slice(0, 12).map(evt => {
      const src = project(evt.lat, evt.lng);
      const dst = PROTECTED_NODE;
      const color = evt.severity === 'CRITICAL' ? '#ef4444' : evt.severity === 'WARNING' ? '#f59e0b' : '#a855f7';
      return { src, dst, color, progress: Math.random() };
    });

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const sx = W / 1000;
      const sy = H / 500;

      ctx.clearRect(0, 0, W, H);

      // Draw grid
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += W / 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += H / 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Draw attack arcs
      frame = (frame + 1) % 120;
      ARCS.forEach((arc, i) => {
        arc.progress = (arc.progress + 0.004 + i * 0.0002) % 1;

        const sx2 = arc.src.x * sx;
        const sy2 = arc.src.y * sy;
        const dx = arc.dst.x * sx;
        const dy = arc.dst.y * sy;
        const cpx = (sx2 + dx) / 2;
        const cpy = Math.min(sy2, dy) - H * 0.2;

        // Draw faint full arc
        ctx.beginPath();
        ctx.moveTo(sx2, sy2);
        ctx.quadraticCurveTo(cpx, cpy, dx, dy);
        ctx.strokeStyle = `${arc.color}18`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw animated dot along the arc
        const t = arc.progress;
        const bx = (1-t)*(1-t)*sx2 + 2*(1-t)*t*cpx + t*t*dx;
        const by = (1-t)*(1-t)*sy2 + 2*(1-t)*t*cpy + t*t*dy;

        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = arc.color;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Source pulse
        const pulse = (Math.sin(frame * 0.08 + i * 0.5) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx2, sy2, 3 + pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${arc.color}${Math.floor(pulse * 0.8 * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      // Protected node (center hub)
      const hx = PROTECTED_NODE.x * sx;
      const hy = PROTECTED_NODE.y * sy;
      const pulse2 = (Math.sin(frame * 0.06) + 1) / 2;

      // Rings
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(hx, hy, 8 + r * 10 + pulse2 * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${0.15 - r * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Center dot
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [events]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 280, background: 'rgba(0,0,0,0.3)' }}>
      {/* SVG continent outlines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ opacity: 0.15 }}
      >
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} fill="rgba(148,163,184,0.3)" stroke="rgba(148,163,184,0.6)" strokeWidth="1" />
        ))}
      </svg>

      {/* Canvas for animated arcs */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={1000}
        height={500}
        style={{ display: 'block' }}
      />

      {/* Overlay labels */}
      <div className="absolute bottom-3 left-4 flex items-center gap-4 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#ef4444' }} />CRITICAL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f59e0b' }} />WARNING
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#a855f7' }} />ANOMALY
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3b82f6' }} />PROTECTED
        </span>
      </div>
    </div>
  );
}
