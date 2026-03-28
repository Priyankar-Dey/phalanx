import { motion } from 'framer-motion';

interface ShieldCoreProps {
  health: number;
}

export function ShieldCore({ health }: ShieldCoreProps) {
  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (health / 100) * circumference;

  const color =
    health > 90 ? '#22c55e' :
    health > 70 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)` }}
        />

        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Progress */}
          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {/* Inner track */}
          <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold leading-none" style={{ fontSize: 22, color }}>
            {health.toFixed(0)}%
          </span>
          <span className="text-[8px] tracking-widest font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            SHIELD
          </span>
        </div>

        {/* Rotating dashed ring */}
        <motion.svg
          className="absolute inset-0"
          width={size} height={size}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={cx} cy={cy}
            r={r + 10}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </motion.svg>
      </div>

      <div className="text-center">
        <p className="text-[9px] font-display tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
          CORE INTEGRITY
        </p>
      </div>
    </div>
  );
}
