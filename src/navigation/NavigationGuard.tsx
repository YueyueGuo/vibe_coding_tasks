import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '../stores/store';
import { theme } from '../styles/theme';

interface NavigationGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  fallback?: React.ReactNode;
}

export const NavigationGuard: React.FC<NavigationGuardProps> = ({
  children,
  requireAuth = false,
  requireOnboarding = false,
  fallback,
}) => {
  // Simplified - assume authenticated for now until user store is implemented
  const { isAuthenticated, currentUser } = useAppSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth state check delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <View style={styles.guardContainer}>
        <Text style={styles.guardText}>Authentication required</Text>
      </View>
    );
  }

  // Check onboarding requirement
  if (requireOnboarding && currentUser && !currentUser.profileCompleted) {
    return fallback || (
      <View style={styles.guardContainer}>
        <Text style={styles.guardText}>Profile setup required</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  guardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  guardText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default NavigationGuard; 