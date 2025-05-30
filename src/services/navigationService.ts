import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Create a ref for the navigation container
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigation service for programmatic navigation without direct access to navigation prop
 */
export class NavigationService {
  /**
   * Navigate to a specific route
   */
  static navigate(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
      // @ts-ignore - Type assertion for generic navigation
      navigationRef.navigate(name, params);
    }
  }

  /**
   * Go back to the previous screen
   */
  static goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }

  /**
   * Reset the navigation stack to a specific route
   */
  static reset(routeName: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName as never, params }],
      });
    }
  }

  /**
   * Push a new screen onto the stack
   */
  static push(name: string, params?: any) {
    if (navigationRef.isReady()) {
      // @ts-ignore - push method exists but TypeScript doesn't recognize it
      navigationRef.push(name, params);
    }
  }

  /**
   * Replace the current route with a new one
   */
  static replace(name: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
      // @ts-ignore - replace method exists but TypeScript doesn't recognize it
      navigationRef.replace(name, params);
    }
  }

  /**
   * Get the current route name
   */
  static getCurrentRoute() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  }

  /**
   * Check if navigation is ready
   */
  static isReady(): boolean {
    return navigationRef.isReady();
  }

  /**
   * Navigate to auth flow
   */
  static navigateToAuth() {
    this.reset('Auth');
  }

  /**
   * Navigate to main app flow
   */
  static navigateToMain() {
    this.reset('Main');
  }

  /**
   * Navigate to onboarding flow
   */
  static navigateToOnboarding() {
    this.reset('Onboarding');
  }

  /**
   * Navigate to a specific tab in the main app
   */
  static navigateToTab(tabName: string) {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main' as never);
      // Navigate to specific tab after a small delay to ensure main navigator is ready
      setTimeout(() => {
        // @ts-ignore
        navigationRef.navigate(tabName);
      }, 100);
    }
  }

  /**
   * Navigate to workout flow
   */
  static navigateToWorkout(workoutId?: string) {
    this.navigateToTab('Workouts');
    setTimeout(() => {
      if (workoutId) {
        // @ts-ignore
        navigationRef.navigate('Workouts', {
          screen: 'ActiveWorkout',
          params: { workoutId },
        });
      }
    }, 150);
  }

  /**
   * Navigate to exercise detail
   */
  static navigateToExercise(exerciseId: string, fromTab: 'Workouts' | 'Library' = 'Library') {
    this.navigateToTab(fromTab);
    setTimeout(() => {
      // @ts-ignore
      navigationRef.navigate(fromTab, {
        screen: 'ExerciseDetail',
        params: { exerciseId },
      });
    }, 150);
  }

  /**
   * Navigate to progress tracking
   */
  static navigateToProgress() {
    this.navigateToTab('Progress');
  }

  /**
   * Navigate to profile/settings
   */
  static navigateToProfile() {
    this.navigateToTab('Profile');
  }
}

export default NavigationService; 