import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { WorkoutSession } from '../../types/workout';
import { Exercise } from '../../types';
import { theme } from '../../styles/theme';
import { Button } from '../common/Button';
import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseList } from './ExerciseList';
import { WorkoutNotes } from './WorkoutNotes';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { ExerciseLibraryService } from '../../services/exerciseLibraryService';
import { useAppDispatch } from '../../stores/store';
import { addExerciseToSession, startRestTimer } from '../../stores/workoutSessionStore';
import { checkSetPersonalRecord } from '../../stores/workoutSessionStore';
import { HapticService } from '../../services/hapticService';

interface ActiveWorkoutInterfaceProps {
  session: WorkoutSession;
}

export const ActiveWorkoutInterface: React.FC<ActiveWorkoutInterfaceProps> = ({ session }) => {
  const dispatch = useAppDispatch();
  const isPaused = session.status === 'paused';
  
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Load exercises when modal opens
  useEffect(() => {
    if (showExerciseModal && exercises.length === 0) {
      loadExercises();
    }
  }, [showExerciseModal]);

  const loadExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const [allExercises, recent] = await Promise.all([
        ExerciseLibraryService.getAllExercises(),
        ExerciseLibraryService.getRecentExercises(10),
      ]);
      
      setExercises(allExercises);
      setRecentExercises(recent);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleAddExercise = () => {
    if (isPaused) return;
    setShowExerciseModal(true);
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    try {
      // Add to recent exercises
      await ExerciseLibraryService.addToRecent(exercise.id);
      
      // Add to workout session
      dispatch(addExerciseToSession({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroups: exercise.muscleGroups,
        sets: [],
        notes: '',
      }));
      
      setShowExerciseModal(false);
    } catch (error) {
      console.error('Error adding exercise to session:', error);
    }
  };

  const handleSaveWorkout = () => {
    console.log('Save workout pressed');
  };

  const handleSetCompleted = (exerciseId: string, setId: string) => {
    // Check for personal records and trigger celebrations
    dispatch(checkSetPersonalRecord({ exerciseId, setId }));
    HapticService.impact('medium');
  };

  const handleStartRestTimer = (duration: number, exerciseId?: string) => {
    dispatch(startRestTimer({ duration, exerciseId }));
    HapticService.impact('light');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <WorkoutHeader session={session} />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isPaused} // Disable scrolling when paused
      >
        {/* Paused Overlay */}
        {isPaused && (
          <View style={styles.pausedOverlay}>
            <Text style={styles.pausedTitle}>Workout Paused</Text>
            <Text style={styles.pausedMessage}>
              Your workout is paused. Tap the play button in the header to resume.
            </Text>
          </View>
        )}

        {/* Add Exercise Button */}
        <Button
          title="+ Add Exercise"
          onPress={handleAddExercise}
          variant="secondary"
          style={StyleSheet.flatten([styles.addExerciseButton, isPaused && styles.disabledButton])}
          disabled={isPaused}
        />

        {/* Exercise List with Set Logging */}
        <View style={styles.exerciseListContainer}>
          <ExerciseList 
            exercises={session.exercises}
            onSetCompleted={handleSetCompleted}
            onStartRestTimer={handleStartRestTimer}
          />
        </View>

        {/* Workout Notes */}
        <WorkoutNotes 
          sessionId={session.id} 
          notes={session.notes || ''} 
          disabled={isPaused}
        />

        {/* Save Workout Button */}
        <Button
          title="💾 SAVE WORKOUT"
          onPress={handleSaveWorkout}
          variant="primary"
          style={styles.saveButton}
        />
      </ScrollView>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelectExercise={handleSelectExercise}
        exercises={exercises}
        recentExercises={recentExercises}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pausedOverlay: {
    backgroundColor: theme.colors.warning + '20', // 20% opacity
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    alignItems: 'center',
  },
  pausedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: 8,
  },
  pausedMessage: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  addExerciseButton: {
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledContent: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyStateHint: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveButton: {
    marginBottom: 40,
    marginTop: 20,
  },
  exerciseListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
}); 