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
        // Primary - Soft Blue (Flow Light)
        primary: {
          50: '#F0F7FF',
          100: '#E0F0FE',
          200: '#B8DAFD',
          300: '#8FC3FB',
          400: '#66ADF9',
          500: '#4D97F7',
          600: '#337BE5',
          700: '#265FB3',
          800: '#1A4380',
          900: '#0D2140',
          DEFAULT: '#4D97F7',
          foreground: '#FFFFFF',
        },
        
        // Secondary - Soft Lavender
        secondary: {
          50: '#F8F7FC',
          100: '#F0EEF8',
          200: '#D8D5EC',
          300: '#C0BCE0',
          400: '#A8A3D4',
          500: '#908BC8',
          600: '#7873BC',
          700: '#605BAF',
          800: '#4844A3',
          900: '#302E97',
          DEFAULT: '#908BC8',
          foreground: '#FFFFFF',
        },
        
        // Success - Soft Sage
        success: {
          50: '#F4F9F4',
          100: '#E8F3E8',
          200: '#C8E0C8',
          300: '#A8CDA8',
          400: '#88BA88',
          500: '#68A768',
          600: '#549454',
          700: '#408140',
          800: '#2C6E2C',
          900: '#185B18',
          DEFAULT: '#68A768',
          foreground: '#FFFFFF',
        },
        
        // Recovery - Soft Teal
        recovery: {
          50: '#F0F9FA',
          100: '#E0F3F4',
          200: '#B8E1E3',
          300: '#90CFD2',
          400: '#68BDC1',
          500: '#40ABAF',
          600: '#34999D',
          700: '#28777A',
          800: '#1C5557',
          900: '#103335',
          DEFAULT: '#40ABAF',
          foreground: '#FFFFFF',
        },
        
        // Warning - Soft Amber
        warning: {
          50: '#FEFBF4',
          100: '#FDF6E8',
          200: '#FAE8C8',
          300: '#F7DAA8',
          400: '#F4CC88',
          500: '#F1BE68',
          600: '#D9A954',
          700: '#C19440',
          800: '#A97F2C',
          900: '#916A18',
          DEFAULT: '#F1BE68',
          foreground: '#2C3E50',
        },
        
        // Danger - Soft Coral
        danger: {
          50: '#FEF5F4',
          100: '#FDEAE8',
          200: '#FACAC6',
          300: '#F7AAA4',
          400: '#F48A82',
          500: '#F16A60',
          600: '#D95448',
          700: '#C13E30',
          800: '#A92818',
          900: '#911200',
          DEFAULT: '#F16A60',
          foreground: '#FFFFFF',
        },
        
        // Peak - Soft Peach
        peak: {
          50: '#FEF8F4',
          100: '#FDEFE8',
          200: '#FAD8C8',
          300: '#F7C1A8',
          400: '#F4AA88',
          500: '#F19368',
          600: '#D97E54',
          700: '#C16940',
          800: '#A9542C',
          900: '#913F18',
          DEFAULT: '#F19368',
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
          peak: '#F19368',
          fresh: '#40ABAF',
          normal: '#4D97F7',
          fatigued: '#F1BE68',
          overtrained: '#F16A60',
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
