import { AppState, AppStateStatus } from 'react-native';
import StorageManager from '../utils/storage';
import { WorkoutSession } from '../types/workout';

export class WorkoutSessionRecovery {
  private static isMonitoring = false;
  private static lastActiveTimestamp = Date.now();
  
  /**
   * Start monitoring app state for crash detection
   */
  static startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Update last active timestamp periodically
    setInterval(() => {
      if (AppState.currentState === 'active') {
        this.updateLastActiveTimestamp();
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Stop monitoring app state
   */
  static stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
  
  /**
   * Handle app state changes
   */
  private static handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background, save current session state
      await this.saveSessionBeforeBackground();
    } else if (nextAppState === 'active') {
      // App is coming back to foreground
      await this.checkForCrashedSession();
      this.updateLastActiveTimestamp();
    }
  };
  
  /**
   * Save current session before app goes to background
   */
  private static async saveSessionBeforeBackground() {
    try {
      this.updateLastActiveTimestamp();
      
      // Mark that the app is going to background normally
      await StorageManager.setItem('appBackgroundTimestamp', Date.now());
      
      // Force save any pending session data
      const currentSession = await StorageManager.getItem<WorkoutSession>('currentWorkoutSession');
      if (currentSession && (currentSession.status === 'active' || currentSession.status === 'paused')) {
        const updatedSession = {
          ...currentSession,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        };
        await StorageManager.setItem('currentWorkoutSession', updatedSession);
      }
    } catch (error) {
      console.error('Error saving session before background:', error);
    }
  }
  
  /**
   * Check if the app crashed since last use
   */
  private static async checkForCrashedSession() {
    try {
      const backgroundTimestamp = await StorageManager.getItem<number>('appBackgroundTimestamp');
      const lastActiveTimestamp = await StorageManager.getItem<number>('lastActiveTimestamp');
      
      // If there's no background timestamp but there's a last active timestamp,
      // the app likely crashed
      if (!backgroundTimestamp && lastActiveTimestamp) {
        const timeSinceLastActive = Date.now() - lastActiveTimestamp;
        const oneHour = 60 * 60 * 1000;
        
        // If it's been more than 1 hour, consider it a potential crash
        if (timeSinceLastActive > oneHour) {
          console.log('Potential app crash detected');
          return true;
        }
      }
      
      // Clear the background timestamp for next cycle
      await StorageManager.removeItem('appBackgroundTimestamp');
      return false;
    } catch (error) {
      console.error('Error checking for crashed session:', error);
      return false;
    }
  }
  
  /**
   * Update last active timestamp
   */
  private static updateLastActiveTimestamp() {
    this.lastActiveTimestamp = Date.now();
    StorageManager.setItem('lastActiveTimestamp', this.lastActiveTimestamp);
  }
  
  /**
   * Check for orphaned workout sessions and offer recovery
   */
  static async checkForOrphanedSessions(): Promise<WorkoutSession[]> {
    try {
      const currentSession = await StorageManager.getItem<WorkoutSession>('currentWorkoutSession');
      const allSessions = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') ?? [];
      
      const orphanedSessions: WorkoutSession[] = [];
      
      // Check if current session is actually orphaned (older than 24 hours and still active)
      if (currentSession && (currentSession.status === 'active' || currentSession.status === 'paused')) {
        const sessionAge = Date.now() - new Date(currentSession.startedAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (sessionAge > twentyFourHours) {
          orphanedSessions.push(currentSession);
        } else {
          // Check if session might be from a crash (no recent updates)
          const lastUpdate = currentSession.updatedAt ? new Date(currentSession.updatedAt).getTime() : new Date(currentSession.startedAt).getTime();
          const timeSinceUpdate = Date.now() - lastUpdate;
          const twoHours = 2 * 60 * 60 * 1000;
          
          if (timeSinceUpdate > twoHours) {
            orphanedSessions.push(currentSession);
          }
        }
      }
      
      // Check for any incomplete sessions in history
      const incompleteSessions = allSessions.filter(session => 
        session.status === 'active' || session.status === 'paused'
      );
      
      orphanedSessions.push(...incompleteSessions);
      
      return orphanedSessions;
    } catch (error) {
      console.error('Error checking for orphaned sessions:', error);
      return [];
    }
  }
  
  /**
   * Recover a specific workout session with retry logic
   */
  static async recoverSession(session: WorkoutSession, retryCount = 0): Promise<boolean> {
    try {
      // Update session status and timestamp
      const recoveredSession: WorkoutSession = {
        ...session,
        status: 'active',
        updatedAt: new Date(),
        recoveredAt: new Date(),
        recoveryAttempts: (session.recoveryAttempts || 0) + 1,
      };
      
      await StorageManager.setItem('currentWorkoutSession', recoveredSession);
      
      // Clear any orphaned session flags
      await StorageManager.removeItem('appBackgroundTimestamp');
      await StorageManager.removeItem('lastActiveTimestamp');
      
      return true;
    } catch (error) {
      console.error('Error recovering session:', error);
      
      // Retry up to 3 times
      if (retryCount < 3) {
        console.log(`Retrying session recovery, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.recoverSession(session, retryCount + 1);
      }
      
      return false;
    }
  }
  
  /**
   * Discard an orphaned session (mark as completed or cancelled)
   */
  static async discardSession(session: WorkoutSession, markAsCompleted: boolean = false): Promise<boolean> {
    try {
      if (markAsCompleted) {
        // Mark as completed and add to history
        const completedSession: WorkoutSession = {
          ...session,
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
          durationSeconds: session.durationSeconds || Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
        };
        
        const history = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') ?? [];
        history.unshift(completedSession);
        
        // Keep only last 90 days for free users
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const filteredHistory = history.filter(session => 
          new Date(session.createdAt) > ninetyDaysAgo
        );
        
        await StorageManager.setItem('workoutHistory', filteredHistory);
      }
      
      // Remove from current session
      await StorageManager.removeItem('currentWorkoutSession');
      
      // Clear recovery flags
      await StorageManager.removeItem('appBackgroundTimestamp');
      await StorageManager.removeItem('lastActiveTimestamp');
      
      return true;
    } catch (error) {
      console.error('Error discarding session:', error);
      return false;
    }
  }
  
  /**
   * Clean up old session data beyond retention period
   */
  static async cleanupOldSessions(): Promise<void> {
    try {
      const history = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') ?? [];
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const filteredHistory = history.filter(session => 
        new Date(session.createdAt) > ninetyDaysAgo
      );
      
      await StorageManager.setItem('workoutHistory', filteredHistory);
      
      // Clean up old recovery metadata
      const lastActiveTimestamp = await StorageManager.getItem<number>('lastActiveTimestamp');
      if (lastActiveTimestamp) {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (lastActiveTimestamp < sevenDaysAgo) {
          await StorageManager.removeItem('lastActiveTimestamp');
          await StorageManager.removeItem('appBackgroundTimestamp');
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }
  
  /**
   * Get recovery statistics
   */
  static async getRecoveryStats(): Promise<{
    totalRecoveries: number;
    lastRecoveryDate?: Date;
    averageRecoveryTime: number;
  }> {
    try {
      const stats = await StorageManager.getItem<any>('recoveryStats') || {
        totalRecoveries: 0,
        recoveryTimes: [],
      };
      
      return {
        totalRecoveries: stats.totalRecoveries,
        lastRecoveryDate: stats.lastRecoveryDate ? new Date(stats.lastRecoveryDate) : undefined,
        averageRecoveryTime: stats.recoveryTimes.length > 0 
          ? stats.recoveryTimes.reduce((a: number, b: number) => a + b, 0) / stats.recoveryTimes.length 
          : 0,
      };
    } catch (error) {
      console.error('Error getting recovery stats:', error);
      return { totalRecoveries: 0, averageRecoveryTime: 0 };
    }
  }
} 