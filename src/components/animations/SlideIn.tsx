import React, { useEffect } from 'react';
import { ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { AnimationConfig } from '../../utils/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideInProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  distance,
  style,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Set initial position based on direction
    const getInitialPosition = () => {
      switch (direction) {
        case 'left':
          translateX.value = -(distance || screenWidth);
          break;
        case 'right':
          translateX.value = distance || screenWidth;
          break;
        case 'up':
          translateY.value = distance || 100;
          break;
        case 'down':
          translateY.value = -(distance || 100);
          break;
      }
    };

    getInitialPosition();

    // Animate to final position
    translateX.value = withDelay(delay, withSpring(0, AnimationConfig.spring.medium));
    translateY.value = withDelay(delay, withSpring(0, AnimationConfig.spring.medium));
    opacity.value = withDelay(delay, withTiming(1, AnimationConfig.normal));
  }, [direction, delay, distance]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default SlideIn; 