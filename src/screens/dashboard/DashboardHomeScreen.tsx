import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, Card } from '../../components/common';
import { NavigationService } from '../../services/navigationService';

export const DashboardHomeScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
          Welcome to your fitness journey! 💪
        </Text>
        
        <Card style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Quick Stats
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>PRs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Streak</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Quick Actions
          </Text>
          <Button 
            title="Start Quick Workout"
            onPress={() => NavigationService.navigateToWorkout()}
            style={styles.actionButton}
          />
          <Button 
            title="View Progress"
            variant="outline"
            onPress={() => NavigationService.navigateToProgress()}
            style={styles.actionButton}
          />
        </Card>

        <Card style={styles.recentCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Recent Activity
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No workouts yet. Start your first workout to see your progress!
          </Text>
        </Card>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  actionCard: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  recentCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DashboardHomeScreen; 