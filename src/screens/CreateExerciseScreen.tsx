import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Exercise } from '../types';
import { theme } from '../styles/theme';
import { Button } from '../components/common/Button';
import { HapticService } from '../services/hapticService';
import { ExerciseLibraryService } from '../services/exerciseLibraryService';

interface CreateExerciseScreenProps {
  navigation: any;
  route?: {
    params?: {
      onExerciseCreated?: (exercise: Exercise) => void;
      initialData?: Partial<Exercise>;
    };
  };
}

const CATEGORY_OPTIONS = [
  { key: 'push', label: 'Push', emoji: '🔥', description: 'Chest, shoulders, triceps' },
  { key: 'pull', label: 'Pull', emoji: '💨', description: 'Back, biceps, rear delts' },
  { key: 'legs', label: 'Legs', emoji: '🦵', description: 'Quads, glutes, hamstrings, calves' },
  { key: 'core', label: 'Core', emoji: '⚡', description: 'Abs, obliques, stability' },
  { key: 'cardio', label: 'Cardio', emoji: '❤️', description: 'Cardiovascular exercises' },
];

const DIFFICULTY_OPTIONS = [
  { key: 'beginner', label: 'Beginner', color: '#96CEB4', description: 'Easy to learn and perform' },
  { key: 'intermediate', label: 'Intermediate', color: '#FFEAA7', description: 'Requires some experience' },
  { key: 'advanced', label: 'Advanced', color: '#FF6B6B', description: 'Complex movement patterns' },
];

const MUSCLE_GROUP_OPTIONS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'obliques', 'core', 'quads', 'hamstrings', 'glutes', 
  'calves', 'traps', 'lats', 'rear_delts'
];

const EQUIPMENT_OPTIONS = [
  'bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands',
  'pull_up_bar', 'bench', 'squat_rack', 'cable_machine', 'smith_machine',
  'leg_press_machine', 'lat_pulldown_machine', 'rowing_machine', 'treadmill',
  'elliptical', 'medicine_ball', 'foam_roller', 'suspension_trainer'
];

export const CreateExerciseScreen: React.FC<CreateExerciseScreenProps> = ({ navigation, route }) => {
  const { onExerciseCreated, initialData } = route?.params || {};

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'push',
    difficulty: initialData?.difficulty || 'beginner',
    muscleGroups: initialData?.muscleGroups || [],
    equipment: initialData?.equipment || ['bodyweight'],
    instructions: initialData?.instructions || ['']
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Exercise name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Exercise name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.muscleGroups.length === 0) {
      newErrors.muscleGroups = 'Select at least one muscle group';
    }

    if (formData.equipment.length === 0) {
      newErrors.equipment = 'Select at least one equipment type';
    }

    const validInstructions = formData.instructions.filter(inst => inst.trim().length > 0);
    if (validInstructions.length === 0) {
      newErrors.instructions = 'Add at least one instruction step';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      HapticService.notification('error');
      return;
    }

    setLoading(true);
    try {
      const newExercise: Omit<Exercise, 'id'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category as any,
        difficulty: formData.difficulty as any,
        muscleGroups: formData.muscleGroups,
        equipment: formData.equipment,
        instructions: formData.instructions.filter(inst => inst.trim().length > 0),
        isCustom: true
      };

      const createdExercise = await ExerciseLibraryService.createCustomExercise(newExercise);
      
      HapticService.notification('success');
      
      if (onExerciseCreated) {
        onExerciseCreated(createdExercise);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to create exercise:', error);
      Alert.alert('Error', 'Failed to create exercise. Please try again.');
      HapticService.notification('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMuscleGroup = (muscle: string) => {
    HapticService.selection();
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscle)
        ? prev.muscleGroups.filter(m => m !== muscle)
        : [...prev.muscleGroups, muscle]
    }));
  };

  const toggleEquipment = (equipment: string) => {
    HapticService.selection();
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const addInstructionStep = () => {
    HapticService.light();
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstructionStep = (index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? text : inst)
    }));
  };

  const removeInstructionStep = (index: number) => {
    HapticService.medium();
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category *</Text>
      <View style={styles.optionGrid}>
        {CATEGORY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.categoryOption,
              formData.category === option.key && styles.categoryOptionSelected
            ]}
            onPress={() => {
              HapticService.selection();
              setFormData(prev => ({ ...prev, category: option.key }));
            }}
          >
            <Text style={styles.categoryEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.categoryLabel,
              formData.category === option.key && styles.categoryLabelSelected
            ]}>
              {option.label}
            </Text>
            <Text style={styles.categoryDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDifficultySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Difficulty Level *</Text>
      <View style={styles.difficultyGrid}>
        {DIFFICULTY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.difficultyOption,
              {
                borderColor: option.color,
                backgroundColor: formData.difficulty === option.key ? option.color + '20' : 'transparent'
              }
            ]}
            onPress={() => {
              HapticService.selection();
              setFormData(prev => ({ ...prev, difficulty: option.key }));
            }}
          >
            <Text style={[
              styles.difficultyLabel,
              { color: formData.difficulty === option.key ? option.color : theme.colors.textPrimary }
            ]}>
              {option.label}
            </Text>
            <Text style={styles.difficultyDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMuscleGroupSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Target Muscle Groups *</Text>
      {errors.muscleGroups && <Text style={styles.errorText}>{errors.muscleGroups}</Text>}
      <View style={styles.tagGrid}>
        {MUSCLE_GROUP_OPTIONS.map((muscle) => (
          <TouchableOpacity
            key={muscle}
            style={[
              styles.muscleTag,
              formData.muscleGroups.includes(muscle) && styles.muscleTagSelected
            ]}
            onPress={() => toggleMuscleGroup(muscle)}
          >
            <Text style={[
              styles.muscleTagText,
              formData.muscleGroups.includes(muscle) && styles.muscleTagTextSelected
            ]}>
              {muscle.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEquipmentSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Equipment Needed *</Text>
      {errors.equipment && <Text style={styles.errorText}>{errors.equipment}</Text>}
      <View style={styles.tagGrid}>
        {EQUIPMENT_OPTIONS.map((equipment) => (
          <TouchableOpacity
            key={equipment}
            style={[
              styles.equipmentTag,
              formData.equipment.includes(equipment) && styles.equipmentTagSelected
            ]}
            onPress={() => toggleEquipment(equipment)}
          >
            <Text style={[
              styles.equipmentTagText,
              formData.equipment.includes(equipment) && styles.equipmentTagTextSelected
            ]}>
              {equipment.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInstructionsEditor = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Instructions *</Text>
      {errors.instructions && <Text style={styles.errorText}>{errors.instructions}</Text>}
      
      {formData.instructions.map((instruction, index) => (
        <View key={index} style={styles.instructionItem}>
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionNumber}>Step {index + 1}</Text>
            {formData.instructions.length > 1 && (
              <TouchableOpacity
                onPress={() => removeInstructionStep(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            style={styles.instructionInput}
            value={instruction}
            onChangeText={(text) => updateInstructionStep(index, text)}
            placeholder={`Describe step ${index + 1}...`}
            multiline
            textAlignVertical="top"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      ))}

      <TouchableOpacity onPress={addInstructionStep} style={styles.addStepButton}>
        <Text style={styles.addStepButtonText}>+ Add Step</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Custom Exercise</Text>
          <Text style={styles.subtitle}>Design your own exercise for the library</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Name *</Text>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Single-Arm Dumbbell Row"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          <TextInput
            style={[styles.textAreaInput, errors.description && styles.textInputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe what this exercise targets and how it's beneficial..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Category Selection */}
        {renderCategorySelector()}

        {/* Difficulty Selection */}
        {renderDifficultySelector()}

        {/* Muscle Groups */}
        {renderMuscleGroupSelector()}

        {/* Equipment */}
        {renderEquipmentSelector()}

        {/* Instructions */}
        {renderInstructionsEditor()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Button
          title="Create Exercise"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textAreaInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
  },
  textInputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  optionGrid: {
    gap: theme.spacing.md,
  },
  categoryOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  categoryLabelSelected: {
    color: theme.colors.primary,
  },
  categoryDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  difficultyGrid: {
    gap: theme.spacing.md,
  },
  difficultyOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  difficultyDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  muscleTag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  muscleTagSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  muscleTagText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  muscleTagTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  equipmentTag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  equipmentTagSelected: {
    backgroundColor: theme.colors.secondary + '20',
    borderColor: theme.colors.secondary,
  },
  equipmentTagText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  equipmentTagTextSelected: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  instructionItem: {
    marginBottom: theme.spacing.lg,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  removeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  removeButtonText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  instructionInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 60,
  },
  addStepButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addStepButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  saveButton: {
    flex: 2,
  },
});

export default CreateExerciseScreen; 