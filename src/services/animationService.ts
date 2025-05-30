import { runOnJS } from 'react-native-reanimated';
import { HapticService } from './hapticService';

export type CelebrationType = 'setComplete' | 'personalRecord' | 'achievement' | 'levelUp';

/**
 * Service for managing animations and haptic feedback throughout the app
 */
export class AnimationService {
  private static celebrationQueue: Array<{
    type: CelebrationType;
    title?: string;
    subtitle?: string;
    callback?: () => void;
  }> = [];
  
  private static isShowingCelebration = false;

  /**
   * Trigger a celebration with haptic feedback
   */
  static async celebrate(
    type: CelebrationType,
    title?: string,
    subtitle?: string,
    withHaptics: boolean = true,
    callback?: () => void
  ) {
    if (withHaptics) {
      await this.triggerCelebrationHaptic(type);
    }

    // Queue celebration if one is already showing
    if (this.isShowingCelebration) {
      this.celebrationQueue.push({ type, title, subtitle, callback });
      return;
    }

    this.showCelebration(type, title, subtitle, callback);
  }

  /**
   * Show celebration immediately
   */
  private static showCelebration(
    type: CelebrationType,
    title?: string,
    subtitle?: string,
    callback?: () => void
  ) {
    this.isShowingCelebration = true;
    
    // This would be handled by a global celebration component
    // For now, we'll just simulate the duration
    const duration = this.getCelebrationDuration(type);
    
    setTimeout(() => {
      this.isShowingCelebration = false;
      if (callback) callback();
      
      // Show next celebration if queued
      this.processQueue();
    }, duration);
  }

  /**
   * Process celebration queue
   */
  private static processQueue() {
    if (this.celebrationQueue.length > 0 && !this.isShowingCelebration) {
      const next = this.celebrationQueue.shift()!;
      this.showCelebration(next.type, next.title, next.subtitle, next.callback);
    }
  }

  /**
   * Get celebration duration based on type
   */
  private static getCelebrationDuration(type: CelebrationType): number {
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
  }

  /**
   * Trigger haptic feedback based on celebration type
   */
  private static async triggerCelebrationHaptic(type: CelebrationType) {
    try {
      switch (type) {
        case 'setComplete':
          await HapticService.setCompleteFeedback();
          break;
        case 'personalRecord':
          await HapticService.personalRecordFeedback();
          break;
        case 'achievement':
          await HapticService.achievementFeedback();
          break;
        case 'levelUp':
          await HapticService.celebrationFeedback();
          break;
      }
    } catch (error) {
      console.warn('Celebration haptic feedback failed:', error);
    }
  }

  /**
   * Simple button press haptic
   */
  static async buttonPress() {
    await HapticService.impact('light');
  }

  /**
   * Timer haptic feedback
   */
  static async timerFeedback(type: 'start' | 'pause' | 'resume' | 'complete' | 'warning') {
    await HapticService.timerFeedback(type);
  }

  /**
   * Rep counter haptic
   */
  static async repCount() {
    await HapticService.repCountFeedback();
  }

  /**
   * Error haptic feedback
   */
  static async error() {
    await HapticService.errorFeedback();
  }

  /**
   * Selection haptic feedback
   */
  static async selection() {
    await HapticService.selection();
  }

  /**
   * Clear celebration queue
   */
  static clearQueue() {
    this.celebrationQueue = [];
  }
}

export default AnimationService; 