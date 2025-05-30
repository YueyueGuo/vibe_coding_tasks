import { useEffect } from 'react';
import { useAppDispatch } from '../stores/store';
import { recoverActiveSession } from '../stores/workoutSessionStore';

export const useWorkoutSessionPersistence = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Recover any active session on app launch
    dispatch(recoverActiveSession());
  }, [dispatch]);

  // Auto-save interval (every 30 seconds)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Auto-save is now handled in reducers, but we could add
      // additional backup logic here if needed
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, []);
}; 