import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  TextInput,
  Dimensions,
} from 'react-native';
import { useAppDispatch } from '../../stores/store';
import { completeWorkoutSession } from '../../stores/workoutSessionStore';
import { WorkoutSession } from '../../types/workout';
import { theme } from '../../styles/theme';
import { Button } from '../common/Button';
import { useCelebration } from '../../hooks/useCelebration';
import WorkoutStatsService, { WorkoutStats } from '../../services/workoutStatsService';
import { ExerciseLibraryService } from '../../services/exerciseLibraryService';

interface WorkoutSummaryScreenProps {
  route: {
    params: {
      session: WorkoutSession;
    };
  };
  navigation: any;
}

const { width } = Dimensions.get('window');

export const WorkoutSummaryScreen: React.FC<WorkoutSummaryScreenProps> = ({ route, navigation }) => {
  const { session } = route.params;
  const dispatch = useAppDispatch();
  const { triggerWorkoutCompletion, triggerPersonalRecord, addCelebrationListener } = useCelebration();

  const [showCelebration, setShowCelebration] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState(session.notes || '');
  const [workoutRating, setWorkoutRating] = useState<number | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate comprehensive workout statistics
  useEffect(() => {
    const calculateStats = async () => {
      try {
        // In a real app, we'd fetch previous workouts from storage/API
        const previousWorkouts: WorkoutSession[] = []; // TODO: Implement history fetching
        const stats = WorkoutStatsService.calculateWorkoutStats(session, previousWorkouts);
        setWorkoutStats(stats);

        // Trigger celebration if there are achievements
        if (stats.newPersonalRecords.length > 0) {
          setTimeout(() => setShowCelebration(true), 500);
        }
      } catch (error) {
        console.error('Failed to calculate workout stats:', error);
      }
    };

    calculateStats();
  }, [session]);

  const handleCompleteWorkout = useCallback(async () => {
    if (!workoutStats) return;

    setIsLoading(true);
    try {
      const result = await dispatch(completeWorkoutSession({ finalNotes: summaryNotes })).unwrap();

      // Trigger workout completion celebration
      await triggerWorkoutCompletion({
        duration: workoutStats.duration,
        totalSets: workoutStats.completedSets
      });

      // Trigger PR celebrations
      for (const pr of workoutStats.newPersonalRecords) {
        await triggerPersonalRecord({
          exercise: pr.exercise,
          newRecord: pr.newValue
        });
      }

      navigation.navigate('WorkoutHistory');
    } catch (error) {
      console.error('Failed to complete workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [workoutStats, summaryNotes, dispatch, navigation, triggerWorkoutCompletion, triggerPersonalRecord]);

  const handleDiscardWorkout = () => {
    Alert.alert(
      'Discard Workout?',
      'Are you sure you want to discard this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleShareWorkout = async () => {
    if (!workoutStats) return;

    const shareText = WorkoutStatsService.generateWorkoutSummary(workoutStats);
    
    try {
      await Share.share({
        message: shareText,
        title: 'My Workout Summary',
      });
    } catch (error) {
      console.log('Share failed:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setWorkoutRating(i)}
          style={styles.starButton}
        >
          <Text style={[
            styles.star,
            i <= (workoutRating || 0) && styles.starSelected
          ]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderStatsGrid = () => {
    if (!workoutStats) return null;

    const stats = [
      { label: 'Duration', value: formatDuration(workoutStats.duration), icon: '⏱️' },
      { label: 'Sets', value: `${workoutStats.completedSets}/${workoutStats.totalSets}`, icon: '🏋️' },
      { label: 'Volume', value: `${Math.round(workoutStats.totalVolume).toLocaleString()} lbs`, icon: '📊' },
      { label: 'Exercises', value: workoutStats.exerciseCount.toString(), icon: '💪' },
      { label: 'Avg RPE', value: workoutStats.averageRPE > 0 ? `${workoutStats.averageRPE}/10` : 'N/A', icon: '🔥' },
      { label: 'Muscle Groups', value: workoutStats.muscleGroupsWorked.length.toString(), icon: '🎯' },
    ];

    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPersonalRecords = () => {
    if (!workoutStats || workoutStats.newPersonalRecords.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 New Personal Records!</Text>
        {workoutStats.newPersonalRecords.map((pr: any, index: any) => (
          <View key={index} style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prExercise}>{pr.exercise}</Text>
              <Text style={styles.prBadge}>{pr.type.toUpperCase()}</Text>
            </View>
            <Text style={styles.prValue}>
              {pr.previousValue} → {pr.newValue} (+{pr.improvement})
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderImprovements = () => {
    if (!workoutStats || workoutStats.improvements.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Improvements</Text>
        {workoutStats.improvements.map((improvement: any, index: any) => (
          <View key={index} style={styles.improvementCard}>
            <Text style={styles.improvementExercise}>{improvement.exercise}</Text>
            <Text style={styles.improvementText}>
              {improvement.type}: +{improvement.improvement} (+{improvement.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!workoutStats) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Calculating workout stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎉 Workout Complete!</Text>
          <Text style={styles.subtitle}>
            {session.name || 'Your workout'} • {formatDuration(workoutStats.duration)}
          </Text>
        </View>

        {/* Stats Grid */}
        {renderStatsGrid()}

        {/* Personal Records */}
        {renderPersonalRecords()}

        {/* Improvements */}
        {renderImprovements()}

        {/* Workout Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Workout</Text>
          <View style={styles.ratingContainer}>
            {renderStarRating()}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={summaryNotes}
            onChangeText={setSummaryNotes}
            placeholder="How did the workout feel? Any notes for next time?"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Share Workout"
            onPress={handleShareWorkout}
            variant="outline"
            style={styles.shareButton}
          />
          
          <Button
            title="Complete Workout"
            onPress={handleCompleteWorkout}
            loading={isLoading}
            style={styles.completeButton}
          />
        </View>

        <TouchableOpacity onPress={handleDiscardWorkout} style={styles.discardButton}>
          <Text style={styles.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  prCard: {
    backgroundColor: theme.colors.success + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  prExercise: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  prBadge: {
    backgroundColor: theme.colors.success,
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  prValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  improvementCard: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  improvementExercise: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  improvementText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: theme.spacing.sm,
  },
  star: {
    fontSize: 32,
    opacity: 0.3,
  },
  starSelected: {
    opacity: 1,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  shareButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
  discardButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  discardText: {
    fontSize: 16,
    color: theme.colors.error,
    fontWeight: '500',
  },
});

export default WorkoutSummaryScreen; 