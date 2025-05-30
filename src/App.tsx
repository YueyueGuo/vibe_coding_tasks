import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ReduxProvider } from './components/providers/ReduxProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { RootNavigator } from './navigation';
import { useWorkoutSessionPersistence } from './hooks/useWorkoutSessionPersistence';
import { SessionRecoveryModal } from './components/workout/SessionRecoveryModal';
import { useState, useEffect } from 'react';
import { WorkoutSessionRecovery } from './services/workoutSessionRecovery';

export default function App() {
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  
  // Initialize session persistence
  useWorkoutSessionPersistence();

  // Initialize crash monitoring and check for orphaned sessions
  useEffect(() => {
    // Start monitoring app state for crash detection
    WorkoutSessionRecovery.startMonitoring();
    
    const checkSessions = async () => {
      // Clean up old sessions first
      await WorkoutSessionRecovery.cleanupOldSessions();
      
      // Check for orphaned sessions
      const orphaned = await WorkoutSessionRecovery.checkForOrphanedSessions();
      if (orphaned.length > 0) {
        setShowSessionRecovery(true);
      }
    };
    
    // Check after a short delay to ensure app is fully loaded
    const timer = setTimeout(checkSessions, 1500);
    
    return () => {
      clearTimeout(timer);
      WorkoutSessionRecovery.stopMonitoring();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <ReduxProvider>
          <RootNavigator />
          <StatusBar style="light" />
          
          <SessionRecoveryModal
            visible={showSessionRecovery}
            onClose={() => setShowSessionRecovery(false)}
          />
        </ReduxProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 