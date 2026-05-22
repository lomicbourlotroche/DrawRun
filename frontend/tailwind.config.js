/** @type {import('tailwindcss').Config} */

// DrawRun Tailwind Configuration
// GÉNÉRÉ AUTOMATIQUEMENT depuis src/lib/designTokens.ts
// NE PAS MODIFIER MANUELLEMENT - Exécuter 'npm run generate:design-tokens' pour mettre à jour

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  darkMode: 'class',
  
  theme: {
    extend: {
      // ======================================================================
      // COULEURS
      // ======================================================================
      
      colors: {
        // Primary - Bleu Performance
        primary: {
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
          DEFAULT: '#0066FF',
          foreground: '#FFFFFF',
        },
        
        // Secondary - Violet
        secondary: {
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
          DEFAULT: '#5856D6',
          foreground: '#FFFFFF',
        },
        
        // Success - Vert
        success: {
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
          DEFAULT: '#00C853',
          foreground: '#FFFFFF',
        },
        
        // Recovery - Cyan
        recovery: {
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
          DEFAULT: '#00BCD4',
          foreground: '#FFFFFF',
        },
        
        // Warning - Orange
        warning: {
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
          DEFAULT: '#FFAB00',
          foreground: '#0F172A',
        },
        
        // Danger - Rouge
        danger: {
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
          DEFAULT: '#FF5252',
          foreground: '#FFFFFF',
        },
        
        // Peak - Orange vif
        peak: {
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
          DEFAULT: '#FF6D00',
          foreground: '#FFFFFF',
        },
        
        // Semantic colors (light/dark via RGB CSS vars — enables opacity modifiers)
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',

        // Neutral colors
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
        
        // Activity colors
        activity: {
          run: '#FF3B30',
          ride: '#FF9500',
          swim: '#007AFF',
          hike: '#34C759',
          walk: '#8E8E93',
          ski: '#007AFF',
          trail: '#FF6D00',
          rowing: '#00BCD4',
          other: '#8E8E93',
        },
        
        // DrawRun-specific: HR Zones
        'hr-zone': {
          1: '#00C853',
          2: '#8BC34A',
          3: '#FFAB00',
          4: '#FF6D00',
          5: '#FF5252',
        },
        
        // DrawRun-specific: Power Zones
        'power-zone': {
          1: '#00BCD4',
          2: '#00C853',
          3: '#8BC34A',
          4: '#FFAB00',
          5: '#FF6D00',
          6: '#E91E63',
          7: '#9C27B0',
        },
        
        // DrawRun-specific: PMC Form States
        form: {
          peak: '#FF6D00',
          fresh: '#00BCD4',
          normal: '#0066FF',
          fatigued: '#FFAB00',
          overtrained: '#FF5252',
        },
      },
      
      // ======================================================================
      // Z-INDEX
      // ======================================================================
      
      zIndex: {
        base: '0',
        raised: '10',
        content: '20',
        fixed: '20',
        sticky: '30',
        dropdown: '40',
        'modal-backdrop': '45',
        modal: '50',
        drawer: '50',
        toast: '60',
        tooltip: '70',
        max: '9999',
      },
      
      // ======================================================================
      // ESPACEMENT (8pt Grid)
      // ======================================================================
      
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '64': '256px',
      },
      
      // ======================================================================
      // RAYONS
      // ======================================================================
      
      borderRadius: {
        none: '0px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
        button: '8px',
        card: '12px',
        input: '8px',
        badge: '9999px',
      },
      
      // ======================================================================
      // TYPOGRAPHIE
      // ======================================================================
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '60px',
        '7xl': '72px',
        '8xl': '96px',
        hero: '72px',
        'hero-mobile': '40px',
        data: '24px',
        'data-sm': '20px',
        stat: '28px',
        'stat-sm': '20px',
        'stat-label': '14px',
      },
      
      lineHeight: {
        xs: '16px',
        sm: '20px',
        md: '24px',
        lg: '28px',
        xl: '32px',
        '2xl': '36px',
        hero: '80px',
        'hero-mobile': '48px',
        data: '32px',
        'data-sm': '28px',
      },
      
      // ======================================================================
      // OMBRES
      // ======================================================================
      
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        elevated: '0 4px 16px rgba(0, 0, 0, 0.1)',
        'button-primary': '0 4px 12px rgba(0, 102, 255, 0.3)',
        'button-primary-hover': '0 8px 20px rgba(0, 102, 255, 0.4)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'inner-md': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      
      // ======================================================================
      // OPACITY
      // ======================================================================
      
      opacity: {
        disabled: '0.5',
        muted: '0.7',
        subtle: '0.1',
        light: '0.2',
        medium: '0.3',
        strong: '0.4',
        hover: '0.9',
        active: '0.8',
      },
      
      // ======================================================================
      // TRANSITIONS
      // ======================================================================
      
      transitionDuration: {
        instant: '0ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '400ms',
        slowest: '500ms',
      },
      
      transitionTimingFunction: {
        linear: 'linear',
        ease: 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      transitionProperty: {
        'transform-opacity': 'transform, opacity',
        'all': 'all',
      },
      
      // ======================================================================
      // ANIMATIONS
      // ======================================================================
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'count-up': 'countUp 0.5s ease-out',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s ease-out infinite',
        'bounce': 'bounce 1s ease-in-out infinite',
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
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
      },
      
      // ======================================================================
      // BREAKPOINTS
      // ======================================================================
      
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
