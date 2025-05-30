import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useAppDispatch } from '../../stores/store';
import { updateSessionNotes } from '../../stores/workoutSessionStore';
import { theme } from '../../styles/theme';

interface WorkoutNotesProps {
  sessionId: string;
  notes: string;
  disabled?: boolean;
}

export const WorkoutNotes: React.FC<WorkoutNotesProps> = ({ 
  sessionId, 
  notes, 
  disabled = false 
}) => {
  const dispatch = useAppDispatch();

  const handleNotesChange = (text: string) => {
    if (disabled) return;
    dispatch(updateSessionNotes(text));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, disabled && styles.disabledText]}>Notes</Text>
      <TextInput
        style={[
          styles.textInput, 
          disabled && styles.disabledInput
        ]}
        placeholder="How was your workout? Any PRs?"
        placeholderTextColor={theme.colors.textSecondary}
        value={notes}
        onChangeText={handleNotesChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  disabledText: {
    color: theme.colors.textSecondary,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
  },
  disabledInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
}); 