import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../stores/store';
import { 
  startWorkoutSession, 
  recoverActiveSession,
  selectCurrentSession,
  selectWorkoutSessionLoading,
  selectWorkoutSessionError,
  clearError
} from '../stores/workoutSessionStore';
import { theme } from '../styles/theme';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ActiveWorkoutInterface } from '../components/workout/ActiveWorkoutInterface';

const TEMPLATE_OPTIONS = [
  { id: 'push', name: 'Push Day', category: 'push', estimatedDuration: 45 },
  { id: 'pull', name: 'Pull Day', category: 'pull', estimatedDuration: 50 },
  { id: 'legs', name: 'Leg Day', category: 'legs', estimatedDuration: 60 },
  { id: 'full', name: 'Full Body', category: 'full-body', estimatedDuration: 75 },
  { id: 'upper', name: 'Upper Body', category: 'upper', estimatedDuration: 55 },
  { id: 'lower', name: 'Lower Body', category: 'lower', estimatedDuration: 50 },
  { id: 'arms', name: 'Arms', category: 'arms', estimatedDuration: 35 },
  { id: 'back', name: 'Back', category: 'back', estimatedDuration: 45 },
  { id: 'chest', name: 'Chest', category: 'chest', estimatedDuration: 40 },
  { id: 'shoulders', name: 'Shoulders', category: 'shoulders', estimatedDuration: 35 },
];

export const WorkoutScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const isLoading = useAppSelector(selectWorkoutSessionLoading);
  const error = useAppSelector(selectWorkoutSessionError);
  
  const [workoutName, setWorkoutName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Recovery effect - check for existing session on mount
  useEffect(() => {
    dispatch(recoverActiveSession());
  }, [dispatch]);

  // Error handling effect
  useEffect(() => {
    if (error) {
      Alert.alert('Workout Error', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, dispatch]);

  const handleStartWorkout = async () => {
    if (isLoading) return;

    try {
      await dispatch(startWorkoutSession({
        name: workoutName.trim() || undefined,
        templateId: selectedTemplate || undefined,
      })).unwrap();
    } catch (error) {
      // Error is handled by the useEffect above
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
      setWorkoutName('');
    } else {
      setSelectedTemplate(templateId);
      const template = TEMPLATE_OPTIONS.find(t => t.id === templateId);
      if (template && !workoutName.trim()) {
        setWorkoutName(template.name);
      }
    }
  };

  const getSelectedTemplate = () => {
    return selectedTemplate ? TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate) : null;
  };

  // Show active workout interface if session exists
  if (currentSession) {
    return <ActiveWorkoutInterface session={currentSession} />;
  }

  // Show loading spinner during session initialization
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Starting your workout...</Text>
      </View>
    );
  }

  // Start workout interface
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>BEAST MODE</Text>
        <Text style={styles.tagline}>Track your lifts. Get swole.</Text>
        <TouchableOpacity style={styles.settingsIcon}>
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation Placeholder */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={styles.tabText}>🏋️ Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={[styles.tabText, styles.inactiveTabText]}>📊 History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={[styles.tabText, styles.inactiveTabText]}>📈 Progress</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>New Workout</Text>

        {/* Workout Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Workout Name (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Push Day, Leg Day, etc."
            placeholderTextColor={theme.colors.textSecondary}
            value={workoutName}
            onChangeText={setWorkoutName}
            maxLength={50}
          />
        </View>

        {/* Template Selection */}
        <View style={styles.templateContainer}>
          <View style={styles.templateHeader}>
            <Text style={styles.inputLabel}>Choose a Template (Optional)</Text>
            <View style={styles.templateActions}>
              <TouchableOpacity onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                <Text style={styles.createTemplateText}>+ Create Template</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.editTemplatesText}>✏️ Edit Templates</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.templateGrid}>
            {TEMPLATE_OPTIONS.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateChip,
                  selectedTemplate === template.id && styles.selectedTemplate
                ]}
                onPress={() => handleTemplateSelect(template.id)}
              >
                <Text style={[
                  styles.templateChipText,
                  selectedTemplate === template.id && styles.selectedTemplateText
                ]}>
                  {template.name}
                </Text>
                <Text style={[
                  styles.templateDuration,
                  selectedTemplate === template.id && styles.selectedTemplateText
                ]}>
                  ~{template.estimatedDuration}min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Template Info */}
          {selectedTemplate && (
            <View style={styles.templateInfo}>
              <Text style={styles.templateInfoTitle}>
                Selected: {getSelectedTemplate()?.name}
              </Text>
              <Text style={styles.templateInfoText}>
                Estimated duration: {getSelectedTemplate()?.estimatedDuration} minutes
              </Text>
              <Text style={styles.templateInfoText}>
                You can add or remove exercises once your workout starts.
              </Text>
            </View>
          )}
        </View>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <View style={styles.advancedOptions}>
            <Text style={styles.advancedTitle}>Advanced Options</Text>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Auto-start rest timer</Text>
              <TouchableOpacity style={styles.toggle}>
                <Text style={styles.toggleText}>ON</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Default rest time</Text>
              <TouchableOpacity style={styles.timeSelector}>
                <Text style={styles.timeSelectorText}>90s</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Start Buttons */}
        <View style={styles.quickStartContainer}>
          <Text style={styles.quickStartTitle}>Quick Start</Text>
          <View style={styles.quickStartGrid}>
            <TouchableOpacity 
              style={styles.quickStartButton}
              onPress={() => {
                setSelectedTemplate('push');
                setWorkoutName('Push Day');
              }}
            >
              <Text style={styles.quickStartEmoji}>💪</Text>
              <Text style={styles.quickStartText}>Push Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickStartButton}
              onPress={() => {
                setSelectedTemplate('pull');
                setWorkoutName('Pull Day');
              }}
            >
              <Text style={styles.quickStartEmoji}>🎯</Text>
              <Text style={styles.quickStartText}>Pull Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickStartButton}
              onPress={() => {
                setSelectedTemplate('legs');
                setWorkoutName('Leg Day');
              }}
            >
              <Text style={styles.quickStartEmoji}>🦵</Text>
              <Text style={styles.quickStartText}>Leg Day</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Workout Button */}
        <Button
          title={selectedTemplate ? "🚀 Start Workout" : "🏋️ Start Empty Workout"}
          onPress={handleStartWorkout}
          variant="primary"
          style={styles.startButton}
          disabled={isLoading}
        />

        {/* Helper Text */}
        <Text style={styles.helperText}>
          💡 Tip: You can always add exercises during your workout, even if you start with a template.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  settingsIcon: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  settingsText: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 8,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  inactiveTabText: {
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateContainer: {
    marginBottom: 24,
  },
  templateHeader: {
    marginBottom: 12,
  },
  templateActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  createTemplateText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  editTemplatesText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedTemplate: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  templateDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  selectedTemplateText: {
    color: theme.colors.background,
  },
  templateInfo: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  templateInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  templateInfoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  advancedOptions: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  toggle: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.background,
  },
  timeSelector: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeSelectorText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  quickStartContainer: {
    marginBottom: 32,
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  quickStartGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStartButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickStartEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickStartText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  startButton: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
}); 