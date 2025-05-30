import { userStorage, workoutStorage, settingsStorage } from './storage';

// Helper functions for persisting specific data types
export class PersistenceHelpers {
  // User data persistence
  static async saveUserSession(userData: {
    user: any;
    token: string;
    refreshToken?: string;
  }): Promise<void> {
    await userStorage.setItem('session', userData);
  }

  static async getUserSession(): Promise<any> {
    return await userStorage.getItem('session');
  }

  static async clearUserSession(): Promise<void> {
    await userStorage.removeItem('session');
  }

  // Workout data persistence
  static async saveCurrentWorkout(workout: any): Promise<void> {
    await workoutStorage.setItem('currentWorkout', workout);
  }

  static async getCurrentWorkout(): Promise<any> {
    return await workoutStorage.getItem('currentWorkout');
  }

  static async clearCurrentWorkout(): Promise<void> {
    await workoutStorage.removeItem('currentWorkout');
  }

  // Workout history with 90-day limit for free users
  static async saveWorkoutHistory(workouts: any[], isPremium: boolean = false): Promise<void> {
    const filteredWorkouts = isPremium 
      ? workouts 
      : workouts.filter(workout => {
          const workoutDate = new Date(workout.startTime);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return workoutDate >= ninetyDaysAgo;
        });

    await workoutStorage.setItem('workoutHistory', filteredWorkouts);
  }

  static async getWorkoutHistory(): Promise<any[]> {
    return (await workoutStorage.getItem('workoutHistory')) || [];
  }

  // Personal records
  static async savePersonalRecords(prs: any[]): Promise<void> {
    await workoutStorage.setItem('personalRecords', prs);
  }

  static async getPersonalRecords(): Promise<any[]> {
    return (await workoutStorage.getItem('personalRecords')) || [];
  }

  // App settings
  static async saveAppSettings(settings: any): Promise<void> {
    await settingsStorage.setItem('appSettings', settings);
  }

  static async getAppSettings(): Promise<any> {
    return await settingsStorage.getItem('appSettings');
  }

  // Workout templates
  static async saveWorkoutTemplates(templates: any[]): Promise<void> {
    await workoutStorage.setItem('workoutTemplates', templates);
  }

  static async getWorkoutTemplates(): Promise<any[]> {
    return (await workoutStorage.getItem('workoutTemplates')) || [];
  }

  // Exercise library cache
  static async saveExerciseLibrary(exercises: any[]): Promise<void> {
    await workoutStorage.setItem('exerciseLibrary', exercises);
  }

  static async getExerciseLibrary(): Promise<any[]> {
    return (await workoutStorage.getItem('exerciseLibrary')) || [];
  }

  // Complete data clear (for logout)
  static async clearAllUserData(): Promise<void> {
    await Promise.all([
      userStorage.clear(),
      workoutStorage.clear(),
      settingsStorage.clear(),
    ]);
  }

  // Backup data to a single object
  static async createBackup(): Promise<any> {
    const [userSession, workoutHistory, personalRecords, templates, settings] = await Promise.all([
      this.getUserSession(),
      this.getWorkoutHistory(),
      this.getPersonalRecords(),
      this.getWorkoutTemplates(),
      this.getAppSettings(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        userSession,
        workoutHistory,
        personalRecords,
        templates,
        settings,
      },
    };
  }

  // Restore data from backup
  static async restoreFromBackup(backup: any): Promise<void> {
    if (backup.data) {
      const { userSession, workoutHistory, personalRecords, templates, settings } = backup.data;
      
      await Promise.all([
        userSession && this.saveUserSession(userSession),
        workoutHistory && this.saveWorkoutHistory(workoutHistory, true), // Assume premium for restore
        personalRecords && this.savePersonalRecords(personalRecords),
        templates && this.saveWorkoutTemplates(templates),
        settings && this.saveAppSettings(settings),
      ]);
    }
  }
} 