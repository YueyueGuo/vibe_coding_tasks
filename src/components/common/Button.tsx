import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticService } from '../../services/hapticService';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  hapticFeedback = true,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useTheme();
  const sizeConfig = theme.componentSizes.button[size];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...sizeConfig,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: variant === 'outline' ? 1 : 0,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.colors.textTertiary : theme.colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.colors.textTertiary : theme.colors.error,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: sizeConfig.fontSize,
      fontWeight: theme.typography.fontWeight.semiBold,
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return {
          ...baseTextStyle,
          color: theme.colors.textInverse,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: disabled ? theme.colors.textTertiary : theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: disabled ? theme.colors.textTertiary : theme.colors.primary,
        };
      default:
        return baseTextStyle;
    }
  };

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    if (hapticFeedback) {
      const hapticIntensity = size === 'lg' ? 'medium' : 'light';
      await HapticService.impact(hapticIntensity);
    }

    onPress();
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.textInverse}
          style={styles.loader}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  loader: {
    marginRight: 8,
  },
});

export default Button; 