import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAppSelector } from '../../stores/store';
import { selectTimer } from '../../stores/workoutSessionStore';
import { theme } from '../../styles/theme';

export const RestTimer: React.FC = () => {
  const timer = useAppSelector(selectTimer);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timer.isActive) {
    return (
      <TouchableOpacity style={styles.inactiveTimer}>
        <Text style={styles.timerText}>Rest Timer</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.activeTimer, timer.remainingTime <= 10 && styles.urgentTimer]}>
      <Text style={styles.activeTimerText}>
        {formatTime(timer.remainingTime)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inactiveTimer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTimer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  urgentTimer: {
    backgroundColor: theme.colors.error,
  },
  timerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeTimerText: {
    fontSize: 14,
    color: theme.colors.background,
    fontWeight: '600',
  },
}); 