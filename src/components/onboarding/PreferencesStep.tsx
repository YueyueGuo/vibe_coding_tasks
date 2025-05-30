import React from 'react';
import { View, Text } from 'react-native';

interface PreferencesStepProps {
  preferredUnits: 'metric' | 'imperial';
  workoutFrequency: number | null;
  currentWeight?: number;
  targetWeight?: number;
  onNext: (preferences: any) => void;
  onBack: () => void;
}

export const PreferencesStep: React.FC<PreferencesStepProps> = () => {
  return (
    <View>
      <Text>Preferences Step - Coming Soon</Text>
    </View>
  );
}; 