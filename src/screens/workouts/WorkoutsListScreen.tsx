import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, Card } from '../../components/common';
import { FadeIn } from '../../components/animations';

export const WorkoutsListScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FadeIn>
        <View style={styles.content}>
          <Card style={styles.startCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Ready to Work Out?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Start a new workout session or continue from templates
            </Text>
            <Button 
              title="Start New Workout"
              onPress={() => {}}
              style={styles.button}
            />
            <Button 
              title="Browse Templates"
              variant="outline"
              onPress={() => {}}
            />
          </Card>

          <Card style={styles.historyCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
              Workout History
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Your completed workouts will appear here
            </Text>
          </Card>
        </View>
      </FadeIn>
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
  startCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    marginBottom: 12,
  },
  historyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default WorkoutsListScreen; 