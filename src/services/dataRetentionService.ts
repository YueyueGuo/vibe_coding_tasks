import { WorkoutSession } from '../types/workout';
import { PersonalRecord } from '../types/workout';
import StorageManager from '../utils/storage';

export interface RetentionPolicy {
  workoutHistoryDays: number; // -1 for unlimited
  personalRecordsDays: number;
  analyticsDataDays: number;
  cacheRetentionDays: number;
}

export interface UserSubscription {
  tier: 'free' | 'premium' | 'pro';
  isActive: boolean;
  expiresAt?: Date;
}

export class DataRetentionService {
  // Default retention policies
  private static readonly RETENTION_POLICIES: Record<string, RetentionPolicy> = {
    free: {
      workoutHistoryDays: 90,
      personalRecordsDays: 90,
      analyticsDataDays: 30,
      cacheRetentionDays: 7,
    },
    premium: {
      workoutHistoryDays: -1, // Unlimited
      personalRecordsDays: -1,
      analyticsDataDays: 365,
      cacheRetentionDays: 30,
    },
    pro: {
      workoutHistoryDays: -1, // Unlimited
      personalRecordsDays: -1,
      analyticsDataDays: -1,
      cacheRetentionDays: 90,
    },
  };

  /**
   * Get user's current subscription status
   */
  static async getUserSubscription(): Promise<UserSubscription> {
    try {
      const subscription = await StorageManager.getItem<UserSubscription>('userSubscription');
      
      if (!subscription) {
        return { tier: 'free', isActive: true };
      }

      // Check if subscription is still active
      const isActive = subscription.expiresAt 
        ? new Date(subscription.expiresAt) > new Date()
        : true;

      return {
        ...subscription,
        isActive,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return { tier: 'free', isActive: true };
    }
  }

  /**
   * Get retention policy for current user
   */
  static async getRetentionPolicy(): Promise<RetentionPolicy> {
    const subscription = await this.getUserSubscription();
    const tier = subscription.isActive ? subscription.tier : 'free';
    return this.RETENTION_POLICIES[tier];
  }

  /**
   * Apply retention policy to workout history
   */
  static async applyWorkoutHistoryRetention(): Promise<{
    totalBefore: number;
    totalAfter: number;
    deletedCount: number;
  }> {
    try {
      const policy = await this.getRetentionPolicy();
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') || [];
      const totalBefore = allWorkouts.length;

      // If unlimited retention (premium users)
      if (policy.workoutHistoryDays === -1) {
        return { totalBefore, totalAfter: totalBefore, deletedCount: 0 };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.workoutHistoryDays);

      // Filter workouts within retention period
      const retainedWorkouts = allWorkouts.filter(workout => {
        const workoutDate = new Date(workout.completedAt || workout.createdAt);
        return workoutDate >= cutoffDate;
      });

      // Save filtered workouts
      await StorageManager.setItem('workoutHistory', retainedWorkouts);

      const deletedCount = totalBefore - retainedWorkouts.length;

      return {
        totalBefore,
        totalAfter: retainedWorkouts.length,
        deletedCount,
      };
    } catch (error) {
      console.error('Error applying workout history retention:', error);
      return { totalBefore: 0, totalAfter: 0, deletedCount: 0 };
    }
  }

  /**
   * Apply retention policy to personal records
   */
  static async applyPersonalRecordsRetention(): Promise<{
    totalBefore: number;
    totalAfter: number;
    deletedCount: number;
  }> {
    try {
      const policy = await this.getRetentionPolicy();
      const allPRs = await StorageManager.getItem<PersonalRecord[]>('personalRecords') || [];
      const totalBefore = allPRs.length;

      // If unlimited retention (premium users)
      if (policy.personalRecordsDays === -1) {
        return { totalBefore, totalAfter: totalBefore, deletedCount: 0 };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.personalRecordsDays);

      // Filter PRs within retention period
      const retainedPRs = allPRs.filter(pr => {
        const prDate = new Date(pr.achievedAt);
        return prDate >= cutoffDate;
      });

      // Save filtered PRs
      await StorageManager.setItem('personalRecords', retainedPRs);

      const deletedCount = totalBefore - retainedPRs.length;

      return {
        totalBefore,
        totalAfter: retainedPRs.length,
        deletedCount,
      };
    } catch (error) {
      console.error('Error applying personal records retention:', error);
      return { totalBefore: 0, totalAfter: 0, deletedCount: 0 };
    }
  }

  /**
   * Get data usage summary for user
   */
  static async getDataUsageSummary(): Promise<{
    subscription: UserSubscription;
    policy: RetentionPolicy;
    usage: {
      workouts: {
        total: number;
        oldestDate?: Date;
        withinRetention: number;
        beyondRetention: number;
      };
      personalRecords: {
        total: number;
        oldestDate?: Date;
        withinRetention: number;
        beyondRetention: number;
      };
    };
    nextCleanup?: Date;
  }> {
    try {
      const subscription = await this.getUserSubscription();
      const policy = await this.getRetentionPolicy();

      // Analyze workout data
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') || [];
      const workoutDates = allWorkouts.map(w => new Date(w.completedAt || w.createdAt));
      const oldestWorkoutDate = workoutDates.length > 0 
        ? new Date(Math.min(...workoutDates.map(d => d.getTime())))
        : undefined;

      let workoutsWithinRetention = allWorkouts.length;
      let workoutsBeyondRetention = 0;

      if (policy.workoutHistoryDays !== -1) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.workoutHistoryDays);
        
        workoutsWithinRetention = allWorkouts.filter(w => 
          new Date(w.completedAt || w.createdAt) >= cutoffDate
        ).length;
        workoutsBeyondRetention = allWorkouts.length - workoutsWithinRetention;
      }

      // Analyze personal records data
      const allPRs = await StorageManager.getItem<PersonalRecord[]>('personalRecords') || [];
      const prDates = allPRs.map(pr => new Date(pr.achievedAt));
      const oldestPRDate = prDates.length > 0 
        ? new Date(Math.min(...prDates.map(d => d.getTime())))
        : undefined;

      let prsWithinRetention = allPRs.length;
      let prsBeyondRetention = 0;

      if (policy.personalRecordsDays !== -1) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.personalRecordsDays);
        
        prsWithinRetention = allPRs.filter(pr => 
          new Date(pr.achievedAt) >= cutoffDate
        ).length;
        prsBeyondRetention = allPRs.length - prsWithinRetention;
      }

      // Calculate next cleanup date (weekly cleanup)
      const lastCleanup = await StorageManager.getItem<number>('lastDataCleanup') || Date.now();
      const nextCleanup = new Date(lastCleanup + (7 * 24 * 60 * 60 * 1000)); // Weekly

      return {
        subscription,
        policy,
        usage: {
          workouts: {
            total: allWorkouts.length,
            oldestDate: oldestWorkoutDate,
            withinRetention: workoutsWithinRetention,
            beyondRetention: workoutsBeyondRetention,
          },
          personalRecords: {
            total: allPRs.length,
            oldestDate: oldestPRDate,
            withinRetention: prsWithinRetention,
            beyondRetention: prsBeyondRetention,
          },
        },
        nextCleanup,
      };
    } catch (error) {
      console.error('Error getting data usage summary:', error);
      throw new Error('Failed to calculate data usage');
    }
  }

  /**
   * Perform comprehensive data cleanup
   */
  static async performDataCleanup(): Promise<{
    workouts: { totalBefore: number; totalAfter: number; deletedCount: number };
    personalRecords: { totalBefore: number; totalAfter: number; deletedCount: number };
    cleanupDate: Date;
  }> {
    try {
      console.log('Starting data cleanup...');

      const workoutCleanup = await this.applyWorkoutHistoryRetention();
      const prCleanup = await this.applyPersonalRecordsRetention();

      // Update last cleanup timestamp
      const cleanupDate = new Date();
      await StorageManager.setItem('lastDataCleanup', cleanupDate.getTime());

      console.log('Data cleanup completed:', {
        workouts: workoutCleanup,
        personalRecords: prCleanup,
      });

      return {
        workouts: workoutCleanup,
        personalRecords: prCleanup,
        cleanupDate,
      };
    } catch (error) {
      console.error('Error performing data cleanup:', error);
      throw new Error('Data cleanup failed');
    }
  }

  /**
   * Schedule automatic data cleanup (call this on app initialization)
   */
  static async scheduleAutomaticCleanup(): Promise<void> {
    try {
      const lastCleanup = await StorageManager.getItem<number>('lastDataCleanup') || 0;
      const daysSinceCleanup = (Date.now() - lastCleanup) / (24 * 60 * 60 * 1000);

      // Run cleanup if it's been more than 7 days
      if (daysSinceCleanup >= 7) {
        await this.performDataCleanup();
      }
    } catch (error) {
      console.error('Error scheduling automatic cleanup:', error);
    }
  }

  /**
   * Update user subscription status
   */
  static async updateSubscription(subscription: UserSubscription): Promise<void> {
    try {
      await StorageManager.setItem('userSubscription', subscription);
      
      // If downgrading to free, immediately apply retention policy
      if (subscription.tier === 'free') {
        await this.performDataCleanup();
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Get premium upgrade benefits (what user gains by upgrading)
   */
  static async getUpgradeBenefits(): Promise<{
    currentUsage: any;
    dataAtRisk: {
      workouts: number;
      personalRecords: number;
    };
    premiumBenefits: string[];
  }> {
    try {
      const usage = await this.getDataUsageSummary();
      
      return {
        currentUsage: usage,
        dataAtRisk: {
          workouts: usage.usage.workouts.beyondRetention,
          personalRecords: usage.usage.personalRecords.beyondRetention,
        },
        premiumBenefits: [
          'Unlimited workout history',
          'Unlimited personal records',
          'Advanced analytics (1 year)',
          'Priority sync and backup',
          'Export data capabilities',
          'No ads',
          'Priority customer support',
        ],
      };
    } catch (error) {
      console.error('Error getting upgrade benefits:', error);
      throw new Error('Failed to calculate upgrade benefits');
    }
  }
} 