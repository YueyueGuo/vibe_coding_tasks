import { WorkoutSession, WorkoutExercise, WorkoutSet } from '../types/workout';
import StorageManager from '../utils/storage';

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  totalWorkouts: number;
  lastWorkoutDate: Date;
  bestSet: WorkoutSet;
  previousWorkouts: Array<{
    sessionId: string;
    date: Date;
    sets: WorkoutSet[];
    totalVolume: number;
    bestSet: WorkoutSet;
  }>;
  progressTrend: 'improving' | 'maintaining' | 'declining';
}

export interface WorkoutHistoryFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  exerciseIds?: string[];
  muscleGroups?: string[];
  workoutTypes?: string[];
  minDuration?: number;
  maxDuration?: number;
}

export interface WorkoutHistoryPage {
  workouts: WorkoutSession[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

export class WorkoutHistoryService {
  private static readonly PAGE_SIZE = 20;
  private static readonly STORAGE_KEY = 'workoutHistory';

  /**
   * Get paginated workout history
   */
  static async getWorkoutHistory(
    page: number = 0,
    pageSize: number = this.PAGE_SIZE,
    filters?: WorkoutHistoryFilters
  ): Promise<WorkoutHistoryPage> {
    try {
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>(this.STORAGE_KEY) || [];
      
      // Apply filters
      let filteredWorkouts = allWorkouts;
      
      if (filters) {
        filteredWorkouts = this.applyFilters(allWorkouts, filters);
      }
      
      // Sort by date (newest first)
      filteredWorkouts.sort((a, b) => 
        new Date(b.completedAt || b.createdAt).getTime() - 
        new Date(a.completedAt || a.createdAt).getTime()
      );
      
      // Paginate
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedWorkouts = filteredWorkouts.slice(startIndex, endIndex);
      
      return {
        workouts: paginatedWorkouts,
        totalCount: filteredWorkouts.length,
        hasMore: endIndex < filteredWorkouts.length,
        nextPageToken: endIndex < filteredWorkouts.length ? `page_${page + 1}` : undefined,
      };
    } catch (error) {
      console.error('Error getting workout history:', error);
      throw new Error('Failed to load workout history');
    }
  }

  /**
   * Get exercise history for a specific exercise
   */
  static async getExerciseHistory(
    exerciseId: string,
    maxWorkouts: number = 10
  ): Promise<ExerciseHistory | null> {
    try {
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>(this.STORAGE_KEY) || [];
      
      const workoutsWithExercise = allWorkouts
        .filter(workout => 
          workout.status === 'completed' && 
          workout.exercises.some(ex => ex.exerciseId === exerciseId)
        )
        .sort((a, b) => 
          new Date(b.completedAt || b.createdAt).getTime() - 
          new Date(a.completedAt || a.createdAt).getTime()
        )
        .slice(0, maxWorkouts);

      if (workoutsWithExercise.length === 0) {
        return null;
      }

      const firstWorkout = workoutsWithExercise[0];
      const exerciseData = firstWorkout.exercises.find(ex => ex.exerciseId === exerciseId);
      if (!exerciseData) return null;

      // Calculate best set across all workouts
      const allSets = workoutsWithExercise.flatMap(workout => {
        const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
        return exercise?.sets.filter(set => set.completed) || [];
      });

      const bestSet = this.findBestSet(allSets);

      // Build previous workouts data
      const previousWorkouts = workoutsWithExercise.map(workout => {
        const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId)!;
        const completedSets = exercise.sets.filter(set => set.completed);
        const totalVolume = completedSets.reduce((sum, set) => 
          sum + (set.weight || 0) * (set.reps || 0), 0
        );
        const workoutBestSet = this.findBestSet(completedSets);

        return {
          sessionId: workout.id,
          date: new Date(workout.completedAt || workout.createdAt),
          sets: completedSets,
          totalVolume,
          bestSet: workoutBestSet,
        };
      });

      // Calculate progress trend
      const progressTrend = this.calculateProgressTrend(previousWorkouts);

      return {
        exerciseId,
        exerciseName: exerciseData.exerciseName,
        totalWorkouts: workoutsWithExercise.length,
        lastWorkoutDate: new Date(workoutsWithExercise[0].completedAt || workoutsWithExercise[0].createdAt),
        bestSet,
        previousWorkouts,
        progressTrend,
      };
    } catch (error) {
      console.error('Error getting exercise history:', error);
      return null;
    }
  }

  /**
   * Get last workout data for an exercise (for suggestions)
   */
  static async getLastWorkout(exerciseId: string): Promise<WorkoutSet[] | null> {
    try {
      const exerciseHistory = await this.getExerciseHistory(exerciseId, 1);
      if (!exerciseHistory || exerciseHistory.previousWorkouts.length === 0) {
        return null;
      }
      
      return exerciseHistory.previousWorkouts[0].sets;
    } catch (error) {
      console.error('Error getting last workout:', error);
      return null;
    }
  }

  /**
   * Get suggested set values based on workout history
   */
  static async getSuggestedSetValues(
    exerciseId: string,
    setNumber: number
  ): Promise<{ weight?: number; reps?: number }> {
    try {
      const lastWorkoutSets = await this.getLastWorkout(exerciseId);
      if (!lastWorkoutSets || lastWorkoutSets.length === 0) {
        return {};
      }

      // Try to get the corresponding set number from last workout
      const correspondingSet = lastWorkoutSets.find(set => set.setNumber === setNumber);
      if (correspondingSet) {
        return {
          weight: correspondingSet.weight,
          reps: correspondingSet.reps,
        };
      }

      // Fallback to the last set if no corresponding set number
      const lastSet = lastWorkoutSets[lastWorkoutSets.length - 1];
      return {
        weight: lastSet.weight,
        reps: lastSet.reps,
      };
    } catch (error) {
      console.error('Error getting suggested set values:', error);
      return {};
    }
  }

  /**
   * Search workouts by text
   */
  static async searchWorkouts(
    query: string,
    maxResults: number = 50
  ): Promise<WorkoutSession[]> {
    try {
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>(this.STORAGE_KEY) || [];
      const lowerQuery = query.toLowerCase();

      const matchingWorkouts = allWorkouts.filter(workout => {
        // Search in workout name
        if (workout.name?.toLowerCase().includes(lowerQuery)) return true;
        
        // Search in exercise names
        if (workout.exercises.some(ex => 
          ex.exerciseName.toLowerCase().includes(lowerQuery)
        )) return true;
        
        // Search in notes
        if (workout.notes?.toLowerCase().includes(lowerQuery)) return true;
        
        // Search in template name
        if (workout.templateName?.toLowerCase().includes(lowerQuery)) return true;
        
        return false;
      });

      return matchingWorkouts
        .sort((a, b) => 
          new Date(b.completedAt || b.createdAt).getTime() - 
          new Date(a.completedAt || a.createdAt).getTime()
        )
        .slice(0, maxResults);
    } catch (error) {
      console.error('Error searching workouts:', error);
      return [];
    }
  }

  /**
   * Delete workout from history
   */
  static async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>(this.STORAGE_KEY) || [];
      const filteredWorkouts = allWorkouts.filter(workout => workout.id !== workoutId);
      
      await StorageManager.setItem(this.STORAGE_KEY, filteredWorkouts);
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  /**
   * Get workout statistics
   */
  static async getWorkoutStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalWorkouts: number;
    totalSets: number;
    totalVolume: number;
    totalDuration: number;
    averageWorkoutDuration: number;
    mostFrequentExercises: Array<{ exerciseId: string; exerciseName: string; count: number }>;
    workoutFrequency: number; // workouts per week
  }> {
    try {
      const allWorkouts = await StorageManager.getItem<WorkoutSession[]>(this.STORAGE_KEY) || [];
      let filteredWorkouts = allWorkouts.filter(w => w.status === 'completed');

      if (dateRange) {
        filteredWorkouts = filteredWorkouts.filter(workout => {
          const workoutDate = new Date(workout.completedAt || workout.createdAt);
          return workoutDate >= dateRange.start && workoutDate <= dateRange.end;
        });
      }

      const totalWorkouts = filteredWorkouts.length;
      const totalSets = filteredWorkouts.reduce((sum, workout) => 
        sum + workout.exercises.reduce((exerciseSum, exercise) => 
          exerciseSum + exercise.sets.filter(set => set.completed).length, 0
        ), 0
      );
      
      const totalVolume = filteredWorkouts.reduce((sum, workout) => 
        sum + workout.exercises.reduce((exerciseSum, exercise) => 
          exerciseSum + exercise.sets
            .filter(set => set.completed && set.weight && set.reps)
            .reduce((setSum, set) => setSum + (set.weight! * set.reps!), 0), 0
        ), 0
      );

      const totalDuration = filteredWorkouts.reduce((sum, workout) => 
        sum + (workout.durationSeconds || 0), 0
      );

      const averageWorkoutDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

      // Calculate most frequent exercises
      const exerciseFrequency: { [key: string]: { name: string; count: number } } = {};
      filteredWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (!exerciseFrequency[exercise.exerciseId]) {
            exerciseFrequency[exercise.exerciseId] = {
              name: exercise.exerciseName,
              count: 0,
            };
          }
          exerciseFrequency[exercise.exerciseId].count++;
        });
      });

      const mostFrequentExercises = Object.entries(exerciseFrequency)
        .map(([exerciseId, data]) => ({
          exerciseId,
          exerciseName: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate workout frequency (workouts per week)
      let workoutFrequency = 0;
      if (filteredWorkouts.length > 1) {
        const firstWorkout = new Date(filteredWorkouts[filteredWorkouts.length - 1].completedAt || 
                                     filteredWorkouts[filteredWorkouts.length - 1].createdAt);
        const lastWorkout = new Date(filteredWorkouts[0].completedAt || filteredWorkouts[0].createdAt);
        const daysDifference = (lastWorkout.getTime() - firstWorkout.getTime()) / (1000 * 60 * 60 * 24);
        const weeksDifference = daysDifference / 7;
        workoutFrequency = weeksDifference > 0 ? totalWorkouts / weeksDifference : 0;
      }

      return {
        totalWorkouts,
        totalSets,
        totalVolume,
        totalDuration,
        averageWorkoutDuration,
        mostFrequentExercises,
        workoutFrequency,
      };
    } catch (error) {
      console.error('Error getting workout statistics:', error);
      throw new Error('Failed to calculate workout statistics');
    }
  }

  // Private helper methods
  private static applyFilters(
    workouts: WorkoutSession[],
    filters: WorkoutHistoryFilters
  ): WorkoutSession[] {
    let filtered = workouts;

    if (filters.dateRange) {
      filtered = filtered.filter(workout => {
        const workoutDate = new Date(workout.completedAt || workout.createdAt);
        return workoutDate >= filters.dateRange!.start && workoutDate <= filters.dateRange!.end;
      });
    }

    if (filters.exerciseIds && filters.exerciseIds.length > 0) {
      filtered = filtered.filter(workout =>
        workout.exercises.some(exercise =>
          filters.exerciseIds!.includes(exercise.exerciseId)
        )
      );
    }

    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      filtered = filtered.filter(workout =>
        workout.exercises.some(exercise =>
          exercise.muscleGroups.some(muscle =>
            filters.muscleGroups!.includes(muscle)
          )
        )
      );
    }

    if (filters.minDuration !== undefined) {
      filtered = filtered.filter(workout =>
        (workout.durationSeconds || 0) >= filters.minDuration!
      );
    }

    if (filters.maxDuration !== undefined) {
      filtered = filtered.filter(workout =>
        (workout.durationSeconds || 0) <= filters.maxDuration!
      );
    }

    return filtered;
  }

  private static findBestSet(sets: WorkoutSet[]): WorkoutSet {
    if (sets.length === 0) {
      throw new Error('Cannot find best set from empty array');
    }

    // Sort by estimated 1RM (weight × (1 + reps/30))
    return sets.reduce((best, current) => {
      const bestEstimate1RM = (best.weight || 0) * (1 + ((best.reps || 0) / 30));
      const currentEstimate1RM = (current.weight || 0) * (1 + ((current.reps || 0) / 30));
      return currentEstimate1RM > bestEstimate1RM ? current : best;
    });
  }

  private static calculateProgressTrend(
    workouts: Array<{ date: Date; totalVolume: number; bestSet: WorkoutSet }>
  ): 'improving' | 'maintaining' | 'declining' {
    if (workouts.length < 2) return 'maintaining';

    // Compare recent workouts (last 3) vs older workouts (3 before that)
    const recentWorkouts = workouts.slice(0, Math.min(3, workouts.length));
    const olderWorkouts = workouts.slice(3, Math.min(6, workouts.length));

    if (olderWorkouts.length === 0) return 'maintaining';

    const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) / recentWorkouts.length;
    const olderAvgVolume = olderWorkouts.reduce((sum, w) => sum + w.totalVolume, 0) / olderWorkouts.length;

    const improvement = (recentAvgVolume - olderAvgVolume) / olderAvgVolume;

    if (improvement > 0.1) return 'improving';  // 10% improvement
    if (improvement < -0.1) return 'declining'; // 10% decline
    return 'maintaining';
  }
} 