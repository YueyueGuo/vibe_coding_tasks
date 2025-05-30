import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { WorkoutExercise, WorkoutSet } from '../../types/workout';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';
import { useDispatch } from 'react-redux';
import { updateSet, addSetToExercise, deleteSet, completeSet } from '../../stores/workoutSessionStore';
import { WorkoutHistoryService } from '../../services/workoutHistoryService';
import { ExerciseHistoryDisplay } from './ExerciseHistoryDisplay';
import { SetTypeSelector } from './SetTypeSelector';

interface SetLoggingCardProps {
  exercise: WorkoutExercise;
  onSetCompleted?: (setId: string) => void;
  onStartRestTimer?: (duration: number) => void;
}

interface SetRowProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseId: string;
  onSetUpdate: (setId: string, updates: Partial<WorkoutSet>) => void;
  onSetComplete: (setId: string) => void;
  onSetDelete: (setId: string) => void;
  previousSets?: WorkoutSet[];
}

type SetType = 'working' | 'warmup' | 'dropset' | 'failure';

const SetRow: React.FC<SetRowProps> = ({
  set,
  setNumber,
  exerciseId,
  onSetUpdate,
  onSetComplete,
  onSetDelete,
  previousSets = [],
}) => {
  const [localWeight, setLocalWeight] = useState(set.weight?.toString() || '');
  const [localReps, setLocalReps] = useState(set.reps?.toString() || '');
  const [localRPE, setLocalRPE] = useState(set.rpe?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  const animatedValue = useRef(new Animated.Value(set.completed ? 1 : 0)).current;

  // Get suggested values from previous workout
  const previousSet = previousSets[setNumber - 1];
  const suggestedWeight = previousSet?.weight || (setNumber > 1 ? set.weight : undefined);
  const suggestedReps = previousSet?.reps || (setNumber > 1 ? set.reps : undefined);

  // Check if set is ready to be completed
  const isCompletable = Boolean(
    localWeight && 
    localReps && 
    !isNaN(parseFloat(localWeight)) && 
    !isNaN(parseInt(localReps, 10)) &&
    parseFloat(localWeight) > 0 &&
    parseInt(localReps, 10) > 0
  );

  const handleWeightChange = (value: string) => {
    setLocalWeight(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onSetUpdate(set.id, { weight: numValue });
    }
  };

  const handleRepsChange = (value: string) => {
    setLocalReps(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onSetUpdate(set.id, { reps: numValue });
    }
  };

  const handleRPEChange = (value: string) => {
    setLocalRPE(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      onSetUpdate(set.id, { rpe: numValue });
    }
  };

  const handleCompleteSet = () => {
    if (!isCompletable && !set.completed) return;

    if (set.completed) {
      // If already completed, enter edit mode
      setIsEditing(true);
      HapticService.selection();
    } else {
      // Complete the set
      HapticService.impact('medium');
      onSetComplete(set.id);

      // Animate completion
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    HapticService.impact('light');
  };

  const handleQuickAdjust = (field: 'weight' | 'reps', increment: number) => {
    if (field === 'weight') {
      const currentWeight = parseFloat(localWeight) || 0;
      const newWeight = Math.max(0, currentWeight + increment);
      setLocalWeight(newWeight.toString());
      onSetUpdate(set.id, { weight: newWeight });
    } else {
      const currentReps = parseInt(localReps, 10) || 0;
      const newReps = Math.max(0, currentReps + increment);
      setLocalReps(newReps.toString());
      onSetUpdate(set.id, { reps: newReps });
    }
    HapticService.selection();
  };

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface, theme.colors.success + '20'],
  });

  // Update checkbox display logic
  const getCheckboxContent = () => {
    if (set.completed && !isEditing) return "✅";  // Green checkmark when completed
    if (set.completed && isEditing) return "💾";   // Save icon when editing completed set
    if (isCompletable) return "☐";                // Gray checkbox when ready
    return "";                                     // Nothing when disabled
  };

  const getCheckboxStyle = () => {
    if (set.completed && !isEditing) return styles.completedCheckbox;
    if (set.completed && isEditing) return styles.editingCheckbox;
    if (isCompletable) return styles.readyCheckbox;
    return styles.disabledCheckbox;
  };

  // Determine if inputs should be editable
  const isInputEditable = !set.completed || isEditing;

  // Simplified set type styling
  const getSetTypeStyle = () => {
    switch (set.type) {
      case 'warmup':
        return { color: theme.colors.warning, backgroundColor: theme.colors.warning + '20' };
      case 'failure':
        return { color: theme.colors.error, backgroundColor: theme.colors.error + '20' };
      case 'dropset':
        return { color: theme.colors.secondary, backgroundColor: theme.colors.secondary + '20' };
      default:
        return { color: theme.colors.primary, backgroundColor: 'transparent' };
    }
  };

  const getSetTypeAbbr = () => {
    switch (set.type) {
      case 'warmup': return 'W';
      case 'failure': return 'F';
      case 'dropset': return 'D';
      default: return '';
    }
  };

  return (
    <Animated.View style={[styles.setRow, { backgroundColor: animatedBackgroundColor }]}>
      {/* Set Number & Type */}
      <View style={styles.setNumberContainer}>
        <Text style={styles.setNumber}>{setNumber}</Text>
        {set.type !== 'working' && (
          <Text style={getSetTypeStyle()}>
            {getSetTypeAbbr()}
          </Text>
        )}
        {set.isPersonalRecord && (
          <Text style={styles.prBadge}>PR</Text>
        )}
      </View>

      {/* Previous Set Reference */}
      {previousSet && (
        <View style={styles.previousSetContainer}>
          <Text style={styles.previousSetText}>
            {previousSet.weight}×{previousSet.reps}
          </Text>
        </View>
      )}

      {/* Weight Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={[styles.adjustButton, !isInputEditable && styles.disabledButton]}
            onPress={() => isInputEditable && handleQuickAdjust('weight', -5)}
            disabled={!isInputEditable}
          >
            <Text style={styles.adjustButtonText}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, !isInputEditable && styles.disabledInput]}
            value={localWeight}
            onChangeText={isInputEditable ? handleWeightChange : undefined}
            placeholder={suggestedWeight?.toString() || '0'}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            maxLength={4}
            editable={isInputEditable}
          />
          <TouchableOpacity
            style={[styles.adjustButton, !isInputEditable && styles.disabledButton]}
            onPress={() => isInputEditable && handleQuickAdjust('weight', 5)}
            disabled={!isInputEditable}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inputLabel}>lbs</Text>
      </View>

      {/* Reps Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={[styles.adjustButton, !isInputEditable && styles.disabledButton]}
            onPress={() => isInputEditable && handleQuickAdjust('reps', -1)}
            disabled={!isInputEditable}
          >
            <Text style={styles.adjustButtonText}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, !isInputEditable && styles.disabledInput]}
            value={localReps}
            onChangeText={isInputEditable ? handleRepsChange : undefined}
            placeholder={suggestedReps?.toString() || '0'}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            maxLength={3}
            editable={isInputEditable}
          />
          <TouchableOpacity
            style={[styles.adjustButton, !isInputEditable && styles.disabledButton]}
            onPress={() => isInputEditable && handleQuickAdjust('reps', 1)}
            disabled={!isInputEditable}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inputLabel}>reps</Text>
      </View>

      {/* RPE Input */}
      <View style={styles.rpeContainer}>
        <TextInput
          style={[styles.rpeInput, !isInputEditable && styles.disabledInput]}
          value={localRPE}
          onChangeText={isInputEditable ? handleRPEChange : undefined}
          placeholder="RPE"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={2}
          editable={isInputEditable}
        />
      </View>

      {/* Complete/Edit/Delete Actions */}
      <View style={styles.actionsContainer}>
        {/* Checkbox/Save button */}
        <TouchableOpacity
          style={styles.checkboxButton}
          onPress={set.completed && isEditing ? handleSaveEdit : handleCompleteSet}
          disabled={!isCompletable && !set.completed}
        >
          <Text style={getCheckboxStyle()}>
            {getCheckboxContent()}
          </Text>
        </TouchableOpacity>
        
        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onSetDelete(set.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const SetLoggingCard: React.FC<SetLoggingCardProps> = ({
  exercise,
  onSetCompleted,
  onStartRestTimer,
}) => {
  const dispatch = useDispatch();
  const [showHistory, setShowHistory] = useState(false);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);

  // Load previous workout data
  useEffect(() => {
    loadPreviousWorkoutData();
  }, [exercise.exerciseId]);

  const loadPreviousWorkoutData = async () => {
    try {
      const lastWorkoutSets = await WorkoutHistoryService.getLastWorkout(exercise.exerciseId);
      setPreviousSets(lastWorkoutSets || []);
    } catch (error) {
      console.error('Error loading previous workout data:', error);
    }
  };

  const handleSetUpdate = (setId: string, updates: Partial<WorkoutSet>) => {
    dispatch(updateSet({ exerciseId: exercise.id, setId, updates }));
  };

  const handleSetComplete = (setId: string) => {
    dispatch(completeSet({ exerciseId: exercise.id, setId }));
    onSetCompleted?.(setId);
    
    // Auto-start rest timer if configured
    if (exercise.targetRestTime) {
      onStartRestTimer?.(exercise.targetRestTime);
    }
  };

  const handleSetDelete = (setId: string) => {
    Alert.alert(
      'Delete Set',
      'Are you sure you want to delete this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteSet({ exerciseId: exercise.id, setId }));
            HapticService.impact('light');
          },
        },
      ]
    );
  };

  const handleAddSetWithType = async (setType: SetType = 'working') => {
    // Get suggested values for the new set
    const suggestedValues = await WorkoutHistoryService.getSuggestedSetValues(
      exercise.exerciseId,
      exercise.sets.length + 1
    );

    const newSet: Omit<WorkoutSet, 'id'> = {
      setNumber: exercise.sets.length + 1,
      type: setType,
      completed: false,
      reps: undefined,
      weight: undefined,
      // Don't pre-fill weight for warmup sets
      ...(setType === 'warmup' ? {} : suggestedValues),
    };
    
    dispatch(addSetToExercise({ exerciseId: exercise.id, set: newSet }));
    HapticService.selection();
  };

  if (showHistory) {
    return (
      <ExerciseHistoryDisplay
        exerciseId={exercise.exerciseId}
        onClose={() => setShowHistory(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Exercise Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <View style={styles.muscleGroups}>
            {exercise.muscleGroups.slice(0, 2).map((muscle, index) => (
              <Text key={muscle} style={styles.muscleGroup}>
                {muscle}
              </Text>
            ))}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {previousSets.length > 0 && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.historyButtonText}>📊</Text>
              <Text style={styles.historyButtonLabel}>History</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Previous Workout Summary */}
      {previousSets.length > 0 && (
        <View style={styles.previousWorkoutSummary}>
          <Text style={styles.previousWorkoutTitle}>Last Workout:</Text>
          <Text style={styles.previousWorkoutText}>
            {previousSets.length} sets • Best: {Math.max(...previousSets.map(s => s.weight || 0))} lbs × {Math.max(...previousSets.map(s => s.reps || 0))} reps
          </Text>
        </View>
      )}

      {/* Set Headers */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>Set</Text>
        <Text style={styles.headerLabel}>Previous</Text>
        <Text style={styles.headerLabel}>Weight</Text>
        <Text style={styles.headerLabel}>Reps</Text>
        <Text style={styles.headerLabel}>RPE</Text>
        <Text style={styles.headerLabel}>✓</Text>
      </View>

      {/* Set Rows */}
      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.id}
          set={set}
          setNumber={index + 1}
          exerciseId={exercise.id}
          onSetUpdate={handleSetUpdate}
          onSetComplete={handleSetComplete}
          onSetDelete={handleSetDelete}
          previousSets={previousSets}
        />
      ))}

      {/* Simplified Add Set Buttons */}
      <View style={styles.addSetContainer}>
        <TouchableOpacity 
          style={styles.addSetButton} 
          onPress={() => handleAddSetWithType('working')}
        >
          <Text style={styles.addSetButtonText}>+ Add Set</Text>
        </TouchableOpacity>
        
        <View style={styles.quickAddButtons}>
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => handleAddSetWithType('warmup')}
          >
            <Text style={styles.quickAddEmoji}>🔥</Text>
            <Text style={styles.quickAddText}>Warmup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => handleAddSetWithType('failure')}
          >
            <Text style={styles.quickAddEmoji}>⚡</Text>
            <Text style={styles.quickAddText}>Failure</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => handleAddSetWithType('dropset')}
          >
            <Text style={styles.quickAddEmoji}>📉</Text>
            <Text style={styles.quickAddText}>Drop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise Notes */}
      {exercise.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{exercise.notes}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  muscleGroups: {
    flexDirection: 'row',
    gap: 8,
  },
  muscleGroup: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  setNumberContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  setType: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  prBadge: {
    fontSize: 8,
    fontWeight: '600',
    color: theme.colors.warning,
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  previousSetContainer: {
    flex: 1,
    alignItems: 'center',
  },
  previousSetText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  adjustButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  input: {
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  inputLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rpeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rpeInput: {
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkboxButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyCheckbox: {
    fontSize: 20,
    color: theme.colors.textSecondary,  // Gray checkbox outline
  },
  completedCheckbox: {
    fontSize: 20,
    color: theme.colors.success,        // Green checkmark
  },
  editingCheckbox: {
    fontSize: 20,
    color: theme.colors.warning,           // Orange save icon when editing
  },
  disabledCheckbox: {
    fontSize: 20,
    color: 'transparent',               // Hidden when disabled
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledInput: {
    opacity: 0.7,
    backgroundColor: theme.colors.surface,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addSetButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAddEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  quickAddText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  historyButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyButtonText: {
    fontSize: 16,
    marginBottom: 2,
  },
  historyButtonLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  previousWorkoutSummary: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  previousWorkoutTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  previousWorkoutText: {
    fontSize: 14,
    color: theme.colors.text,
  },
}); 