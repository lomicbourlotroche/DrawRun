import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { generateAllThemeCSS } from '../themes';

const themeCSS = generateAllThemeCSS();

const baseCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ======================================================================== */
/* DrawRun Multi-Theme System */
/* 4 themes × 2 modes (light/dark) = 8 variations */
/* ======================================================================== */

${themeCSS}

/* ======================================================================== */
/* DEFAULT FALLBACK — when no data-theme is set yet (FOUC prevention) */
/* ======================================================================== */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
  --radius-card: 12px;
  --radius-button: 8px;
  --radius-input: 8px;
  --radius-badge: 9999px;
  --opacity-disabled: 0.5;
  --opacity-muted: 0.7;
  --opacity-subtle: 0.1;
  --opacity-light: 0.2;
  --opacity-medium: 0.3;
  --opacity-strong: 0.4;
  --opacity-hover: 0.9;
  --opacity-active: 0.8;
}

/* ======================================================================== */
/* UTILITY CLASSES */
/* ======================================================================== */

[data-tabular-nums] {
  font-variant-numeric: tabular-nums;
}

:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

::selection {
  background-color: rgb(var(--primary-200-rgb));
  color: rgb(var(--primary-900-rgb));
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgb(var(--neutral-300-rgb)); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgb(var(--neutral-400-rgb)); }

/* ======================================================================== */
/* ANIMATIONS */
/* ======================================================================== */

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes countUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
}

.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-slide-down { animation: slideDown 0.2s ease-out; }
.animate-pulse-soft { animation: pulseSoft 2s ease-in-out infinite; }
.animate-shimmer { animation: shimmer 2s linear infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-gradient-shift { animation: gradientShift 8s ease infinite; }
.animate-count-up { animation: countUp 0.5s ease-out; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-ping { animation: ping 1s ease-out infinite; }
.animate-bounce { animation: bounce 1s ease-in-out infinite; }
`;

writeFileSync(resolve(__dirname, '../app/globals.css'), baseCSS, 'utf-8');
console.log('✅ globals.css generated successfully');
