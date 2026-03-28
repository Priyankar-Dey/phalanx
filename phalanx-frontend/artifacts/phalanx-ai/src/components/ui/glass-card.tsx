import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  scanline?: boolean;
  glowColor?: 'primary' | 'critical' | 'secure' | 'warning' | 'anomaly' | 'none';
}

const glowVariants = {
  primary: 'hover:shadow-[0_0_30px_hsla(217,91%,60%,0.2)]',
  critical: 'hover:shadow-[0_0_30px_hsla(0,84%,60%,0.2)]',
  secure: 'hover:shadow-[0_0_30px_hsla(142,71%,45%,0.2)]',
  warning: 'hover:shadow-[0_0_30px_hsla(38,92%,50%,0.2)]',
  anomaly: 'hover:shadow-[0_0_30px_hsla(271,91%,65%,0.2)]',
  none: '',
};

export function GlassCard({ 
  children, 
  className, 
  interactive = false, 
  scanline = false,
  glowColor = 'none',
  ...props 
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-3 to 3 degrees max)
    const rotateX = ((y / rect.height) - 0.5) * -6;
    const rotateY = ((x / rect.width) - 0.5) * 6;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'glass-panel', 
        scanline && 'scanline',
        interactive && 'cursor-crosshair transition-transform duration-200 ease-out',
        glowVariants[glowColor],
        className
      )}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props as any}
    >
      {children}
    </motion.div>
  );
}
