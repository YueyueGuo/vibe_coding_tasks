import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Exercise } from '../types';
import { ExerciseLibraryService } from '../services/exerciseLibraryService';
import { theme } from '../styles/theme';
import { HapticService } from '../services/hapticService';
import { exerciseFuzzySearch } from '../utils/fuzzySearch';
import SmartSearchBar from '../components/common/SmartSearchBar';

interface ExerciseBrowserScreenProps {
  navigation: any;
  route?: {
    params?: {
      onSelectExercise?: (exercise: Exercise) => void;
      mode?: 'browse' | 'select';
    };
  };
}

type CategoryFilter = 'all' | 'push' | 'pull' | 'legs' | 'core' | 'cardio';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type EquipmentFilter = 'all' | 'bodyweight' | 'dumbbells' | 'barbell' | 'machine';

const CATEGORY_OPTIONS = [
  { key: 'all' as CategoryFilter, label: 'All', emoji: '💪', color: theme.colors.primary },
  { key: 'push' as CategoryFilter, label: 'Push', emoji: '🔥', color: '#FF6B6B' },
  { key: 'pull' as CategoryFilter, label: 'Pull', emoji: '💨', color: '#4ECDC4' },
  { key: 'legs' as CategoryFilter, label: 'Legs', emoji: '🦵', color: '#45B7D1' },
  { key: 'core' as CategoryFilter, label: 'Core', emoji: '⚡', color: '#96CEB4' },
  { key: 'cardio' as CategoryFilter, label: 'Cardio', emoji: '❤️', color: '#FFEAA7' },
];

const DIFFICULTY_OPTIONS = [
  { key: 'all' as DifficultyFilter, label: 'All Levels', color: theme.colors.textSecondary },
  { key: 'beginner' as DifficultyFilter, label: 'Beginner', color: '#96CEB4' },
  { key: 'intermediate' as DifficultyFilter, label: 'Intermediate', color: '#FFEAA7' },
  { key: 'advanced' as DifficultyFilter, label: 'Advanced', color: '#FF6B6B' },
];

const { width } = Dimensions.get('window');

export const ExerciseBrowserScreen: React.FC<ExerciseBrowserScreenProps> = ({ navigation, route }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [loading, setLoading] = useState(true);

  const { onSelectExercise, mode = 'browse' } = route?.params || {};

  // Load exercises on component mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const allExercises = await ExerciseLibraryService.getAllExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    let results = exercises;

    // Apply fuzzy search if query exists
    if (searchQuery.trim()) {
      const fuzzyResults = exerciseFuzzySearch.searchWithAbbreviations(exercises, searchQuery);
      results = fuzzyResults.map(result => result.item);
    }

    // Apply other filters
    return results.filter(exercise => {
      // Category filter
      if (categoryFilter !== 'all' && exercise.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      //if (difficultyFilter !== 'all' && exercise.difficulty !== difficultyFilter) {
      
      //return false;
      //}

      // Equipment filter
      //if (equipmentFilter !== 'all') {
        //if (equipmentFilter === 'bodyweight') {
          //if (!exercise.equipment.includes('bodyweight')) return false;
        //} else {
          //if (!exercise.equipment.includes(equipmentFilter)) return false;
        //}
      //}

      return true;
    });
  }, [exercises, searchQuery, categoryFilter, difficultyFilter, equipmentFilter]);

  const handleExercisePress = (exercise: Exercise) => {
    HapticService.selection();
    
    if (mode === 'select' && onSelectExercise) {
      onSelectExercise(exercise);
      navigation.goBack();
    } else {
      navigation.navigate('ExerciseDetail', { exercise });
    }
  };

  const handleCategoryPress = (category: CategoryFilter) => {
    HapticService.impact('light');
    setCategoryFilter(category);
  };

  const handleDifficultyPress = (difficulty: DifficultyFilter) => {
    HapticService.impact('light');
    setDifficultyFilter(difficulty);
  };

  const clearFilters = () => {
    HapticService.impact('medium');
    setSearchQuery('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setEquipmentFilter('all');
  };

  const renderCategoryChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.chipContainer}
      contentContainerStyle={styles.chipContent}
    >
      {CATEGORY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => handleCategoryPress(option.key)}
          style={[
            styles.categoryChip,
            {
              backgroundColor: categoryFilter === option.key ? option.color : theme.colors.surface,
              borderColor: option.color,
            }
          ]}
        >
          <Text style={styles.categoryEmoji}>{option.emoji}</Text>
          <Text style={[
            styles.categoryLabel,
            {
              color: categoryFilter === option.key ? theme.colors.white : option.color,
              fontWeight: categoryFilter === option.key ? '600' : '500',
            }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDifficultyChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.chipContainer}
      contentContainerStyle={styles.chipContent}
    >
      {DIFFICULTY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => handleDifficultyPress(option.key)}
          style={[
            styles.difficultyChip,
            {
              backgroundColor: difficultyFilter === option.key ? option.color : theme.colors.surface,
              borderColor: option.color,
            }
          ]}
        >
          <Text style={[
            styles.difficultyLabel,
            {
              color: difficultyFilter === option.key ? theme.colors.white : option.color,
              fontWeight: difficultyFilter === option.key ? '600' : '500',
            }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExerciseCard = ({ item: exercise }: { item: Exercise }) => {
    const categoryOption = CATEGORY_OPTIONS.find(opt => opt.key === exercise.category);
    //const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.key === exercise.difficulty);

    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => handleExercisePress(exercise)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseDescription} numberOfLines={2}>
              {exercise.description}
            </Text>
          </View>
          
          <View style={styles.exerciseBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryOption?.color }]}>
              <Text style={styles.categoryBadgeText}>{categoryOption?.emoji}</Text>
            </View>
          </View>
        </View>

        <View style={styles.exerciseDetails}>
          <View style={styles.muscleGroups}>
            {exercise.muscleGroups.slice(0, 3).map((muscle, index) => (
              <View key={index} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{muscle}</Text>
              </View>
            ))}
            {exercise.muscleGroups.length > 3 && (
              <View style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>+{exercise.muscleGroups.length - 3}</Text>
              </View>
            )}
          </View>

          <View style={styles.exerciseMetadata}>
            {/*<View style={[styles.difficultyBadge, { backgroundColor: difficultyOption?.color + '20' }]}>
              <Text style={[styles.difficultyBadgeText, { color: difficultyOption?.color }]}>
                {exercise.difficulty}
              </Text>*/}
            {/*</View>*/}
            
            {/*<Text style={styles.equipmentText}>
              {exercise.equipment.includes('bodyweight') ? '💪 Bodyweight' : `🏋️ ${exercise.equipment[0]}`}
            </Text>*/}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        {mode === 'select' ? 'Select Exercise' : 'Exercise Library'}
      </Text>
      <Text style={styles.subtitle}>
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <SmartSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={(query) => {
          // Trigger haptic feedback for search
          HapticService.impact('medium');
        }}
        placeholder="Search exercises, muscles, equipment..."
      />
      
      {(searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
        <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {renderCategoryChips()}
        
        <Text style={styles.sectionTitle}>Difficulty</Text>
        {renderDifficultyChips()}

        <View style={styles.exerciseListContainer}>
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exerciseList}
            scrollEnabled={false} // Let parent ScrollView handle scrolling
          />
        </View>

        {filteredExercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No exercises found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters or search terms
            </Text>
            <TouchableOpacity onPress={clearFilters} style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clearButton: {
    marginLeft: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  clearButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  chipContainer: {
    paddingLeft: theme.spacing.lg,
  },
  chipContent: {
    paddingRight: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseListContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  exerciseList: {
    paddingBottom: theme.spacing.xl,
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  exerciseDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  exerciseBadges: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  muscleTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  muscleTagText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  exerciseMetadata: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  equipmentText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyStateButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  clearFiltersButton: {
    marginLeft: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  clearFiltersText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ExerciseBrowserScreen; 