import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { WorkoutExercise } from '../../types/workout';
import { SetLoggingCard } from './SetLoggingCard';

interface ExerciseListProps {
  exercises: WorkoutExercise[];
  onSetCompleted?: (exerciseId: string, setId: string) => void;
  onStartRestTimer?: (duration: number, exerciseId?: string) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ 
  exercises,
  onSetCompleted,
  onStartRestTimer,
}) => {
  if (exercises.length === 0) {
    return null;
  }

  const handleSetCompleted = (exerciseId: string) => (setId: string) => {
    onSetCompleted?.(exerciseId, setId);
  };

  const handleStartRestTimer = (exerciseId: string) => (duration: number) => {
    onStartRestTimer?.(duration, exerciseId);
  };

  return (
    <View style={styles.container}>
      {exercises.map((exercise) => (
        <SetLoggingCard
          key={exercise.id}
          exercise={exercise}
          onSetCompleted={handleSetCompleted(exercise.id)}
          onStartRestTimer={handleStartRestTimer(exercise.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
}); 