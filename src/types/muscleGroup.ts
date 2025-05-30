export interface MuscleGroup {
  id: string;
  name: string;
  region: 'upper' | 'core' | 'lower';
  category: string[];
  antagonists: string[];
  synergists: string[];
  description?: string;
}

export interface MuscleGroupUsage {
  muscleGroupId: string;
  totalVolume: number;
  frequency: number;
  lastWorkoutDate?: Date;
  totalSets?: number;
  averageWeight?: number;
  averageReps?: number;
}

export interface MuscleGroupBalance {
  muscleGroupId: string;
  status: 'balanced' | 'overworked' | 'underworked';
  percentageOfTotal: number;
  recommendation?: string;
  weeklyVolume?: number;
  targetPercentage?: number;
}

export type MuscleGroupCategory = 'primary' | 'secondary' | 'stabilizer';

export interface MuscleGroupStats {
  totalVolume: number;
  frequency: number;
  lastTrained: Date | null;
  progressTrend: 'improving' | 'maintaining' | 'declining';
}