import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outlined';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  size = 'md',
  variant = 'outlined',
  containerStyle,
  inputStyle,
  disabled = false,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = theme.componentSizes.input[size];

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      borderWidth: variant === 'outlined' ? 1 : 0,
      ...sizeConfig,
    };

    const borderColor = error 
      ? theme.colors.error 
      : isFocused 
        ? theme.colors.primary 
        : theme.colors.border;

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.backgroundSecondary,
          borderBottomWidth: 2,
          borderBottomColor: borderColor,
          borderRadius: 0,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderColor,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderColor,
        };
    }
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: sizeConfig.fontSize,
      color: theme.colors.text,
      paddingVertical: 0, // Remove default padding
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <View style={[getInputContainerStyle(), disabled && styles.disabled]}>
        <TextInput
          {...textInputProps}
          style={[getInputStyle(), inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Input; 