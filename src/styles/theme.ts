// Modern color palette research for users under 40:
// - Vibrant but not overwhelming colors
// - High contrast for accessibility
// - Trendy gradients and accent colors
// - Dark mode friendly variants

export interface ColorPalette {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string[];
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Accent colors for energy/motivation
  accent: string;
  accentLight: string;
  accentDark: string;
  
  // Success/achievement colors
  success: string;
  successLight: string;
  successDark: string;
  
  // Warning colors
  warning: string;
  warningLight: string;
  warningDark: string;
  
  // Error colors
  error: string;
  errorLight: string;
  errorDark: string;
  
  // Neutral colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border and divider colors
  border: string;
  borderLight: string;
  divider: string;
  
  // Special colors
  white: string;
  black: string;
  transparent: string;
  overlay: string;
  
  // Workout-specific colors
  strength: string;
  cardio: string;
  flexibility: string;
  recovery: string;
}

export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  lineHeight: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  fontWeight: {
    light: '300';
    normal: '400';
    medium: '500';
    semiBold: '600';
    bold: '700';
    extraBold: '800';
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

export interface Spacing {
  0: number;
  0.5: number;
  1: number;
  1.5: number;
  2: number;
  2.5: number;
  3: number;
  3.5: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
  11: number;
  12: number;
  14: number;
  16: number;
  20: number;
  24: number;
  28: number;
  32: number;
  36: number;
  40: number;
  44: number;
  48: number;
  52: number;
  56: number;
  60: number;
  64: number;
  72: number;
  80: number;
  96: number;
  
  // Semantic spacing
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface BorderRadius {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  full: number;
}

export interface Shadows {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ComponentSizes {
  button: {
    sm: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
    md: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
    lg: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
  };
  input: {
    sm: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
    md: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
    lg: {
      paddingVertical: number;
      paddingHorizontal: number;
      fontSize: number;
      minHeight: number;
    };
  };
  card: {
    sm: { padding: number };
    md: { padding: number };
    lg: { padding: number };
  };
}

export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  componentSizes: ComponentSizes;
  isDark: boolean;
}

// Light theme colors (modern, vibrant palette for young adults)
const lightColors: ColorPalette = {
  // Primary - Electric Blue (energetic, modern)
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  primaryGradient: ['#3B82F6', '#8B5CF6'],
  
  // Secondary - Vibrant Purple (trendy, engaging)
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  secondaryDark: '#7C3AED',
  
  // Accent - Energetic Orange (motivation, energy)
  accent: '#F97316',
  accentLight: '#FB923C',
  accentDark: '#EA580C',
  
  // Success - Fresh Green (achievement, progress)
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  // Warning - Bright Yellow (caution, attention)
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  // Error - Vibrant Red (alerts, errors)
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  // Neutral backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  
  // Text colors
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Borders and dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Workout-specific colors
  strength: '#DC2626', // Red for strength training
  cardio: '#059669',   // Green for cardio
  flexibility: '#7C3AED', // Purple for flexibility
  recovery: '#0891B2',    // Cyan for recovery
};

// Dark theme colors
const darkColors: ColorPalette = {
  // Primary - Brighter blue for dark backgrounds
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',
  primaryGradient: ['#60A5FA', '#A78BFA'],
  
  // Secondary - Brighter purple
  secondary: '#A78BFA',
  secondaryLight: '#C4B5FD',
  secondaryDark: '#8B5CF6',
  
  // Accent - Brighter orange
  accent: '#FB923C',
  accentLight: '#FCD34D',
  accentDark: '#F97316',
  
  // Success - Brighter green
  success: '#34D399',
  successLight: '#6EE7B7',
  successDark: '#10B981',
  
  // Warning - Brighter yellow
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningDark: '#F59E0B',
  
  // Error - Brighter red
  error: '#F87171',
  errorLight: '#FCA5A5',
  errorDark: '#EF4444',
  
  // Dark neutral backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  
  // Dark text colors
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  
  // Dark borders and dividers
  border: '#334155',
  borderLight: '#475569',
  divider: '#334155',
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Workout-specific colors (slightly brighter for dark mode)
  strength: '#F87171',
  cardio: '#34D399',
  flexibility: '#A78BFA',
  recovery: '#22D3EE',
};

// Typography system inspired by modern design systems
const typography: Typography = {
  fontFamily: {
    regular: 'System', // Will use SF Pro on iOS, Roboto on Android
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 28,
    lg: 32,
    xl: 36,
    '2xl': 40,
    '3xl': 44,
    '4xl': 56,
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Comprehensive spacing system
const spacing: Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
  
  // Semantic spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius system
const borderRadius: BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 999,
};

// Shadow system for depth
const shadows: Shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
};

// Component size variants
const componentSizes: ComponentSizes = {
  button: {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      minHeight: 36,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      minHeight: 48,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      minHeight: 56,
    },
  },
  input: {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      minHeight: 36,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      minHeight: 48,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      fontSize: 18,
      minHeight: 56,
    },
  },
  card: {
    sm: { padding: 12 },
    md: { padding: 16 },
    lg: { padding: 24 },
  },
};

// Create light and dark themes
export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentSizes,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentSizes,
  isDark: true,
};

// Default export (light theme)
export const theme = lightTheme;
export default theme; 