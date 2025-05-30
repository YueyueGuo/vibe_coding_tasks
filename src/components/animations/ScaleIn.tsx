import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { AnimationConfig } from '../../utils/animations';

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  intensity?: number;
  style?: ViewStyle;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  intensity = 0,
  style,
}) => {
  const scale = useSharedValue(intensity);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, AnimationConfig.spring.medium));
    opacity.value = withDelay(delay, withSpring(1, AnimationConfig.spring.light));
  }, [delay, intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default ScaleIn; 