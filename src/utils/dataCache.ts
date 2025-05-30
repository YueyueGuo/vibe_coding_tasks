import { workoutStorage } from './storage';
import { Workout, Exercise, PersonalRecord, WorkoutTemplate } from '@/types';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items to cache
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache<T> {
  private cache: Map<string, CachedItem<T>> = new Map();
  private config: CacheConfig;
  private storageKey: string;

  constructor(config: CacheConfig, storageKey: string) {
    this.config = config;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const cachedData = await workoutStorage.getItem<Record<string, CachedItem<T>>>(this.storageKey);
      if (cachedData) {
        this.cache = new Map(Object.entries(cachedData));
        this.cleanExpiredItems();
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await workoutStorage.setItem(this.storageKey, cacheObject);
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  private cleanExpiredItems(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private enforceMaxSize(): void {
    if (this.cache.size > this.config.maxSize) {
      // Remove oldest items first
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const itemsToRemove = sortedEntries.slice(0, this.cache.size - this.config.maxSize);
      itemsToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  async set(key: string, data: T, customTtl?: number): Promise<void> {
    const ttl = customTtl || this.config.ttl;
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, item);
    this.enforceMaxSize();
    await this.saveToStorage();
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.saveToStorage(); // Don't await to avoid blocking
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveToStorage();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.saveToStorage();
  }

  getSize(): number {
    this.cleanExpiredItems();
    return this.cache.size;
  }

  getAllKeys(): string[] {
    this.cleanExpiredItems();
    return Array.from(this.cache.keys());
  }
}

// Create cache instances for different data types
export const workoutCache = new DataCache<Workout[]>({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
}, 'workout_cache');

export const exerciseCache = new DataCache<Exercise[]>({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSize: 50,
}, 'exercise_cache');

export const personalRecordsCache = new DataCache<PersonalRecord[]>({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 20,
}, 'pr_cache');

export const templateCache = new DataCache<WorkoutTemplate[]>({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 30,
}, 'template_cache');

export default DataCache; 