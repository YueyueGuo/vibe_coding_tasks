import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  endX: number;
  endY: number;
  delay: number;
}

interface ConfettiExplosionProps {
  active: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
}

export const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({
  active,
  origin = { x: screenWidth / 2, y: screenHeight / 2 },
  particleCount = 50,
  duration = 3000,
  onComplete,
  colors,
}) => {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  const defaultColors = colors || [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.accent,
    theme.colors.success,
    theme.colors.warning,
  ];

  useEffect(() => {
    if (active) {
      generateParticles();
    }
  }, [active]);

  const generateParticles = () => {
    const newParticles: ConfettiParticle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = Math.random() * 200 + 100; // Random velocity
      const size = Math.random() * 8 + 4; // Size between 4-12
      
      newParticles.push({
        id: i,
        x: origin.x,
        y: origin.y,
        color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
        size,
        endX: origin.x + Math.cos(angle) * velocity + (Math.random() - 0.5) * 100,
        endY: origin.y + Math.sin(angle) * velocity + Math.random() * 300 + 100,
        delay: Math.random() * 100,
      });
    }
    
    setParticles(newParticles);
    
    // Clean up after animation completes
    setTimeout(() => {
      setParticles([]);
      if (onComplete) {
        onComplete();
      }
    }, duration + 200);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticleComponent
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
};

interface ConfettiParticleComponentProps {
  particle: ConfettiParticle;
  duration: number;
}

const ConfettiParticleComponent: React.FC<ConfettiParticleComponentProps> = ({
  particle,
  duration,
}) => {
  const translateX = useSharedValue(particle.x);
  const translateY = useSharedValue(particle.y);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Animate position
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.endX, { duration })
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(particle.endY, { duration })
    );
    
    // Animate rotation
    rotation.value = withDelay(
      particle.delay,
      withTiming(360 * 3, { duration })
    );
    
    // Animate scale
    scale.value = withDelay(
      particle.delay,
      withTiming(0.5, { duration })
    );
    
    // Fade out towards the end
    opacity.value = withDelay(
      particle.delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size,
        },
        animatedStyle,
      ]}
    />
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
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default ConfettiExplosion; 