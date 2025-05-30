import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../../styles/theme';

interface WelcomeStepProps {
  displayName: string;
  onNext: (displayName: string) => void;
  onSkip?: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  displayName: initialDisplayName,
  onNext,
  onSkip,
}) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);

  const handleNext = () => {
    if (displayName.trim()) {
      onNext(displayName.trim());
    }
  };

  const isValid = displayName.trim().length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.title}>Welcome to Your Fitness Journey!</Text>
          <Text style={styles.subtitle}>
            Let's personalize your experience to help you reach your goals
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
          />
          <Text style={styles.hint}>
            This is how you'll be greeted in the app
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        {onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip Setup</Text>
          </TouchableOpacity>
        )}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: 18,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});

export default WelcomeStep; 