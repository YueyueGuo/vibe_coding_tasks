import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { DataRetentionService } from '../../services/dataRetentionService';
import { theme } from '../../styles/theme';
import { HapticService } from '../../services/hapticService';

interface DataUsageDashboardProps {
  onUpgradePress?: () => void;
}

export const DataUsageDashboard: React.FC<DataUsageDashboardProps> = ({
  onUpgradePress,
}) => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const usageData = await DataRetentionService.getDataUsageSummary();
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    Alert.alert(
      'Clean Up Data',
      'This will permanently delete data beyond your retention period. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'destructive',
          onPress: performCleanup,
        },
      ]
    );
  };

  const performCleanup = async () => {
    setCleaningUp(true);
    try {
      const results = await DataRetentionService.performDataCleanup();
      HapticService.impact('medium');
      
      Alert.alert(
        'Cleanup Complete',
        `Deleted ${results.workouts.deletedCount} old workouts and ${results.personalRecords.deletedCount} old records.`
      );
      
      await loadUsageData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to clean up data. Please try again.');
    } finally {
      setCleaningUp(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubscriptionBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'premium':
        return { backgroundColor: theme.colors.success, color: 'white' };
      case 'pro':
        return { backgroundColor: theme.colors.primary, color: 'white' };
      default:
        return { backgroundColor: theme.colors.surface, color: theme.colors.text };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading data usage...</Text>
      </View>
    );
  }

  if (!usage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load data usage information.</Text>
      </View>
    );
  }

  const isFreeTier = usage.subscription.tier === 'free';
  const hasDataAtRisk = usage.usage.workouts.beyondRetention > 0 || 
                       usage.usage.personalRecords.beyondRetention > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Subscription Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Subscription Status</Text>
          <View style={[styles.badge, getSubscriptionBadgeStyle(usage.subscription.tier)]}>
            <Text style={[styles.badgeText, { color: getSubscriptionBadgeStyle(usage.subscription.tier).color }]}>
              {usage.subscription.tier.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {usage.subscription.expiresAt && (
          <Text style={styles.expiryText}>
            Expires: {formatDate(new Date(usage.subscription.expiresAt))}
          </Text>
        )}
      </View>

      {/* Data Retention Policy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Retention Policy</Text>
        <View style={styles.policyGrid}>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Workout History</Text>
            <Text style={styles.policyValue}>
              {usage.policy.workoutHistoryDays === -1 ? 'Unlimited' : `${usage.policy.workoutHistoryDays} days`}
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Personal Records</Text>
            <Text style={styles.policyValue}>
              {usage.policy.personalRecordsDays === -1 ? 'Unlimited' : `${usage.policy.personalRecordsDays} days`}
            </Text>
          </View>
        </View>
      </View>

      {/* Current Usage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Data Usage</Text>
        
        {/* Workouts */}
        <View style={styles.usageSection}>
          <Text style={styles.usageSectionTitle}>Workouts</Text>
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageNumber}>{usage.usage.workouts.total}</Text>
              <Text style={styles.usageLabel}>Total</Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={[styles.usageNumber, { color: theme.colors.success }]}>
                {usage.usage.workouts.withinRetention}
              </Text>
              <Text style={styles.usageLabel}>Safe</Text>
            </View>
            {usage.usage.workouts.beyondRetention > 0 && (
              <View style={styles.usageStat}>
                <Text style={[styles.usageNumber, { color: theme.colors.error }]}>
                  {usage.usage.workouts.beyondRetention}
                </Text>
                <Text style={styles.usageLabel}>At Risk</Text>
              </View>
            )}
          </View>
          {usage.usage.workouts.oldestDate && (
            <Text style={styles.oldestText}>
              Oldest: {formatDate(usage.usage.workouts.oldestDate)}
            </Text>
          )}
        </View>

        {/* Personal Records */}
        <View style={styles.usageSection}>
          <Text style={styles.usageSectionTitle}>Personal Records</Text>
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageNumber}>{usage.usage.personalRecords.total}</Text>
              <Text style={styles.usageLabel}>Total</Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={[styles.usageNumber, { color: theme.colors.success }]}>
                {usage.usage.personalRecords.withinRetention}
              </Text>
              <Text style={styles.usageLabel}>Safe</Text>
            </View>
            {usage.usage.personalRecords.beyondRetention > 0 && (
              <View style={styles.usageStat}>
                <Text style={[styles.usageNumber, { color: theme.colors.error }]}>
                  {usage.usage.personalRecords.beyondRetention}
                </Text>
                <Text style={styles.usageLabel}>At Risk</Text>
              </View>
            )}
          </View>
          {usage.usage.personalRecords.oldestDate && (
            <Text style={styles.oldestText}>
              Oldest: {formatDate(usage.usage.personalRecords.oldestDate)}
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        {hasDataAtRisk && isFreeTier && (
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ Data at Risk</Text>
            <Text style={styles.warningText}>
              You have data beyond your retention period that will be deleted during the next cleanup.
            </Text>
          </View>
        )}

        {isFreeTier && onUpgradePress && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgradePress}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            <Text style={styles.upgradeButtonSubtext}>Unlimited data retention</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.cleanupButton} 
          onPress={handleManualCleanup}
          disabled={cleaningUp}
        >
          {cleaningUp ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.cleanupButtonText}>Clean Up Data Now</Text>
          )}
        </TouchableOpacity>

        {usage.nextCleanup && (
          <Text style={styles.nextCleanupText}>
            Next automatic cleanup: {formatDate(usage.nextCleanup)}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    textAlign: 'center',
    color: theme.colors.error,
    fontSize: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  policyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  policyItem: {
    flex: 1,
    alignItems: 'center',
  },
  policyLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  policyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  usageSection: {
    marginBottom: 20,
  },
  usageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  usageStat: {
    alignItems: 'center',
  },
  usageNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  usageLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  oldestText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningSection: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  upgradeButton: {
    backgroundColor: theme.colors.success,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButtonSubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  cleanupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  nextCleanupText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}); 