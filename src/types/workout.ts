export interface WorkoutSession {
  id: string;
  userId?: string;
  name?: string;
  templateId?: string;
  templateName?: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  durationSeconds?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  totalVolume?: number;
  totalSets?: number;
  personalRecords?: PersonalRecord[];
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  lastSavedAt?: Date;
  recoveredAt?: Date;
  recoveryAttempts?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  sets: WorkoutSet[];
  restTimer?: number; // current rest time in seconds
  targetRestTime?: number; // target rest time between sets
  notes?: string;
  order: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: 'working' | 'warmup' | 'dropset' | 'failure';
  weight?: number;
  reps?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  duration?: number; // for time-based exercises
  distance?: number; // for cardio
  restTime?: number; // actual rest time taken
  completed: boolean;
  isPersonalRecord?: boolean;
  notes?: string;
  completedAt?: Date;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: '1rm' | 'volume' | 'reps' | 'duration';
  value: number;
  previousValue?: number;
  achievedAt: Date;
  workoutSessionId: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full-body' | 'custom';
  exercises: TemplateExercise[];
  estimatedDuration?: number;
  userId?: string; // null for default templates
  isPublic: boolean;
  createdAt: Date;
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps?: string; // e.g., "8-12", "5", "AMRAP"
  targetWeight?: number;
  restTime?: number;
  order: number;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  instructions?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCompound: boolean;
  videoUrl?: string;
  imageUrl?: string;
} 