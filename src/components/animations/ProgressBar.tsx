import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  borderRadius,
  delay = 0,
  duration = 1000,
  style,
}) => {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      delay,
      withTiming(progress, { duration })
    );
  }, [progress, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  const containerStyle = {
    height,
    backgroundColor: backgroundColor || theme.colors.borderLight,
    borderRadius: borderRadius ?? theme.borderRadius.full,
    overflow: 'hidden' as const,
  };

  const progressStyle = {
    height: height,
    backgroundColor: progressColor || theme.colors.primary,
    borderRadius: borderRadius ?? theme.borderRadius.full,
  } as const;

  return (
    <View style={[containerStyle, style]}>
      <Animated.View style={[progressStyle, animatedStyle]} />
    </View>
  );
};

export default ProgressBar; 