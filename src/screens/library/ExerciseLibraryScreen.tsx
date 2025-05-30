import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Input } from '../../components/common';

export const ExerciseLibraryScreen: React.FC = () => {
  const { theme } = useTheme();

  const exerciseCategories = [
    { name: 'Push', count: 25, emoji: '⬆️' },
    { name: 'Pull', count: 20, emoji: '⬇️' },
    { name: 'Legs', count: 30, emoji: '🦵' },
    { name: 'Core', count: 15, emoji: '🔥' },
    { name: 'Cardio', count: 10, emoji: '❤️' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Input 
          placeholder="Search exercises..."
          // style={styles.searchInput}
        />

        <Card style={styles.categoriesCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Exercise Categories
          </Text>
          
          {exerciseCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <View>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                    {category.count} exercises
                  </Text>
                </View>
              </View>
              <Button 
                title="View"
                size="sm"
                onPress={() => {}}
              />
            </View>
          ))}
        </Card>

        <Card style={styles.recentCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Recently Used
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Your recently used exercises will appear here
          </Text>
        </Card>

        <Button 
          title="Create Custom Exercise"
          variant="outline"
          onPress={() => {}}
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
  searchInput: {
    marginBottom: 16,
  },
  categoriesCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 14,
    marginTop: 2,
  },
  recentCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
});

export default ExerciseLibraryScreen; 