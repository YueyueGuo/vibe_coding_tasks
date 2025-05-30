import React from 'react';
import { View, Text } from 'react-native';

interface ExperienceLevelStepProps {
  selectedLevel: any;
  hasWorkoutExperience: boolean;
  onNext: (level: any, hasExperience: boolean) => void;
  onBack: () => void;
}

export const ExperienceLevelStep: React.FC<ExperienceLevelStepProps> = () => {
  return (
    <View>
      <Text>Experience Level Step - Coming Soon</Text>
    </View>
  );
}; 