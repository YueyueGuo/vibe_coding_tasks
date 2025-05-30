import {
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

/**
 * Animation configuration presets for consistent timing across the app
 */
export const AnimationConfig = {
  // Fast animations for immediate feedback
  fast: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  
  // Normal animations for standard interactions
  normal: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  
  // Slow animations for emphasis
  slow: {
    duration: 500,
    easing: Easing.out(Easing.cubic),
  },
  
  // Spring configurations
  spring: {
    light: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    medium: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
    bouncy: {
      damping: 8,
      stiffness: 80,
      mass: 1,
    },
  },
};

/**
 * Common animation utilities
 */
export class AnimationUtils {
  /**
   * Fade in animation
   */
  static fadeIn(
    opacity: SharedValue<number>,
    duration: number = AnimationConfig.normal.duration,
    delay: number = 0
  ) {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: AnimationConfig.normal.easing })
    );
  }

  /**
   * Fade out animation
   */
  static fadeOut(
    opacity: SharedValue<number>,
    duration: number = AnimationConfig.normal.duration,
    delay: number = 0
  ) {
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration, easing: AnimationConfig.normal.easing })
    );
  }

  /**
   * Scale animation for buttons and interactive elements
   */
  static scalePress(scale: SharedValue<number>) {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  }

  /**
   * Bounce animation for achievements
   */
  static bounce(scale: SharedValue<number>, intensity: number = 1.2) {
    scale.value = withSequence(
      withTiming(intensity, { duration: 200 }),
      withSpring(1, AnimationConfig.spring.bouncy)
    );
  }

  /**
   * Shake animation for errors
   */
  static shake(translateX: SharedValue<number>, intensity: number = 10) {
    translateX.value = withSequence(
      withTiming(-intensity, { duration: 50 }),
      withRepeat(
        withSequence(
          withTiming(intensity, { duration: 50 }),
          withTiming(-intensity, { duration: 50 })
        ),
        3,
        true
      ),
      withTiming(0, { duration: 50 })
    );
  }

  /**
   * Slide in from bottom (great for modals)
   */
  static slideInFromBottom(
    translateY: SharedValue<number>,
    opacity: SharedValue<number>,
    screenHeight: number = 1000
  ) {
    translateY.value = screenHeight;
    opacity.value = 0;
    
    translateY.value = withSpring(0, AnimationConfig.spring.medium);
    opacity.value = withTiming(1, AnimationConfig.normal);
  }

  /**
   * Slide out to bottom
   */
  static slideOutToBottom(
    translateY: SharedValue<number>,
    opacity: SharedValue<number>,
    screenHeight: number = 1000,
    onComplete?: () => void
  ) {
    translateY.value = withTiming(screenHeight, AnimationConfig.normal, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
    opacity.value = withTiming(0, AnimationConfig.normal);
  }

  /**
   * Progress bar animation
   */
  static animateProgress(
    progress: SharedValue<number>,
    targetProgress: number,
    duration: number = 1000
  ) {
    progress.value = withTiming(targetProgress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }

  /**
   * Pulse animation for attention-grabbing elements
   */
  static pulse(scale: SharedValue<number>, intensity: number = 1.1) {
    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1, // infinite
      true
    );
  }

  /**
   * Rotation animation
   */
  static rotate(rotation: SharedValue<number>, degrees: number = 360) {
    rotation.value = withTiming(degrees, {
      duration: 1000,
      easing: Easing.linear,
    });
  }

  /**
   * Confetti celebration - individual particle animation
   */
  static animateConfettiParticle(
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    rotation: SharedValue<number>,
    opacity: SharedValue<number>,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 2000
  ) {
    // Start position
    translateX.value = startX;
    translateY.value = startY;
    rotation.value = 0;
    opacity.value = 1;

    // Animate to end position
    translateX.value = withTiming(endX, { duration });
    translateY.value = withTiming(endY, { 
      duration, 
      easing: Easing.out(Easing.cubic) 
    });
    rotation.value = withTiming(360 * 3, { 
      duration, 
      easing: Easing.linear 
    });
    opacity.value = withDelay(
      duration * 0.7, // Start fading at 70% of animation
      withTiming(0, { duration: duration * 0.3 })
    );
  }

  /**
   * Success animation sequence (scale + bounce)
   */
  static successAnimation(
    scale: SharedValue<number>,
    onComplete?: () => void
  ) {
    scale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, AnimationConfig.spring.bouncy, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }

  /**
   * Loading animation (continuous rotation)
   */
  static startLoadingRotation(rotation: SharedValue<number>) {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }

  /**
   * Stop loading animation
   */
  static stopLoadingRotation(rotation: SharedValue<number>) {
    rotation.value = withTiming(0, { duration: 200 });
  }
}

/**
 * Easing presets for common animation curves
 */
export const EasingPresets = {
  // Ease out cubic - great for entrances
  easeOutCubic: Easing.out(Easing.cubic),
  
  // Ease in cubic - great for exits
  easeInCubic: Easing.in(Easing.cubic),
  
  // Ease in-out cubic - great for general animations
  easeInOutCubic: Easing.inOut(Easing.cubic),
  
  // Ease out back - great for bouncy entrances
  easeOutBack: Easing.out(Easing.back(1.7)),
  
  // Ease out elastic - great for celebrations
  easeOutElastic: Easing.out(Easing.elastic(1.5)),
  
  // Linear - for continuous animations
  linear: Easing.linear,
};

export default AnimationUtils; 