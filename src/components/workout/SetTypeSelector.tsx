import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';

type SetType = 'working' | 'warmup' | 'dropset' | 'failure';

interface SetTypeOption {
  type: SetType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

interface SetTypeSelectorProps {
  visible: boolean;
  currentType: SetType;
  onSelect: (type: SetType) => void;
  onClose: () => void;
}

const setTypeOptions: SetTypeOption[] = [
  {
    type: 'working',
    label: 'Working',
    emoji: '💪',
    description: 'Main working sets at target weight',
    color: theme.colors.primary,
  },
  {
    type: 'warmup',
    label: 'Warmup',
    emoji: '🔥',
    description: 'Light sets to prepare muscles',
    color: theme.colors.warning,
  },
  {
    type: 'failure',
    label: 'To Failure',
    emoji: '⚡',
    description: 'Push until you can\'t complete another rep',
    color: theme.colors.error,
  },
  {
    type: 'dropset',
    label: 'Drop Set',
    emoji: '📉',
    description: 'Reduce weight and continue immediately',
    color: theme.colors.secondary,
  },
];

export const SetTypeSelector: React.FC<SetTypeSelectorProps> = ({
  visible,
  currentType,
  onSelect,
  onClose,
}) => {
  const handleSelect = (type: SetType) => {
    HapticService.selection();
    onSelect(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Set Type</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Choose the type of set to track different training methods
          </Text>

          {setTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                currentType === option.type && styles.optionCardSelected,
                { borderColor: option.color + '30' }
              ]}
              onPress={() => handleSelect(option.type)}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[styles.optionLabel, { color: option.color }]}>
                  {option.label}
                </Text>
                {currentType === option.type && (
                  <Text style={styles.selectedCheck}>✓</Text>
                )}
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedCheck: {
    fontSize: 16,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
}); 