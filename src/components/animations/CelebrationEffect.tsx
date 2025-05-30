import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfettiExplosion } from './ConfettiExplosion';

type CelebrationType = 'setComplete' | 'personalRecord' | 'achievement' | 'levelUp';

interface CelebrationEffectProps {
  type: CelebrationType;
  active: boolean;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
  type,
  active,
  title,
  subtitle,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const titleScale = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      startCelebration();
    } else {
      resetAnimation();
    }
  }, [active]);

  const startCelebration = () => {
    // Start confetti for major celebrations
    if (type === 'personalRecord' || type === 'achievement' || type === 'levelUp') {
      setShowConfetti(true);
    }

    // Main container animation
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    translateY.value = withSpring(0, { damping: 10, stiffness: 100 });

    // Title animation
    titleScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.3, { duration: 200 }),
        withSpring(1, { damping: 8, stiffness: 100 })
      )
    );

    // Subtitle animation
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    // Auto-hide after duration
    const hideDuration = getCelebrationDuration();
    setTimeout(() => {
      hideCelebration();
    }, hideDuration);
  };

  const hideCelebration = () => {
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(resetAnimation)();
        if (onComplete) {
          runOnJS(onComplete)();
        }
      }
    });
    scale.value = withTiming(0.8, { duration: 300 });
    setShowConfetti(false);
  };

  const resetAnimation = () => {
    scale.value = 0;
    opacity.value = 0;
    translateY.value = 50;
    titleScale.value = 0;
    subtitleOpacity.value = 0;
  };

  const getCelebrationDuration = () => {
    switch (type) {
      case 'setComplete':
        return 1500;
      case 'personalRecord':
        return 3000;
      case 'achievement':
        return 2500;
      case 'levelUp':
        return 3000;
      default:
        return 2000;
    }
  };

  const getCelebrationContent = () => {
    switch (type) {
      case 'setComplete':
        return {
          emoji: '✅',
          title: title || 'Set Complete!',
          subtitle: subtitle || 'Great job!',
          color: theme.colors.success,
        };
      case 'personalRecord':
        return {
          emoji: '🏆',
          title: title || 'Personal Record!',
          subtitle: subtitle || 'You\'re getting stronger!',
          color: theme.colors.accent,
        };
      case 'achievement':
        return {
          emoji: '🎯',
          title: title || 'Achievement Unlocked!',
          subtitle: subtitle || 'Keep up the great work!',
          color: theme.colors.primary,
        };
      case 'levelUp':
        return {
          emoji: '⭐',
          title: title || 'Level Up!',
          subtitle: subtitle || 'You\'re on fire!',
          color: theme.colors.secondary,
        };
      default:
        return {
          emoji: '🎉',
          title: title || 'Awesome!',
          subtitle: subtitle || 'Well done!',
          color: theme.colors.primary,
        };
    }
  };

  const content = getCelebrationContent();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: titleScale.value }],
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
    };
  });

  if (!active && opacity.value === 0) {
    return null;
  }

  return (
    <>
      {showConfetti && (
        <ConfettiExplosion
          active={showConfetti}
          particleCount={type === 'personalRecord' ? 80 : 50}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <View style={[styles.content, { borderColor: content.color }]}>
            <Text style={styles.emoji}>{content.emoji}</Text>
            <Animated.Text
              style={[
                styles.title,
                { color: content.color },
                titleAnimatedStyle,
              ]}
            >
              {content.title}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.subtitle,
                { color: theme.colors.textSecondary },
                subtitleAnimatedStyle,
              ]}
            >
              {content.subtitle}
            </Animated.Text>
          </View>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CelebrationEffect; 