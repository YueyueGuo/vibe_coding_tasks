import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { theme } from '../../styles/theme';
import { FitnessGoal } from '../../types';

interface GoalsSelectionStepProps {
  selectedGoals: FitnessGoal[];
  onNext: (goals: FitnessGoal[]) => void;
  onBack: () => void;
}

const GOALS: Array<{
  id: FitnessGoal;
  title: string;
  description: string;
  emoji: string;
}> = [
  {
    id: 'strength',
    title: 'Build Strength',
    description: 'Get stronger and lift heavier weights',
    emoji: '🏋️',
  },
  {
    id: 'muscle_gain',
    title: 'Gain Muscle',
    description: 'Increase muscle mass and size',
    emoji: '💪',
  },
  {
    id: 'weight_loss',
    title: 'Lose Weight',
    description: 'Burn fat and improve body composition',
    emoji: '🔥',
  },
  {
    id: 'endurance',
    title: 'Build Endurance',
    description: 'Improve cardiovascular fitness and stamina',
    emoji: '🏃',
  },
  {
    id: 'general_fitness',
    title: 'General Fitness',
    description: 'Stay active and maintain overall health',
    emoji: '⚡',
  },
];

export const GoalsSelectionStep: React.FC<GoalsSelectionStepProps> = ({
  selectedGoals,
  onNext,
  onBack,
}) => {
  const [goals, setGoals] = useState<FitnessGoal[]>(selectedGoals);

  const toggleGoal = (goalId: FitnessGoal) => {
    setGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  const handleNext = () => {
    onNext(goals);
  };

  const isValid = goals.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>What are your fitness goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply. We'll personalize your experience based on your goals.
          </Text>
        </View>

        <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
          {GOALS.map((goal) => {
            const isSelected = goals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.goalContent}>
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <View style={styles.goalText}>
                    <Text style={[
                      styles.goalTitle,
                      isSelected && styles.goalTitleSelected,
                    ]}>
                      {goal.title}
                    </Text>
                    <Text style={[
                      styles.goalDescription,
                      isSelected && styles.goalDescriptionSelected,
                    ]}>
                      {goal.description}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>
            Continue ({goals.length} selected)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  goalsContainer: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  goalCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  goalTitleSelected: {
    color: theme.colors.primary,
  },
  goalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  goalDescriptionSelected: {
    color: theme.colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    paddingTop: theme.spacing.lg,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});

export default GoalsSelectionStep;