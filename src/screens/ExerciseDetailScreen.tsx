import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { Exercise } from '../types';
import { theme } from '../styles/theme';
import { Button } from '../components/common/Button';
import { HapticService } from '../services/hapticService';

interface ExerciseDetailScreenProps {
  route: {
    params: {
      exercise: Exercise;
      onSelectExercise?: (exercise: Exercise) => void;
    };
  };
  navigation: any;
}

export const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ route, navigation }) => {
  const { exercise, onSelectExercise } = route.params;
  const [showAllInstructions, setShowAllInstructions] = useState(false);

  const handleSelectExercise = () => {
    HapticService.medium();
    if (onSelectExercise) {
      onSelectExercise(exercise);
      navigation.goBack();
    }
  };

  const handleShareExercise = async () => {
    const shareText = `Check out this exercise: ${exercise.name}\n\n${exercise.description}\n\nMuscle Groups: ${exercise.muscleGroups.join(', ')}`;
    
    try {
      await Share.share({
        message: shareText,
        title: exercise.name,
      });
    } catch (error) {
      console.log('Share failed:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#96CEB4';
      case 'intermediate': return '#FFEAA7';
      case 'advanced': return '#FF6B6B';
      default: return theme.colors.textSecondary;
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'push': return '🔥';
      case 'pull': return '💨';
      case 'legs': return '🦵';
      case 'core': return '⚡';
      case 'cardio': return '❤️';
      default: return '💪';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(exercise.category)}</Text>
            <Text style={styles.title}>{exercise.name}</Text>
          </View>
          
          <View style={styles.badges}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                {exercise.difficulty}
              </Text>
            </View>
            
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{exercise.category}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>{exercise.description}</Text>
        </View>

        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <View style={styles.muscleContainer}>
            {exercise.muscleGroups.map((muscle, index) => (
              <View key={index} style={styles.muscleChip}>
                <Text style={styles.muscleText}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Needed</Text>
          <View style={styles.equipmentContainer}>
            {exercise.equipment.map((item, index) => (
              <View key={index} style={styles.equipmentChip}>
                <Text style={styles.equipmentText}>
                  {item === 'bodyweight' ? '💪 Bodyweight' : `🏋️ ${item.replace('_', ' ')}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.sectionTitle}>How to Perform</Text>
            {exercise.instructions.length > 4 && (
              <TouchableOpacity 
                onPress={() => setShowAllInstructions(!showAllInstructions)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {showAllInstructions ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.instructionsList}>
            {(showAllInstructions ? exercise.instructions : exercise.instructions.slice(0, 4))
              .map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipText}>• Focus on proper form over heavy weight</Text>
            <Text style={styles.tipText}>• Control the movement throughout the full range of motion</Text>
            <Text style={styles.tipText}>• Breathe steadily - don't hold your breath</Text>
            {exercise.difficulty === 'beginner' && (
              <Text style={styles.tipText}>• Start with bodyweight or light weights to master the movement</Text>
            )}
            {exercise.difficulty === 'advanced' && (
              <Text style={styles.tipText}>• Ensure you have mastered the basic movement before attempting</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handleShareExercise} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        
        {onSelectExercise && (
          <Button
            title="Add to Workout"
            onPress={handleSelectExercise}
            style={styles.selectButton}
          />
        )}
      </View>
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
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'capitalize',
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
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  muscleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  muscleChip: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  muscleText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  equipmentContainer: {
    gap: theme.spacing.sm,
  },
  equipmentChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  equipmentText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  toggleText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  instructionsList: {
    gap: theme.spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  instructionText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
  tipsContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
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
  shareButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  selectButton: {
    flex: 2,
  },
});

export default ExerciseDetailScreen; 