'use client';
import { motion } from 'framer-motion';
function IntervalRing({ timeLeft, total, phase }: { timeLeft: number; total: number; phase: 'work' | 'rest' }) {
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  const color = phase === 'work' ? `hsl(${Math.round((timeLeft / total) * 120)}, 80%, 50%)` : 'var(--secondary)';
  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4" />
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          strokeWidth="4"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-xs font-mono font-bold text-foreground"
        >
          {timeLeft}s
        </motion.span>
      </div>
    </div>
  );
}
export { IntervalRing };
