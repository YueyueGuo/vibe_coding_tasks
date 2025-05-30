import { Exercise } from '../types';
import exerciseData from '../data/exerciseLibrary.json';
import StorageManager from '../utils/storage';

export class ExerciseLibraryService {
  private static exerciseCache: Exercise[] | null = null;

  /**
   * Get all exercises from library
   */
  static async getAllExercises(): Promise<Exercise[]> {
    if (this.exerciseCache) {
      return this.exerciseCache;
    }

    try {
      // Load built-in exercises
      const builtInExercises: Exercise[] = exerciseData.exercises;
      
      // Load custom exercises from storage
      const customExercises = await StorageManager.getItem<Exercise[]>('customExercises') || [];
      
      // Combine and cache
      this.exerciseCache = [...builtInExercises, ...customExercises];
      return this.exerciseCache;
    } catch (error) {
      console.error('Error loading exercises:', error);
      return exerciseData.exercises;
    }
  }

  /**
   * Get recently used exercises
   */
  static async getRecentExercises(limit: number = 10): Promise<Exercise[]> {
    try {
      const recentIds = await StorageManager.getItem<string[]>('recentExerciseIds') || [];
      const allExercises = await this.getAllExercises();
      
      return recentIds
        .slice(0, limit)
        .map(id => allExercises.find(ex => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined);
    } catch (error) {
      console.error('Error loading recent exercises:', error);
      return [];
    }
  }

  /**
   * Add exercise to recent list
   */
  static async addToRecent(exerciseId: string): Promise<void> {
    try {
      const recentIds = await StorageManager.getItem<string[]>('recentExerciseIds') || [];
      
      // Remove if already exists
      const filteredIds = recentIds.filter(id => id !== exerciseId);
      
      // Add to beginning
      const updatedIds = [exerciseId, ...filteredIds].slice(0, 20); // Keep max 20
      
      await StorageManager.setItem('recentExerciseIds', updatedIds);
    } catch (error) {
      console.error('Error updating recent exercises:', error);
    }
  }

  /**
   * Get favorite exercises
   */
  static async getFavoriteExercises(): Promise<Exercise[]> {
    try {
      const favoriteIds = await StorageManager.getItem<string[]>('favoriteExerciseIds') || [];
      const allExercises = await this.getAllExercises();
      
      return favoriteIds
        .map(id => allExercises.find(ex => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined);
    } catch (error) {
      console.error('Error loading favorite exercises:', error);
      return [];
    }
  }

  /**
   * Toggle favorite status of exercise
   */
  static async toggleFavorite(exerciseId: string): Promise<boolean> {
    try {
      const favoriteIds = await StorageManager.getItem<string[]>('favoriteExerciseIds') || [];
      const isFavorite = favoriteIds.includes(exerciseId);
      
      let updatedIds: string[];
      if (isFavorite) {
        updatedIds = favoriteIds.filter(id => id !== exerciseId);
      } else {
        updatedIds = [...favoriteIds, exerciseId];
      }
      
      await StorageManager.setItem('favoriteExerciseIds', updatedIds);
      return !isFavorite;
    } catch (error) {
      console.error('Error toggling favorite exercise:', error);
      return false;
    }
  }

  /**
   * Search exercises by name or muscle group
   */
  static async searchExercises(query: string): Promise<Exercise[]> {
    try {
      const allExercises = await this.getAllExercises();
      const searchTerm = query.toLowerCase();
      
      return allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.description.toLowerCase().includes(searchTerm) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchTerm)) ||
        exercise.category.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
  }

  /**
   * Create custom exercise
   */
  static async createCustomExercise(exercise: Omit<Exercise, 'id' | 'isCustom'>): Promise<Exercise> {
    try {
      const customExercise: Exercise = {
        ...exercise,
        id: `custom_${Date.now()}`,
        isCustom: true,
      };
      
      const customExercises = await StorageManager.getItem<Exercise[]>('customExercises') || [];
      const updatedExercises = [...customExercises, customExercise];
      
      await StorageManager.setItem('customExercises', updatedExercises);
      
      // Clear cache to reload with new exercise
      this.exerciseCache = null;
      
      return customExercise;
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      throw error;
    }
  }

  /**
   * Delete custom exercise
   */
  static async deleteCustomExercise(exerciseId: string): Promise<boolean> {
    try {
      const customExercises = await StorageManager.getItem<Exercise[]>('customExercises') || [];
      const updatedExercises = customExercises.filter(ex => ex.id !== exerciseId);
      
      await StorageManager.setItem('customExercises', updatedExercises);
      
      // Clear cache to reload without deleted exercise
      this.exerciseCache = null;
      
      return true;
    } catch (error) {
      console.error('Error deleting custom exercise:', error);
      return false;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.exerciseCache = null;
  }
} 