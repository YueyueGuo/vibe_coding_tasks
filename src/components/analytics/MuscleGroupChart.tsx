import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MuscleGroup, MuscleGroupUsage, MuscleGroupBalance } from '../../types/muscleGroup';
import MuscleGroupService from '../../services/muscleGroupService';
import { theme } from '../../styles/theme';

interface MuscleGroupChartProps {
  usage: MuscleGroupUsage[];
  balance: MuscleGroupBalance[];
  onMuscleGroupPress?: (muscleGroup: MuscleGroup) => void;
}

// Note: The duplicate MuscleGroup interface that was here has been removed
// since we're importing it from '../../types/muscleGroup'

export const MuscleGroupChart: React.FC<MuscleGroupChartProps> = ({
  usage,
  balance,
  onMuscleGroupPress
}) => {
  const muscleGroups = MuscleGroupService.getAll();
  const maxVolume = Math.max(...usage.map(u => u.totalVolume), 1);

  const getBalanceColor = (status: 'balanced' | 'overworked' | 'underworked'): string => {
    switch (status) {
      case 'balanced': return theme.colors.success;
      case 'overworked': return theme.colors.warning;
      case 'underworked': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderMuscleGroupCard = (mg: MuscleGroup) => {
    const usageData = usage.find(u => u.muscleGroupId === mg.id);
    const balanceData = balance.find(b => b.muscleGroupId === mg.id);
    
    if (!usageData || !balanceData) return null;

    const volumePercentage = (usageData.totalVolume / maxVolume) * 100;
    const balanceColor = getBalanceColor(balanceData.status);

    return (
      <TouchableOpacity
        key={mg.id}
        style={[styles.muscleCard, { borderLeftColor: balanceColor }]}
        onPress={() => onMuscleGroupPress?.(mg)}
        activeOpacity={0.7}
      >
        <View style={styles.muscleHeader}>
          <View style={styles.muscleInfo}>
            <View>
              <Text style={styles.muscleName}>{mg.name}</Text>
              <Text style={styles.muscleRegion}>{mg.region}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: balanceColor + '20' }]}>
            <Text style={[styles.statusText, { color: balanceColor }]}>
              {balanceData.status}
            </Text>
          </View>
        </View>

        <View style={styles.muscleStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>
              {Math.round(usageData.totalVolume).toLocaleString()} lbs
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Frequency</Text>
            <Text style={styles.statValue}>
              {usageData.frequency.toFixed(1)}x/week
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>
              {balanceData.percentageOfTotal.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Volume Bar */}
        <View style={styles.volumeBarContainer}>
          <View style={styles.volumeBarBackground}>
            <View 
              style={[
                styles.volumeBar, 
                { 
                  width: `${volumePercentage}%`,
                  backgroundColor: balanceColor 
                }
              ]} 
            />
          </View>
          <Text style={styles.volumePercentage}>
            {volumePercentage.toFixed(0)}%
          </Text>
        </View>

        {balanceData.recommendation && (
          <Text style={styles.recommendation}>
            💡 {balanceData.recommendation}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const groupedMuscleGroups = {
    upper: muscleGroups.filter(mg => mg.region === 'upper'),
    core: muscleGroups.filter(mg => mg.region === 'core'),
    lower: muscleGroups.filter(mg => mg.region === 'lower'),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Object.entries(groupedMuscleGroups).map(([region, groups]) => (
        <View key={region} style={styles.regionSection}>
          <Text style={styles.regionTitle}>
            {region.charAt(0).toUpperCase() + region.slice(1)} Body
          </Text>
          
          {groups.map((mg: MuscleGroup) => renderMuscleGroupCard(mg))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  regionSection: {
    marginBottom: theme.spacing.xl,
  },
  regionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  muscleCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  muscleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  muscleRegion: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  muscleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  volumeBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  volumeBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  volumeBar: {
    height: '100%',
    borderRadius: 4,
  },
  volumePercentage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  recommendation: {
    fontSize: 13,
    color: theme.colors.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default MuscleGroupChart;