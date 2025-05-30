import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WorkoutSet } from '../../types/workout';
import { theme } from '../../styles/theme';
import { WorkoutHistoryService, ExerciseHistory } from '../../services/workoutHistoryService';

interface ExerciseHistoryDisplayProps {
  exerciseId: string;
  onClose: () => void;
}

export const ExerciseHistoryDisplay: React.FC<ExerciseHistoryDisplayProps> = ({
  exerciseId,
  onClose,
}) => {
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [exerciseId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const exerciseHistory = await WorkoutHistoryService.getExerciseHistory(exerciseId, 5);
      setHistory(exerciseHistory);
    } catch (error) {
      console.error('Error loading exercise history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatWeight = (weight: number) => {
    return `${weight} lbs`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Exercise History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  if (!history || history.previousWorkouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Exercise History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No Previous Data</Text>
          <Text style={styles.emptyText}>
            Complete this exercise in a workout to start tracking your progress!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{history.exerciseName}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {history.previousWorkouts.map((workout, index) => (
          <View key={workout.sessionId} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
              <Text style={styles.workoutStats}>
                {workout.sets.length} sets • {formatWeight(workout.totalVolume)} volume
              </Text>
            </View>

            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={styles.setsHeaderText}>Set</Text>
                <Text style={styles.setsHeaderText}>Weight</Text>
                <Text style={styles.setsHeaderText}>Reps</Text>
                <Text style={styles.setsHeaderText}>RPE</Text>
              </View>

              {workout.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setNumber}>{set.setNumber}</Text>
                  <Text style={styles.setValue}>{formatWeight(set.weight || 0)}</Text>
                  <Text style={styles.setValue}>{set.reps || 0}</Text>
                  <Text style={styles.setValue}>{set.rpe || '-'}</Text>
                </View>
              ))}
            </View>

            <View style={styles.workoutSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Max Weight</Text>
                <Text style={styles.summaryValue}>{formatWeight(workout.maxWeight)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Max Reps</Text>
                <Text style={styles.summaryValue}>{workout.maxReps}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Volume</Text>
                <Text style={styles.summaryValue}>{formatWeight(workout.totalVolume)}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.progressTip}>
          <Text style={styles.progressTipTitle}>💡 Progress Tip</Text>
          <Text style={styles.progressTipText}>
            Try to gradually increase weight, reps, or total volume from your last workout to continue making progress!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  workoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  workoutStats: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  setsContainer: {
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 8,
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  setNumber: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  setValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  workoutSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressTip: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  progressTipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  progressTipText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
}); 