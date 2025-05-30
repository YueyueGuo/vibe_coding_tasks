import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Exercise, ExerciseCategory, MuscleGroup } from '../../types';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';
import { CreateExerciseModal } from './CreateExerciseModal';

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  exercises: Exercise[];
  recentExercises?: Exercise[];
}

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  visible,
  onClose,
  onSelectExercise,
  exercises,
  recentExercises = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all' | 'recent'>('all');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>(exercises);

  const categories: Array<{ key: ExerciseCategory | 'all' | 'recent'; label: string; emoji: string }> = [
    { key: 'all', label: 'All', emoji: '🏋️' },
    { key: 'recent', label: 'Recent', emoji: '🕒' },
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
    { key: 'hamstrings', label: 'Hams', emoji: '🔙' },
    { key: 'glutes', label: 'Glutes', emoji: '🍑' },
    { key: 'calves', label: 'Calves', emoji: '🦵' },
    { key: 'forearms', label: 'Forearms', emoji: '🤚' },
  ];

  // Update exercises when new custom exercise is created
  const handleExerciseCreated = (newExercise: Exercise) => {
    setAllExercises(prev => [...prev, newExercise]);
    // Automatically select the newly created exercise
    onSelectExercise(newExercise);
    onClose();
  };

  // Enhanced filter logic with search functionality (update to use allExercises)
  const filteredExercises = useMemo(() => {
    let filtered = allExercises;

    // Filter by category first
    if (selectedCategory === 'recent') {
      filtered = recentExercises;
    } else if (selectedCategory !== 'all') {
      filtered = allExercises.filter(exercise => exercise.category === selectedCategory);
    }

    // Filter by muscle groups
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter(exercise =>
        selectedMuscleGroups.some(muscleGroup =>
          exercise.muscleGroups.includes(muscleGroup)
        )
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(exercise => {
        // Search in exercise name
        const nameMatch = exercise.name.toLowerCase().includes(query);
        
        // Search in description
        const descriptionMatch = exercise.description?.toLowerCase().includes(query);
        
        // Search in muscle groups
        const muscleMatch = exercise.muscleGroups.some(muscle =>
          muscle.toLowerCase().includes(query)
        );
        
        // Search in equipment (if available)
        const equipmentMatch = exercise.equipment?.some(eq =>
          eq.toLowerCase().includes(query)
        );

        // Search in instructions (if available)
        const instructionMatch = exercise.instructions?.some(instruction =>
          instruction.toLowerCase().includes(query)
        );

        return nameMatch || descriptionMatch || muscleMatch || equipmentMatch || instructionMatch;
      });
    }

    return filtered;
  }, [allExercises, recentExercises, selectedCategory, selectedMuscleGroups, searchQuery]);

  const handleCategorySelect = (category: ExerciseCategory | 'all' | 'recent') => {
    setSelectedCategory(category);
    setSelectedMuscleGroups([]);
    // Don't clear search when changing category to allow cross-category search
    HapticService.selection();
  };

  const handleMuscleGroupToggle = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroups(prev => {
      const isSelected = prev.includes(muscleGroup);
      HapticService.selection();
      
      if (isSelected) {
        return prev.filter(mg => mg !== muscleGroup);
      } else {
        return [...prev, muscleGroup];
      }
    });
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    HapticService.impact('medium');
    onSelectExercise(exercise);
    onClose();
  };

  const handleClearAllFilters = () => {
    setSelectedMuscleGroups([]);
    setSearchQuery('');
    HapticService.selection();
  };

  const renderCategoryChip = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.key && styles.categoryChipSelected,
      ]}
      onPress={() => handleCategorySelect(item.key)}
    >
      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.key && styles.categoryTextSelected,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMuscleGroupChip = ({ item }: { item: typeof muscleGroups[0] }) => {
    const isSelected = selectedMuscleGroups.includes(item.key);
    
    return (
      <TouchableOpacity
        style={[
          styles.muscleChip,
          isSelected && styles.muscleChipSelected,
        ]}
        onPress={() => handleMuscleGroupToggle(item.key)}
      >
        <Text style={styles.muscleEmoji}>{item.emoji}</Text>
        <Text
          style={[
            styles.muscleText,
            isSelected && styles.muscleTextSelected,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleExerciseSelect(item)}
    >
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {categories.find(cat => cat.key === item.category)?.emoji}
          </Text>
        </View>
      </View>
      
      <Text style={styles.exerciseDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.muscleGroupTags}>
        {item.muscleGroups.slice(0, 3).map((muscle, index) => (
          <View key={muscle} style={styles.muscleTag}>
            <Text style={styles.muscleTagText}>
              {muscleGroups.find(mg => mg.key === muscle)?.label || muscle}
            </Text>
          </View>
        ))}
        {item.muscleGroups.length > 3 && (
          <View style={styles.muscleTag}>
            <Text style={styles.muscleTagText}>+{item.muscleGroups.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Exercise</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(true)} 
              style={styles.createButton}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filters */}
          <View style={styles.filtersSection}>
            <Text style={styles.filterLabel}>Categories</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              renderItem={renderCategoryChip}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.categoryList}
            />
          </View>

          {/* Muscle Group Filters */}
          {selectedCategory !== 'recent' && (
            <View style={styles.filtersSection}>
              <Text style={styles.filterLabel}>Muscle Groups</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={muscleGroups}
                renderItem={renderMuscleGroupChip}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.muscleList}
              />
            </View>
          )}

          {/* Results Count */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
            </Text>
            {(selectedMuscleGroups.length > 0 || searchQuery.trim()) && (
              <TouchableOpacity
                onPress={handleClearAllFilters}
                style={styles.clearFiltersButton}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            style={styles.exerciseList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🔍</Text>
                <Text style={styles.emptyStateTitle}>No exercises found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery.trim() 
                    ? `No exercises match "${searchQuery}"`
                    : selectedMuscleGroups.length > 0
                      ? `Try removing some muscle group filters`
                      : `No exercises available for this category`
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.createFromEmptyButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={styles.createFromEmptyButtonText}>+ Create Custom Exercise</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Create Exercise Modal */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onExerciseCreated={handleExerciseCreated}
      />
    </>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  filtersSection: {
    paddingTop: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 20,
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
    marginRight: 8,
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
  muscleList: {
    paddingHorizontal: 20,
    gap: 6,
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
    marginRight: 6,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  exerciseList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
  },
  exerciseDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  muscleGroupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleTagText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  createFromEmptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createFromEmptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    textAlign: 'center',
  },
}); 