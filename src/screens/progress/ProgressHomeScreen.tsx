import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button } from '../../components/common';
import { ProgressBar } from '../../components/animations';

export const ProgressHomeScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.overviewCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Progress Overview
          </Text>
          
          <View style={styles.progressItem}>
            <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
              Workout Streak
            </Text>
            <ProgressBar progress={0} height={8} style={styles.progressBar} />
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              0 days
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
              Monthly Goal
            </Text>
            <ProgressBar progress={0} height={8} style={styles.progressBar} />
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              0/12 workouts
            </Text>
          </View>
        </Card>

        <Card style={styles.chartsCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Strength Progress
          </Text>
          <View style={styles.chartPlaceholder}>
            <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
              📊 Charts will appear here after your first workout
            </Text>
          </View>
        </Card>

        <Card style={styles.achievementsCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Recent Achievements
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Complete your first workout to unlock achievements! 🏆
          </Text>
        </Card>

        <Button 
          title="View Detailed Analytics"
          variant="outline"
          onPress={() => {}}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
  },
  chartsCard: {
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  achievementsCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  button: {
    marginBottom: 16,
  },
});

export default ProgressHomeScreen; 