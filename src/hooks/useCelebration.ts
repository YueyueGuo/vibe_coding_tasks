import { useCallback } from 'react';
import { AnimationService } from '../services/animationService';

export const useCelebration = () => {
  const triggerWorkoutCompletion = useCallback(async ({ 
    duration, 
    totalSets 
  }: { 
    duration: number;
    totalSets: number;
  }) => {
    await AnimationService.celebrate('setComplete', 'Workout Complete!', `${totalSets} sets • ${duration}min`);
  }, []);

  const triggerPersonalRecord = useCallback(async ({ 
    exercise, 
    newRecord 
  }: { 
    exercise: string;
    newRecord: number;
  }) => {
    await AnimationService.celebrate('personalRecord', 'New PR!', `${exercise}: ${newRecord}`);
  }, []);

  const addCelebrationListener = useCallback(() => {
    // Implement if needed
  }, []);

  return { triggerWorkoutCompletion, triggerPersonalRecord, addCelebrationListener };
};