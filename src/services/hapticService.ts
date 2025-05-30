import * as Haptics from 'expo-haptics';

export type HapticFeedbackType = 
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'celebration'
  | 'achievement'
  | 'personalRecord';

export interface HapticSettings {
  enabled: boolean;
  celebrationIntensity: 'low' | 'medium' | 'high';
  buttonFeedback: boolean;
  achievementFeedback: boolean;
}

/**
 * Service for managing haptic feedback throughout the app
 */
export class HapticService {
  private static settings: HapticSettings = {
    enabled: true,
    celebrationIntensity: 'medium',
    buttonFeedback: true,
    achievementFeedback: true,
  };

  /**
   * Update haptic settings
   */
  static updateSettings(newSettings: Partial<HapticSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current haptic settings
   */
  static getSettings(): HapticSettings {
    return { ...this.settings };
  }

  /**
   * Check if haptics are available on the device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // expo-haptics automatically handles device capability checking
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Basic impact feedback for button presses and interactions
   */
  static async impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!this.settings.enabled || !this.settings.buttonFeedback) return;

    try {
      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      // Haptics not supported on device
      console.log('Haptics not supported');
    }
  }

  /**
   * Notification feedback for system events
   */
  static async notification(type: 'success' | 'warning' | 'error' = 'success') {
    if (!this.settings.enabled) return;

    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.log('Haptics not supported');
    }
  }

  /**
   * Selection feedback for UI selections and toggles
   */
  static async selection() {
    if (!this.settings.enabled || !this.settings.buttonFeedback) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.log('Haptics not supported');
    }
  }

  /**
   * Unified feedback method that accepts our custom types
   */
  static async feedback(type: HapticFeedbackType) {
    if (!this.settings.enabled) return;

    switch (type) {
      case 'light':
      case 'medium':
      case 'heavy':
        await this.impact(type);
        break;
      
      case 'success':
      case 'warning':
      case 'error':
        await this.notification(type);
        break;
      
      case 'selection':
        await this.selection();
        break;
      
      case 'celebration':
        await this.celebrationFeedback();
        break;
      
      case 'achievement':
        await this.achievementFeedback();
        break;
      
      case 'personalRecord':
        await this.personalRecordFeedback();
        break;
    }
  }

  /**
   * Custom celebration feedback sequence
   */
  static async celebrationFeedback() {
    if (!this.settings.enabled || !this.settings.achievementFeedback) return;

    try {
      const intensity = this.settings.celebrationIntensity;
      
      switch (intensity) {
        case 'low':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        
        case 'medium':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, 100);
          break;
        
        case 'high':
          // Triple burst for high celebration
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 100);
          setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, 200);
          break;
      }
    } catch (error) {
      console.warn('Celebration haptic failed:', error);
    }
  }

  /**
   * Achievement unlocked feedback
   */
  static async achievementFeedback() {
    if (!this.settings.enabled || !this.settings.achievementFeedback) return;

    try {
      // Achievement pattern: Medium impact + Success notification
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 150);
    } catch (error) {
      console.warn('Achievement haptic failed:', error);
    }
  }

  /**
   * Personal Record feedback - most intense celebration
   */
  static async personalRecordFeedback() {
    if (!this.settings.enabled || !this.settings.achievementFeedback) return;

    try {
      // PR pattern: Heavy + Success + Medium + Success sequence
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 100);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 250);
      
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 400);
    } catch (error) {
      console.warn('Personal record haptic failed:', error);
    }
  }

  /**
   * Workout timer feedback patterns
   */
  static async timerFeedback(type: 'start' | 'pause' | 'resume' | 'complete' | 'warning') {
    if (!this.settings.enabled) return;

    try {
      switch (type) {
        case 'start':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'pause':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'resume':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'complete':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    } catch (error) {
      console.warn('Timer haptic failed:', error);
    }
  }

  /**
   * Set completion feedback
   */
  static async setCompleteFeedback() {
    if (!this.settings.enabled) return;

    try {
      // Quick success feedback for set completion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Set complete haptic failed:', error);
    }
  }

  /**
   * Rep counter feedback
   */
  static async repCountFeedback() {
    if (!this.settings.enabled || !this.settings.buttonFeedback) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Rep count haptic failed:', error);
    }
  }

  /**
   * Error/invalid input feedback
   */
  static async errorFeedback() {
    if (!this.settings.enabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Error haptic failed:', error);
    }
  }

  /**
   * Enable all haptic feedback
   */
  static enable() {
    this.settings.enabled = true;
  }

  /**
   * Disable all haptic feedback
   */
  static disable() {
    this.settings.enabled = false;
  }

  /**
   * Toggle haptic feedback
   */
  static toggle() {
    this.settings.enabled = !this.settings.enabled;
  }
}

export default HapticService; 