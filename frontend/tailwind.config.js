/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',  // Ajout pour scanner src/
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens semantiques
        background: 'var(--bg)',
        surface: 'var(--surface)',
        border: { DEFAULT: 'var(--border)' },
        muted: 'var(--muted)',
        'text-secondary': 'var(--text-secondary)',
        foreground: 'var(--foreground)',
        
        // Palette Primary (Blue Performance) - Alignée avec globals.css
        primary: {
          DEFAULT: '#0066FF',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B0FF',
          400: '#4C9AFF',
          500: '#007AFF',
          600: '#0066FF',
          700: '#0052CC',
          800: '#003D99',
          900: '#001A4D',
          foreground: '#FFFFFF',
        },
        
        // Secondary (Violet)
        secondary: {
          DEFAULT: '#5856D6',
          50: '#EEEDFB',
          100: '#DCDBF7',
          200: '#B9B7EF',
          300: '#9593E7',
          400: '#7B79E0',
          500: '#5856D6',
          600: '#4644AB',
          700: '#353380',
          800: '#232256',
          900: '#12112B',
          foreground: '#FFFFFF',
        },
        
        // Success/Récupération
        success: {
          DEFAULT: '#00C853',
          50: '#E8F9EE',
          100: '#D1F3DD',
          200: '#A3E7BB',
          300: '#75DB99',
          400: '#69F0AE',
          500: '#00C853',
          600: '#00A042',
          700: '#007831',
          800: '#005021',
          900: '#002810',
          foreground: '#FFFFFF',
        },
        
        recovery: {
          DEFAULT: '#00BCD4',
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#80DEEA',
          500: '#00BCD4',
          600: '#0097A7',
          700: '#006064',
          800: '#004050',
          900: '#002030',
          foreground: '#FFFFFF',
        },
        
        // Warning
        warning: {
          DEFAULT: '#FFAB00',
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFD180',
          500: '#FFAB00',
          600: '#FF8F00',
          700: '#FF6F00',
          800: '#CC5900',
          900: '#994300',
          foreground: '#0F172A',
        },
        
        // Danger
        danger: {
          DEFAULT: '#FF5252',
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#FF8A80',
          500: '#FF5252',
          600: '#D32F2F',
          700: '#B71C1C',
          800: '#8C0E0E',
          900: '#5C0A0A',
          foreground: '#FFFFFF',
        },
        
        // Peak (Orange vif - pic de performance)
        peak: {
          DEFAULT: '#FF6D00',
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FF9100',
          500: '#FF6D00',
          600: '#E65100',
          700: '#BF360C',
          800: '#8C2400',
          900: '#5C1800',
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
        
        // Couleurs d'activités
        activity: {
          run: '#FF3B30',
          ride: '#FF9500',
          swim: '#007AFF',
          hike: '#34C759',
          walk: '#8E8E93',
          ski: '#007AFF',
          other: '#8E8E93',
        },
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      
      fontSize: {
        'hero': ['72px', { lineHeight: '80px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero-mobile': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'data': ['24px', { lineHeight: '32px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
        'data-sm': ['20px', { lineHeight: '28px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
        'stat': ['28px', { lineHeight: '36px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }],
        'stat-sm': ['20px', { lineHeight: '28px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }],
        'stat-label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
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
        'slide-down': 'slideDown 0.2s ease-out',
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
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
        '44': '11rem',  // Pour les hit targets mobiles
      },
      
      borderRadius: {
        '4xl': '2rem',
      },
      
      // Z-Index scale
      zIndex: {
        'base': '0',
        'raised': '10',
        'content': '20',
        'sticky': '30',
        'dropdown': '40',
        'modal-backdrop': '45',
        'modal': '50',
        'toast': '60',
        'tooltip': '70',
        'max': '9999',
      },
    },
  },
  plugins: [],
};
