import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../stores/store';
import { 
  pauseWorkoutSession, 
  resumeWorkoutSession,
  selectCurrentSession,
  selectTimer,
  startRestTimer,
  stopRestTimer,
  updateRestTimer,
} from '../../stores/workoutSessionStore';
import { WorkoutSession } from '../../types/workout';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';

interface WorkoutHeaderProps {
  session: WorkoutSession;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ session }) => {
  const dispatch = useAppDispatch();
  const timer = useAppSelector(selectTimer);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [restTimerInterval, setRestTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);

  // Update workout duration every second (only when not paused)
  useEffect(() => {
    if (session.status === 'paused') {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      let totalPausedTime = 0;
      
      // Calculate paused time if currently paused
      if (pausedAt) {
        totalPausedTime = now.getTime() - pausedAt.getTime();
      }
      
      const diffMs = now.getTime() - session.startTime.getTime() - totalPausedTime;
      setWorkoutDuration(Math.floor(diffMs / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startTime, session.status, pausedAt]);

  // Handle session status changes
  useEffect(() => {
    if (session.status === 'paused') {
      setPausedAt(new Date());
      // Pause rest timer as well
      if (timer.isActive) {
        dispatch(stopRestTimer());
      }
    } else if (session.status === 'active') {
      setPausedAt(null);
    }
  }, [session.status, timer.isActive, dispatch]);

  // Handle rest timer countdown
  useEffect(() => {
    if (timer.isActive && timer.remainingTime > 0) {
      const interval = setInterval(() => {
        dispatch(updateRestTimer(timer.remainingTime - 1));
        
        // Haptic feedback for last 10 seconds
        if (timer.remainingTime <= 10 && timer.remainingTime > 0) {
          HapticService.impact('light');
        }
        
        // Strong haptic when timer reaches 0
        if (timer.remainingTime === 1) {
          HapticService.impact('heavy');
          HapticService.notification('success');
        }
      }, 1000);
      
      setRestTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (restTimerInterval) {
        clearInterval(restTimerInterval);
        setRestTimerInterval(null);
      }
    }
  }, [timer.isActive, timer.remainingTime, dispatch]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    HapticService.impact('medium');
    
    try {
      if (session.status === 'paused') {
        await dispatch(resumeWorkoutSession()).unwrap();
        // Show resume confirmation
        Alert.alert(
          'Workout Resumed',
          'Welcome back! Your workout has been resumed.',
          [{ text: 'OK' }]
        );
      } else {
        // Confirm pause if workout has been active for a while
        const workoutDurationMinutes = Math.floor(workoutDuration / 60);
        
        if (workoutDurationMinutes > 5) {
          Alert.alert(
            'Pause Workout?',
            'Your workout will be paused and you can resume it later.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Pause', 
                onPress: async () => {
                  await dispatch(pauseWorkoutSession()).unwrap();
                }
              }
            ]
          );
        } else {
          await dispatch(pauseWorkoutSession()).unwrap();
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to pause/resume workout. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestTimerPress = () => {
    if (timer.isActive) {
      // Stop current timer
      dispatch(stopRestTimer());
      HapticService.impact('light');
    } else {
      // Show rest timer options
      showRestTimerOptions();
    }
  };

  const showRestTimerOptions = () => {
    const options = [
      { title: '30 seconds', value: 30 },
      { title: '1 minute', value: 60 },
      { title: '90 seconds', value: 90 },
      { title: '2 minutes', value: 120 },
      { title: '3 minutes', value: 180 },
      { title: '5 minutes', value: 300 },
    ];

    Alert.alert(
      'Start Rest Timer',
      'How long do you want to rest?',
      [
        ...options.map(option => ({
          text: option.title,
          onPress: () => {
            dispatch(startRestTimer({ duration: option.value }));
            HapticService.impact('medium');
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getCompletedSets = () => {
    return session.exercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.completed).length, 0
    );
  };

  const getTotalSets = () => {
    return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.workoutTitle} numberOfLines={1}>
          {session.name || 'Workout in Progress'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.workoutMeta}>
            {formatDuration(workoutDuration)}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.workoutMeta}>
            {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
          </Text>
          {getTotalSets() > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.workoutMeta}>
                {getCompletedSets()}/{getTotalSets()} sets
              </Text>
            </>
          )}
        </View>
        {session.status === 'paused' && (
          <View style={styles.pausedIndicatorContainer}>
            <Text style={styles.pausedIndicator}>⏸️ Workout Paused</Text>
            <Text style={styles.pausedSubtext}>Tap play to resume</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[
            styles.pauseButton, 
            session.status === 'paused' && styles.resumeButton
          ]}
          onPress={handlePauseResume}
        >
          <Text style={[
            styles.controlButtonText,
            session.status === 'paused' && styles.resumeButtonText
          ]}>
            {session.status === 'paused' ? '▶️' : '⏸️'}
          </Text>
        </TouchableOpacity>
        
        {/* Rest timer - disabled when workout is paused */}
        <TouchableOpacity 
          style={[
            styles.timerButton,
            timer.isActive && styles.activeTimerButton,
            timer.isActive && timer.remainingTime <= 10 && styles.urgentTimerButton,
            session.status === 'paused' && styles.disabledButton
          ]}
          onPress={session.status === 'paused' ? undefined : handleRestTimerPress}
          disabled={session.status === 'paused'}
        >
          {timer.isActive ? (
            <Text style={styles.activeTimerText}>
              {formatRestTime(timer.remainingTime)}
            </Text>
          ) : (
            <Text style={[
              styles.timerButtonText,
              session.status === 'paused' && styles.disabledText
            ]}>
              Rest Timer
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workoutMeta: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: 6,
  },
  pausedIndicatorContainer: {
    marginTop: 8,
  },
  pausedIndicator: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  pausedSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pauseButton: {
    backgroundColor: theme.colors.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resumeButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  resumeButtonText: {
    color: theme.colors.background,
  },
  controlButtonText: {
    fontSize: 18,
  },
  timerButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  activeTimerButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  urgentTimerButton: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  timerButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeTimerText: {
    fontSize: 14,
    color: theme.colors.background,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.textTertiary,
  },
}); 