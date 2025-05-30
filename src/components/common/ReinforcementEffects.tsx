import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface ReinforcementEffectsProps {
  type: 'celebration' | 'achievement' | 'pr';
  intensity?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
}

export const ReinforcementEffects: React.FC<ReinforcementEffectsProps> = ({
  type,
  intensity = 'medium',
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start celebration animation
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    
    opacity.value = withSequence(
      withSpring(1, { damping: 15 }),
      withDelay(2000, withSpring(0, { damping: 15 }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      }))
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getEmojis = () => {
    switch (type) {
      case 'celebration':
        return ['🎉', '🎊', '💪', '🔥', '⭐'];
      case 'achievement':
        return ['🏆', '🎯', '💯', '👑', '🚀'];
      case 'pr':
        return ['🏆', '💪', '🔥', '⚡', '💯'];
      default:
        return ['🎉', '💪'];
    }
  };

  const emojis = getEmojis();

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.effectContainer, animatedStyle]}>
        {emojis.map((emoji, index) => (
          <View
            key={index}
            style={[
              styles.emoji,
              {
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 60 + 20}%`,
              }
            ]}
          >
            {/* Simple emoji display - in a real implementation, 
                these would have individual animations */}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  effectContainer: {
    flex: 1,
    position: 'relative',
  },
  emoji: {
    position: 'absolute',
    fontSize: 24,
  },
}); 