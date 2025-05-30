import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { WelcomeStep } from './WelcomeStep';
import GoalsSelectionStep from './GoalsSelectionStep';
import { ExperienceLevelStep } from './ExperienceLevelStep';
import { PreferencesStep } from './PreferencesStep';
import { CompletionStep } from './CompletionStep';
import { ProgressIndicator } from './ProgressIndicator';
import { theme } from '../../styles/theme';
import { FitnessGoal, ExperienceLevel } from '../../types';

export interface ProfileSetupData {
  displayName: string;
  fitnessGoals: FitnessGoal[];
  experienceLevel: ExperienceLevel | null;
  preferredUnits: 'metric' | 'imperial';
  workoutFrequency: number | null;
  currentWeight?: number;
  targetWeight?: number;
  hasWorkoutExperience: boolean;
}

interface ProfileSetupFlowProps {
  initialData?: Partial<ProfileSetupData>;
  onComplete?: () => void;
  onSkip?: () => void;
}

const TOTAL_STEPS = 5;

export const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({
  initialData,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<ProfileSetupData>({
    displayName: '',
    fitnessGoals: [],
    experienceLevel: null,
    preferredUnits: 'metric',
    workoutFrequency: null,
    hasWorkoutExperience: false,
    ...initialData,
  });

  const updateSetupData = (updates: Partial<ProfileSetupData>) => {
    setSetupData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      console.log('Profile setup completed');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            displayName={setupData.displayName}
            onNext={(displayName) => {
              updateSetupData({ displayName });
              nextStep();
            }}
            onSkip={onSkip}
          />
        );
      case 2:
        return (
          <GoalsSelectionStep
            selectedGoals={setupData.fitnessGoals}
            onNext={(fitnessGoals) => {
              updateSetupData({ fitnessGoals });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 3:
        return (
          <ExperienceLevelStep
            selectedLevel={setupData.experienceLevel}
            hasWorkoutExperience={setupData.hasWorkoutExperience}
            onNext={(experienceLevel, hasWorkoutExperience) => {
              updateSetupData({ experienceLevel, hasWorkoutExperience });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 4:
        return (
          <PreferencesStep
            preferredUnits={setupData.preferredUnits}
            workoutFrequency={setupData.workoutFrequency}
            currentWeight={setupData.currentWeight}
            targetWeight={setupData.targetWeight}
            onNext={(preferences) => {
              updateSetupData(preferences);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 5:
        return (
          <CompletionStep
            setupData={setupData}
            onComplete={handleComplete}
            onBack={previousStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
        />
        {renderCurrentStep()}
      </View>
    </SafeAreaView>
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
});

export default ProfileSetupFlow; 