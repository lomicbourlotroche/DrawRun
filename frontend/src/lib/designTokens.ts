export const designTokens = {
  // Palette 60-30-10
  colors: {
    primary: '#007AFF',      // Bleu - Actions principales
    secondary: '#5856D6',    // Violet - Éléments secondaires
    accent: '#34C759',       // Vert - Success/CTA
    
    // Neutres (60-30-10)
    neutral: {
      900: '#0F172A',       // Fond principal
      800: '#1E293B',       // Surface
      700: '#334155',        // Bordures
      600: '#475569',        // Élévation
      500: '#64748B',        // Texte secondaire
      400: '#94A3B8',        // Texte muted
      300: '#CBD5E1',        // Texte terciare
      200: '#E2E8F0',        // Fond léger
      100: '#F1F5F9',       // Fond alternate
      50: '#F8FAFC',         // Fond contrasté
    },
    
    // Couleurs fonctionnelles
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Types d'activité
    run: '#FF3B30',
    ride: '#FF9500',
    swim: '#007AFF',
  },
  
  // Espacement (système 8pt)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },
  
  // Rayons (look moderne/app)
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },
  
  // Typographie
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    }
  },
  
  // Ombres (diffuses, modernes)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(0, 122, 255, 0.3)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  }
};

// Règle 60-30-10
// 60% - Fond neutres (neutral.900)
// 30% - Éléments neutres secondaires (neutral.800)
// 10% - Accent pour CTA (primary)
