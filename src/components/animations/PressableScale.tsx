import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { HapticService } from '../../services/hapticService';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleValue?: number;
  style?: ViewStyle;
  disabled?: boolean;
  hapticFeedback?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  onPress,
  scaleValue = 0.95,
  style,
  disabled = false,
  hapticFeedback = true,
  hapticIntensity = 'light',
}) => {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withTiming(scaleValue, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 100 });
    })
    .onEnd(async () => {
      if (hapticFeedback) {
        await HapticService.impact(hapticIntensity);
      }
      if (onPress) {
        onPress();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[animatedStyle, style]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default PressableScale; 