export interface ThemeColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  DEFAULT: string;
  foreground: string;
}

export interface ThemeNeutralScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface ThemePalette {
  primary: ThemeColorScale;
  secondary: ThemeColorScale;
  success: ThemeColorScale;
  warning: ThemeColorScale;
  danger: ThemeColorScale;
  peak: ThemeColorScale;
  recovery: ThemeColorScale;
  neutral: ThemeNeutralScale;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: ThemePalette;
  semantic: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  typography: {
    fontFamily: {
      sans: string;
      display: string;
      mono: string;
    };
  };
  shadows: {
    card: string;
    cardHover: string;
    elevated: string;
    buttonPrimary: string;
    buttonPrimaryHover: string;
  };
  radius: {
    card: string;
    button: string;
    input: string;
    badge: string;
  };
}

export interface ThemeConfig {
  theme: string;
  mode: 'light' | 'dark';
}
