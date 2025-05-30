import { Workout, WorkoutExercise, PersonalRecord } from '@/types';
import { workoutStorage, offlineStorage } from './storage';

export interface OfflineAction {
  id: string;
  type: 'CREATE_WORKOUT' | 'UPDATE_WORKOUT' | 'DELETE_WORKOUT' | 'CREATE_EXERCISE' | 'UPDATE_PR';
  data: any;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: Date | null;
  pendingActions: number;
  syncInProgress: boolean;
}

class OfflineSyncManager {
  private syncQueue: OfflineAction[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private lastSyncAt: Date | null = null;

  constructor() {
    this.loadSyncQueue();
  }

  // Connectivity management
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;
    
    if (wasOffline && isOnline) {
      // Coming back online, trigger sync
      this.syncPendingActions();
    }
  }

  // Queue management
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await offlineStorage.getItem<OfflineAction[]>('syncQueue');
      this.syncQueue = queue || [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await offlineStorage.setItem('syncQueue', this.syncQueue);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private generateActionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Offline action queueing
  async queueAction(
    type: OfflineAction['type'],
    data: any,
    maxAttempts: number = 3
  ): Promise<string> {
    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts,
    };

    this.syncQueue.push(action);
    await this.saveSyncQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return action.id;
  }

  // Sync operations
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToSync = [...this.syncQueue];
      
      for (const action of actionsToSync) {
        try {
          await this.executeAction(action);
          // Remove successful action from queue
          this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          
          // Increment attempt count
          const actionIndex = this.syncQueue.findIndex(a => a.id === action.id);
          if (actionIndex !== -1) {
            this.syncQueue[actionIndex].attempts++;
            
            // Remove if max attempts exceeded
            if (this.syncQueue[actionIndex].attempts >= action.maxAttempts) {
              console.warn(`Removing action ${action.id} after ${action.maxAttempts} failed attempts`);
              this.syncQueue.splice(actionIndex, 1);
            }
          }
        }
      }

      await this.saveSyncQueue();
      this.lastSyncAt = new Date();
      
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // This will be implemented when we create the workout service
    console.log(`Executing action: ${action.type}`, action.data);
    // Placeholder - will integrate with actual API calls later
  }

  // Status getters
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSyncAt: this.lastSyncAt,
      pendingActions: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
    };
  }

  // Manual sync trigger
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingActions();
    }
  }

  // Clear all pending actions (use with caution)
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }
}

export const offlineSyncManager = new OfflineSyncManager();
export default OfflineSyncManager; 