import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../styles/theme';
import { WorkoutSession } from '../../types/workout';
import { WorkoutSessionRecovery } from '../../services/workoutSessionRecovery';
import { useAppDispatch } from '../../stores/store';
import { recoverActiveSession } from '../../stores/workoutSessionStore';
import { Button } from '../common/Button';
import { HapticService } from '../../services/hapticService';

interface SessionRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [orphanedSessions, setOrphanedSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (visible) {
      checkForOrphanedSessions();
    }
  }, [visible]);

  const checkForOrphanedSessions = async () => {
    setIsLoading(true);
    try {
      const sessions = await WorkoutSessionRecovery.checkForOrphanedSessions();
      setOrphanedSessions(sessions);
    } catch (error) {
      console.error('Error checking sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverSession = async (session: WorkoutSession) => {
    setIsRecovering(true);
    HapticService.impact('medium');
    
    try {
      const success = await WorkoutSessionRecovery.recoverSession(session);
      if (success) {
        await dispatch(recoverActiveSession()).unwrap();
        HapticService.notification('success');
        Alert.alert(
          '🎉 Session Recovered!', 
          'Your workout session has been recovered successfully! You can continue where you left off.',
          [{ text: 'Continue Workout', onPress: onClose }]
        );
      } else {
        HapticService.notification('error');
        Alert.alert(
          'Recovery Failed', 
          'Unable to recover the workout session. Please try again or discard the session.',
          [
            { text: 'Try Again', onPress: () => handleRecoverSession(session) },
            { text: 'Discard', style: 'destructive', onPress: () => handleDiscardSession(session) }
          ]
        );
      }
    } catch (error) {
      HapticService.notification('error');
      Alert.alert('Error', 'An unexpected error occurred during recovery.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDiscardSession = async (session: WorkoutSession) => {
    HapticService.impact('heavy');
    
    Alert.alert(
      'Discard Session?',
      'What would you like to do with this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save as Completed', 
          onPress: () => discardSession(session, true),
        },
        { 
          text: 'Delete Completely', 
          style: 'destructive',
          onPress: () => discardSession(session, false),
        }
      ]
    );
  };

  const discardSession = async (session: WorkoutSession, markAsCompleted: boolean) => {
    setIsRecovering(true);
    
    try {
      const success = await WorkoutSessionRecovery.discardSession(session, markAsCompleted);
      if (success) {
        HapticService.notification('success');
        setOrphanedSessions(prev => prev.filter(s => s.id !== session.id));
        
        if (orphanedSessions.length === 1) {
          // This was the last session, close modal
          onClose();
        }
        
        Alert.alert(
          'Session Processed', 
          markAsCompleted 
            ? 'Session saved to your workout history.' 
            : 'Session deleted successfully.'
        );
      } else {
        HapticService.notification('error');
        Alert.alert('Error', 'Failed to process session. Please try again.');
      }
    } catch (error) {
      HapticService.notification('error');
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsRecovering(false);
    }
  };

  const formatSessionTime = (session: WorkoutSession) => {
    const started = new Date(session.startedAt);
    const duration = session.durationSeconds || 
      Math.floor((Date.now() - started.getTime()) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    return {
      startTime: started.toLocaleString(),
      duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🔄 Workout Recovery</Text>
            <Text style={styles.subtitle}>
              We found {orphanedSessions.length > 0 ? 'an unfinished workout' : 'no sessions to recover'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Checking for sessions...</Text>
            </View>
          ) : orphanedSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No sessions need recovery</Text>
              <Button
                title="Continue"
                onPress={onClose}
                variant="primary"
                style={styles.continueButton}
              />
            </View>
          ) : (
            <ScrollView style={styles.sessionsList}>
              {orphanedSessions.map((session, index) => {
                const timeInfo = formatSessionTime(session);
                
                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionName}>
                        {session.name || 'Unnamed Workout'}
                      </Text>
                      <Text style={styles.sessionStatus}>
                        {session.status === 'paused' ? '⏸️ Paused' : '🏃 Active'}
                      </Text>
                    </View>
                    
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionTime}>
                        Started: {timeInfo.startTime}
                      </Text>
                      <Text style={styles.sessionDuration}>
                        Duration: {timeInfo.duration}
                      </Text>
                      <Text style={styles.sessionExercises}>
                        Exercises: {session.exercises.length}
                      </Text>
                    </View>

                    <View style={styles.sessionActions}>
                      <Button
                        title="🔄 Recover"
                        onPress={() => handleRecoverSession(session)}
                        variant="primary"
                        style={styles.recoverButton}
                        disabled={isRecovering}
                      />
                      <Button
                        title="🗑️ Discard"
                        onPress={() => handleDiscardSession(session)}
                        variant="secondary"
                        style={styles.discardButton}
                        disabled={isRecovering}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {isRecovering && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  continueButton: {
    minWidth: 120,
  },
  sessionsList: {
    maxHeight: 300,
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  sessionStatus: {
    fontSize: 14,
    color: theme.colors.warning,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  sessionExercises: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  recoverButton: {
    flex: 1,
  },
  discardButton: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.white,
  },
});

export default SessionRecoveryModal; 