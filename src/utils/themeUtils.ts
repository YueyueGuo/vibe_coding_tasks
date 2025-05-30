import { Theme } from '../styles/theme';

/**
 * Utility functions for working with the theme system
 */
export class ThemeUtils {
  /**
   * Get shadow style for elevation
   */
  static getShadow(theme: Theme, elevation: keyof Theme['shadows']) {
    if (!theme.isDark) {
      return {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      };
    }
    // Minimal shadow for dark mode
    return {
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    };
  }

  /**
   * Get text color for contrast on background
   */
  static getContrastText(backgroundColor: string, theme: Theme): string {
    // Simple contrast logic - in a real app you might use a color library
    return backgroundColor === theme.colors.background 
      ? theme.colors.text 
      : theme.colors.textInverse;
  }

  /**
   * Add opacity to color
   */
  static addOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color + alpha;
    }
    return color;
  }

  /**
   * Get responsive spacing based on screen size
   */
  static getResponsiveSpacing(baseSpacing: number, screenWidth: number): number {
    if (screenWidth > 768) {
      return baseSpacing * 1.5; // Larger spacing for tablets
    }
    return baseSpacing;
  }

  /**
   * Get button style for variant
   */
  static getButtonVariantStyle(variant: string, theme: Theme) {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          color: theme.colors.textInverse,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          color: theme.colors.textInverse,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          color: theme.colors.textInverse,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        };
    }
  }
}

export default ThemeUtils; 