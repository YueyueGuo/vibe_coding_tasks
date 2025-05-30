import { WorkoutSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageConfig {
  keyPrefix: string;
  encryptionKey?: string;
}

class StorageManager {
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }
  static setItem<T>(key: string, value: T): Promise<void> {
      throw new Error('Method not implemented.');
  }
  static removeItem(arg0: string) {
      throw new Error('Method not implemented.');
  }
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}_${key}`;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.getKey(key));
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(this.config.keyPrefix))
        .map(key => key.replace(`${this.config.keyPrefix}_`, ''));
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const results = await AsyncStorage.multiGet(prefixedKeys);
      
      const data: Record<string, T | null> = {};
      results.forEach(([key, value], index) => {
        const originalKey = keys[index];
        data[originalKey] = value ? JSON.parse(value) : null;
      });
      
      return data;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return {};
    }
  }

  async multiSet<T>(items: Record<string, T>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(([key, value]) => [
        this.getKey(key),
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  }
}

// Create storage instances for different data types
export const userStorage = new StorageManager({ keyPrefix: 'WT_USER' });
export const workoutStorage = new StorageManager({ keyPrefix: 'WT_WORKOUT' });
export const settingsStorage = new StorageManager({ keyPrefix: 'WT_SETTINGS' });
export const offlineStorage = new StorageManager({ keyPrefix: 'WT_OFFLINE' });

export default StorageManager; 