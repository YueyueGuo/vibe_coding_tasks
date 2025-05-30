import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { theme } from '../../styles/theme';
import Button from '../common/Button';
import TextInput from '../common/TextInput';
import { useAppDispatch } from '../../hooks/redux';
import { updateUserProfile } from '../../stores/userStore';
import { supabase } from '../../config/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
};

export type FitnessGoal = 'strength' | 'muscle_gain' | 'weight_loss' | 'endurance' | 'general_fitness';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<FitnessGoal | null>(null);
  const [workoutFrequency, setWorkoutFrequency] = useState<number | null>(null);
  const [preferredUnits, setPreferredUnits] = useState<'metric' | 'imperial'>('imperial');

  const experienceLevels = [
    { key: 'beginner', label: 'Beginner', desc: 'New to weightlifting (0-6 months)' },
    { key: 'intermediate', label: 'Intermediate', desc: 'Some experience (6 months - 2 years)' },
    { key: 'advanced', label: 'Advanced', desc: 'Experienced lifter (2+ years)' },
    { key: 'expert', label: 'Expert', desc: 'Competitive level (5+ years)' },
  ];

  const fitnessGoals = [
    { key: 'strength', label: 'Build Strength', desc: 'Increase my max lifts and power', icon: '💪' },
    { key: 'muscle_gain', label: 'Build Muscle', desc: 'Gain muscle mass and size', icon: '🏋️' },
    { key: 'weight_loss', label: 'Lose Weight', desc: 'Burn calories and lose fat', icon: '🔥' },
    { key: 'endurance', label: 'Build Endurance', desc: 'Improve stamina and conditioning', icon: '⚡' },
    { key: 'general_fitness', label: 'General Fitness', desc: 'Overall health and wellness', icon: '🌟' },
  ];

  const frequencies = [2, 3, 4, 5, 6, 7];

  const handleComplete = async () => {
    if (!displayName || !experienceLevel || !primaryGoal || !workoutFrequency) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_units: preferredUnits,
          updated_at: new Date().toISOString(),
        });

      if (preferencesError) throw preferencesError;

      // Store additional profile data in Redux
      dispatch(updateUserProfile({
        displayName,
        experienceLevel,
        primaryGoal,
        workoutFrequency,
        preferredUnits,
        isProfileComplete: true,
      }));

      // Navigate to main app - the AppNavigator will handle this
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Let's get to know you!</Text>
      <Text style={styles.stepSubtitle}>What should we call you?</Text>
      
      <TextInput
        placeholder="Your name"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        autoCapitalize="words"
      />

      <View style={styles.unitsSelector}>
        <Text style={styles.sectionLabel}>Preferred Units</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[
              styles.unitOption,
              preferredUnits === 'imperial' && styles.selectedOption,
            ]}
            onPress={() => setPreferredUnits('imperial')}
          >
            <Text style={[
              styles.optionText,
              preferredUnits === 'imperial' && styles.selectedOptionText,
            ]}>
              Imperial (lbs)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.unitOption,
              preferredUnits === 'metric' && styles.selectedOption,
            ]}
            onPress={() => setPreferredUnits('metric')}
          >
            <Text style={[
              styles.optionText,
              preferredUnits === 'metric' && styles.selectedOptionText,
            ]}>
              Metric (kg)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title="Continue"
        onPress={() => setStep(2)}
        disabled={!displayName.trim()}
        style={styles.continueButton}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your experience level?</Text>
      <Text style={styles.stepSubtitle}>This helps us tailor your experience</Text>

      <View style={styles.optionsList}>
        {experienceLevels.map((level) => (
          <TouchableOpacity
            key={level.key}
            style={[
              styles.option,
              experienceLevel === level.key && styles.selectedOption,
            ]}
            onPress={() => setExperienceLevel(level.key as ExperienceLevel)}
          >
            <Text style={[
              styles.optionTitle,
              experienceLevel === level.key && styles.selectedOptionText,
            ]}>
              {level.label}
            </Text>
            <Text style={[
              styles.optionDesc,
              experienceLevel === level.key && styles.selectedOptionText,
            ]}>
              {level.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <Button
          title="Back"
          onPress={() => setStep(1)}
          variant="secondary"
          style={styles.backButton}
        />
        <Button
          title="Continue"
          onPress={() => setStep(3)}
          disabled={!experienceLevel}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your primary goal?</Text>
      <Text style={styles.stepSubtitle}>Choose what matters most to you right now</Text>

      <View style={styles.optionsList}>
        {fitnessGoals.map((goal) => (
          <TouchableOpacity
            key={goal.key}
            style={[
              styles.goalOption,
              primaryGoal === goal.key && styles.selectedOption,
            ]}
            onPress={() => setPrimaryGoal(goal.key as FitnessGoal)}
          >
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <View style={styles.goalText}>
              <Text style={[
                styles.optionTitle,
                primaryGoal === goal.key && styles.selectedOptionText,
              ]}>
                {goal.label}
              </Text>
              <Text style={[
                styles.optionDesc,
                primaryGoal === goal.key && styles.selectedOptionText,
              ]}>
                {goal.desc}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <Button
          title="Back"
          onPress={() => setStep(2)}
          variant="secondary"
          style={styles.backButton}
        />
        <Button
          title="Continue"
          onPress={() => setStep(4)}
          disabled={!primaryGoal}
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How often do you want to work out?</Text>
      <Text style={styles.stepSubtitle}>We'll use this to create your plan</Text>

      <View style={styles.frequencyGrid}>
        {frequencies.map((freq) => (
          <TouchableOpacity
            key={freq}
            style={[
              styles.frequencyOption,
              workoutFrequency === freq && styles.selectedOption,
            ]}
            onPress={() => setWorkoutFrequency(freq)}
          >
            <Text style={[
              styles.frequencyNumber,
              workoutFrequency === freq && styles.selectedOptionText,
            ]}>
              {freq}
            </Text>
            <Text style={[
              styles.frequencyLabel,
              workoutFrequency === freq && styles.selectedOptionText,
            ]}>
              {freq === 1 ? 'day' : 'days'}/week
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <Button
          title="Back"
          onPress={() => setStep(3)}
          variant="secondary"
          style={styles.backButton}
        />
        <Button
          title="Complete Setup"
          onPress={handleComplete}
          disabled={!workoutFrequency}
          loading={loading}
          style={styles.completeButton}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>

      <Text style={styles.stepIndicator}>Step {step} of 4</Text>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  input: {
    marginBottom: 30,
  },
  unitsSelector: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  optionsList: {
    gap: 12,
    marginBottom: 40,
  },
  option: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  goalText: {
    flex: 1,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.primary,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  frequencyOption: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  frequencyNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  frequencyLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});

export default ProfileSetupScreen; 