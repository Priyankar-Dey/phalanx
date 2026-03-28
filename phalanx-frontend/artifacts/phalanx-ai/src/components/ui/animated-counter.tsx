import { useEffect, useRef, useState } from 'react';
import { useInView, useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: 'comma' | 'percent' | 'ms' | 'compact';
  className?: string;
}

export function AnimatedCounter({ value, duration = 2, format = 'comma', className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  
  useEffect(() => {
    if (inView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    } else if (hasAnimated) {
      spring.set(value); // Update if value changes after initial animation
    }
  }, [inView, value, spring, hasAnimated]);

  const display = useTransform(spring, (current) => {
    if (format === 'comma') return Math.floor(current).toLocaleString();
    if (format === 'percent') return current.toFixed(2) + '%';
    if (format === 'ms') return Math.floor(current) + 'ms';
    if (format === 'compact') {
      if (current >= 1000000) return (current / 1000000).toFixed(1) + 'M';
      if (current >= 1000) return (current / 1000).toFixed(1) + 'K';
      return Math.floor(current).toString();
    }
    return Math.floor(current).toString();
  });

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
