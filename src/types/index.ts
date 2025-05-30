// User types
export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  fitnessGoals: FitnessGoal[];
  experienceLevel: ExperienceLevel;
  preferredUnits: 'metric' | 'imperial';
  age?: number;
  weight?: number;
  height?: number;
}

export type FitnessGoal = 
  | 'strength'
  | 'muscle_gain'
  | 'weight_loss'
  | 'endurance'
  | 'general_fitness';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Workout types
export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: MuscleGroup[];
  equipment?: string[];
  instructions?: string[];
  category: ExerciseCategory;
  isCustom: boolean;
  createdBy?: string;
}

export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'cardio' | 'flexibility';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restTime?: number; // in seconds
  notes?: string;
  completedAt: Date;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  name?: string;
  exercises: WorkoutExercise[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  notes?: string;
  templateId?: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: Omit<WorkoutExercise, 'sets'>[];
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Progress types
export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  date: Date;
  previous?: {
    weight: number;
    reps: number;
    date: Date;
  };
}

export interface ProgressMetrics {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // weight * reps
  averageWorkoutDuration: number;
  currentStreak: number;
  longestStreak: number;
  personalRecords: PersonalRecord[];
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

export type SubscriptionPlan = 'free' | 'monthly' | 'annual' | 'family';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

// AI types
export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'workout' | 'exercise' | 'rest' | 'progression';
  title: string;
  description: string;
  confidence: number; // 0-1
  reasoning: string;
  actionItems?: string[];
  createdAt: Date;
  isRead: boolean;
}

export interface FormAnalysis {
  id: string;
  userId: string;
  exerciseId: string;
  videoUrl: string;
  analysis: {
    overallScore: number; // 0-100
    issues: FormIssue[];
    recommendations: string[];
    keyPoints: string[];
  };
  processedAt: Date;
}

export interface FormIssue {
  type: 'range_of_motion' | 'bar_path' | 'tempo' | 'stability' | 'safety';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp?: number; // seconds in video
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Navigation types
export * from './navigation';

// Re-export workout types for convenience
export * from './workout';

// Store types
export interface RootState {
  user: any; // Will be properly typed later
  workout: any; // Will be properly typed later  
  workoutSession: any; // From workoutSessionStore
  subscription: any; // Will be properly typed later
  ai: any; // Will be properly typed later
} 