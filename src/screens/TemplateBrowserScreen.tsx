import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { WorkoutTemplate } from '../types/template';
import TemplateService from '../services/templateService';
import { theme } from '../styles/theme';
import { HapticService } from '../services/hapticService';
import SmartSearchBar from '../components/common/SmartSearchBar';

interface TemplateBrowserScreenProps {
  navigation: any;
  route?: {
    params?: {
      onSelectTemplate?: (template: WorkoutTemplate) => void;
      mode?: 'browse' | 'select';
    };
  };
}

const CATEGORY_OPTIONS = [
  { key: 'all', label: 'All', emoji: '💪', color: theme.colors.primary },
  { key: 'strength', label: 'Strength', emoji: '🏋️', color: '#FF6B6B' },
  { key: 'cardio', label: 'Cardio', emoji: '❤️', color: '#4ECDC4' },
  { key: 'flexibility', label: 'Flexibility', emoji: '🧘', color: '#45B7D1' },
  { key: 'sports', label: 'Sports', emoji: '⚽', color: '#96CEB4' },
  { key: 'custom', label: 'Custom', emoji: '⭐', color: '#FFEAA7' },
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'created', label: 'Recently Created' },
  { key: 'usage', label: 'Most Used' },
  { key: 'rating', label: 'Highest Rated' },
];

export const TemplateBrowserScreen: React.FC<TemplateBrowserScreenProps> = ({ navigation, route }) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'usage' | 'rating'>('created');
  const [loading, setLoading] = useState(true);

  const { onSelectTemplate, mode = 'browse' } = route?.params || {};

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await TemplateService.getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTemplates = useMemo(() => {
    let result = templates;

    // Search filter
    if (searchQuery.trim()) {
      result = TemplateService.searchTemplates(result, searchQuery);
    }

    // Category filter
    result = TemplateService.filterByCategory(result, categoryFilter);

    // Sort
    result = TemplateService.sortTemplates(result, sortBy);

    return result;
  }, [templates, searchQuery, categoryFilter, sortBy]);

  const handleTemplatePress = async (template: WorkoutTemplate) => {
    HapticService.selection();
    
    if (mode === 'select' && onSelectTemplate) {
      onSelectTemplate(template);
      navigation.goBack();
    } else {
      navigation.navigate('TemplateDetail', { template });
    }
  };

  const handleCreateTemplate = () => {
    HapticService.impact('medium');
    navigation.navigate('CreateTemplate');
  };

  const handleDeleteTemplate = async (template: WorkoutTemplate) => {
    if (!template.isCustom) return;

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TemplateService.deleteTemplate(template.id);
              HapticService.notification('success');
              loadTemplates(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          }
        }
      ]
    );
  };

  const renderCategoryChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.chipContainer}
      contentContainerStyle={styles.chipContent}
    >
      {CATEGORY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => {
            HapticService.impact('light');
            setCategoryFilter(option.key);
          }}
          style={[
            styles.categoryChip,
            {
              backgroundColor: categoryFilter === option.key ? option.color : theme.colors.surface,
              borderColor: option.color,
            }
          ]}
        >
          <Text style={styles.categoryEmoji}>{option.emoji}</Text>
          <Text style={[
            styles.categoryLabel,
            {
              color: categoryFilter === option.key ? theme.colors.white : option.color,
              fontWeight: categoryFilter === option.key ? '600' : '500',
            }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTemplateCard = ({ item: template }: { item: WorkoutTemplate }) => {
    const categoryOption = CATEGORY_OPTIONS.find(opt => opt.key === template.category);
    
    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={() => handleTemplatePress(template)}
        onLongPress={() => template.isCustom && handleDeleteTemplate(template)}
        activeOpacity={0.7}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            {template.description && (
              <Text style={styles.templateDescription} numberOfLines={2}>
                {template.description}
              </Text>
            )}
          </View>
          
          <View style={styles.templateBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryOption?.color }]}>
              <Text style={styles.categoryBadgeText}>{categoryOption?.emoji}</Text>
            </View>
          </View>
        </View>

        <View style={styles.templateDetails}>
          <View style={styles.templateStats}>
            <Text style={styles.statText}>
              {template.exercises.length} exercises • {template.estimatedDuration}min
            </Text>
            <Text style={styles.statText}>
              Used {template.usageCount} times
            </Text>
          </View>

          <View style={styles.templateMeta}>
            <Text style={styles.difficultyText}>
              {template.difficulty}
            </Text>
            {template.isCustom && (
              <Text style={styles.customBadge}>Custom</Text>
            )}
          </View>
        </View>

        <View style={styles.muscleGroups}>
          {template.muscleGroups.slice(0, 4).map((muscle, index) => (
            <View key={index} style={styles.muscleTag}>
              <Text style={styles.muscleTagText}>{muscle}</Text>
            </View>
          ))}
          {template.muscleGroups.length > 4 && (
            <View style={styles.muscleTag}>
              <Text style={styles.muscleTagText}>+{template.muscleGroups.length - 4}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'select' ? 'Select Template' : 'Workout Templates'}
        </Text>
        <Text style={styles.subtitle}>
          {filteredAndSortedTemplates.length} template{filteredAndSortedTemplates.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SmartSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search templates..."
        />
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      {renderCategoryChips()}

      {/* Template List */}
      <ScrollView style={styles.content}>
        <FlatList
          data={filteredAndSortedTemplates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.templateList}
          scrollEnabled={false}
        />

        {filteredAndSortedTemplates.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No templates found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first workout template!'
              }
            </Text>
            <TouchableOpacity onPress={handleCreateTemplate} style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity onPress={handleCreateTemplate} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    paddingLeft: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  chipContent: {
    paddingRight: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  templateList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  templateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  templateInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  templateDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  templateBadges: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 16,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  templateStats: {
    flex: 1,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  templateMeta: {
    alignItems: 'flex-end',
  },
  difficultyText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: theme.spacing.xs,
  },
  customBadge: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '600',
    backgroundColor: theme.colors.secondary + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  muscleTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  muscleTagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
});

export default TemplateBrowserScreen; 