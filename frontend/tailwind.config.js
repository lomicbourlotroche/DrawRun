/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: { DEFAULT: 'var(--border)' },
        muted: 'var(--muted)',
        'text-secondary': 'var(--text-secondary)',
        foreground: 'var(--foreground)',
        // Nouvelle palette Primary (Blue Performance)
        primary: {
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B0FF',
          400: '#4C9AFF',
          500: '#007AFF',
          600: '#0066FF', // Nouveau primary principal
          700: '#0052CC',
          800: '#003D99',
          900: '#001A4D',
          foreground: '#FFFFFF',
        },
        // Secondary (Violet)
        secondary: {
          DEFAULT: '#5856D6',
          400: '#7B79E0',
          500: '#5856D6',
          600: '#4644AB',
          foreground: '#FFFFFF',
        },
        // Palette Success/Récupération
        success: {
          400: '#69F0AE',
          500: '#00C853',
          foreground: '#FFFFFF',
        },
        recovery: {
          400: '#80DEEA',
          500: '#00BCD4',
          foreground: '#FFFFFF',
        },
        // Palette d'alerte
        warning: {
          400: '#FFD180',
          500: '#FFAB00',
          foreground: '#0F172A',
        },
        danger: {
          400: '#FF8A80',
          500: '#FF5252',
          foreground: '#FFFFFF',
        },
        peak: {
          500: '#FF6D00',
          foreground: '#FFFFFF',
        },
        // Neutres élargis
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'SF Pro Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '80px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero-mobile': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'data': ['24px', { lineHeight: '32px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
        'data-sm': ['20px', { lineHeight: '28px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'glow-primary': '0 0 20px rgba(0, 102, 255, 0.3)',
        'glow-success': '0 0 20px rgba(0, 200, 83, 0.3)',
        'glow-recovery': '0 0 20px rgba(0, 188, 212, 0.3)',
        'glow-peak': '0 0 20px rgba(255, 109, 0, 0.3)',
        'button-primary': '0 4px 12px rgba(0, 102, 255, 0.3)',
        'button-primary-hover': '0 8px 20px rgba(0, 102, 255, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'count-up': 'countUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};