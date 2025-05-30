import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Exercise, ExerciseCategory, MuscleGroup } from '../../types';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';
import { ExerciseLibraryService } from '../../services/exerciseLibraryService';

interface CreateExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  visible,
  onClose,
  onExerciseCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'push' as ExerciseCategory,
    muscleGroups: [] as MuscleGroup[],
    equipment: [] as string[],
    instructions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const categories: Array<{ key: ExerciseCategory; label: string; emoji: string }> = [
    { key: 'push', label: 'Push', emoji: '💪' },
    { key: 'pull', label: 'Pull', emoji: '🔄' },
    { key: 'legs', label: 'Legs', emoji: '🦵' },
    { key: 'cardio', label: 'Cardio', emoji: '❤️' },
    { key: 'flexibility', label: 'Flex', emoji: '🤸' },
  ];

  const muscleGroups: Array<{ key: MuscleGroup; label: string; emoji: string }> = [
    { key: 'chest', label: 'Chest', emoji: '💪' },
    { key: 'back', label: 'Back', emoji: '🔙' },
    { key: 'shoulders', label: 'Shoulders', emoji: '👐' },
    { key: 'biceps', label: 'Biceps', emoji: '💪' },
    { key: 'triceps', label: 'Triceps', emoji: '🤏' },
    { key: 'abs', label: 'Abs', emoji: '🎯' },
    { key: 'quads', label: 'Quads', emoji: '🦵' },
    { key: 'hamstrings', label: 'Hamstrings', emoji: '🔙' },
    { key: 'glutes', label: 'Glutes', emoji: '🍑' },
    { key: 'calves', label: 'Calves', emoji: '🦵' },
    { key: 'forearms', label: 'Forearms', emoji: '🤚' },
  ];

  const handleMuscleGroupToggle = (muscleGroup: MuscleGroup) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscleGroup)
        ? prev.muscleGroups.filter(mg => mg !== muscleGroup)
        : [...prev.muscleGroups, muscleGroup]
    }));
    HapticService.selection();
  };

  const handleCategorySelect = (category: ExerciseCategory) => {
    setFormData(prev => ({ ...prev, category }));
    HapticService.selection();
  };

  const handleCreateExercise = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Exercise name is required');
      return;
    }

    if (formData.muscleGroups.length === 0) {
      Alert.alert('Error', 'Please select at least one muscle group');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Exercise description is required');
      return;
    }

    setLoading(true);
    try {
      const newExercise = await ExerciseLibraryService.createCustomExercise({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        muscleGroups: formData.muscleGroups,
        equipment: formData.equipment.filter(eq => eq.trim()),
        instructions: formData.instructions.filter(inst => inst.trim()),
      });

      HapticService.impact('medium');
      onExerciseCreated(newExercise);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create exercise. Please try again.');
      console.error('Error creating exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: 'push',
      muscleGroups: [],
      equipment: [],
      instructions: [],
    });
    onClose();
  };

  const renderCategoryChip = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.key}
      style={[
        styles.categoryChip,
        formData.category === category.key && styles.categoryChipSelected,
      ]}
      onPress={() => handleCategorySelect(category.key)}
    >
      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      <Text
        style={[
          styles.categoryText,
          formData.category === category.key && styles.categoryTextSelected,
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMuscleGroupChip = (muscleGroup: typeof muscleGroups[0]) => {
    const isSelected = formData.muscleGroups.includes(muscleGroup.key);
    
    return (
      <TouchableOpacity
        key={muscleGroup.key}
        style={[
          styles.muscleChip,
          isSelected && styles.muscleChipSelected,
        ]}
        onPress={() => handleMuscleGroupToggle(muscleGroup.key)}
      >
        <Text style={styles.muscleEmoji}>{muscleGroup.emoji}</Text>
        <Text
          style={[
            styles.muscleText,
            isSelected && styles.muscleTextSelected,
          ]}
        >
          {muscleGroup.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Exercise</Text>
          <TouchableOpacity 
            onPress={handleCreateExercise} 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <Text style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Exercise Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Bulgarian Split Squats"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              autoCapitalize="words"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder="Brief description of the exercise..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {categories.map(renderCategoryChip)}
            </ScrollView>
          </View>

          {/* Muscle Groups */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Muscle Groups * ({formData.muscleGroups.length} selected)
            </Text>
            <View style={styles.muscleGroupGrid}>
              {muscleGroups.map(renderMuscleGroupChip)}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  saveButtonTextDisabled: {
    color: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInputMultiline: {
    height: 80,
    paddingTop: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: theme.colors.white,
  },
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  muscleChipSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  muscleEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  muscleText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  muscleTextSelected: {
    color: theme.colors.white,
  },
}); 