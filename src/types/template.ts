import { Exercise } from './index';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  exercises: TemplateExercise[];
  tags: string[];
  isPublic: boolean;
  isCustom: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating?: number;
  muscleGroups: string[];
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  order: number;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number; // for time-based exercises
  restPeriod?: number; // in seconds
  notes?: string;
  setType: 'working' | 'warmup' | 'dropset' | 'failure';
}

export interface TemplateSet {
  setNumber: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  setType: 'working' | 'warmup' | 'dropset' | 'failure';
  notes?: string;
} 