import { useEffect, useState } from 'react';
import { offlineSyncManager, SyncStatus } from '@/utils/offlineSync';

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => 
    offlineSyncManager.getSyncStatus()
  );
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate network connectivity changes
    // In a real app, you'd use @react-native-community/netinfo
    const handleOnlineChange = (online: boolean) => {
      setIsOnline(online);
      offlineSyncManager.setOnlineStatus(online);
    };

    // For now, assume we're online
    handleOnlineChange(true);

    // You would integrate with NetInfo here:
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   handleOnlineChange(state.isConnected);
    // });
    // return unsubscribe;
  }, []);

  const forceSync = async () => {
    await offlineSyncManager.forceSync();
    setSyncStatus(offlineSyncManager.getSyncStatus());
  };

  const clearQueue = async () => {
    await offlineSyncManager.clearSyncQueue();
    setSyncStatus(offlineSyncManager.getSyncStatus());
  };

  return {
    isOnline,
    syncStatus,
    forceSync,
    clearQueue,
  };
}; 