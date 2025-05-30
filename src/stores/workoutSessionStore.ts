import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutSession, WorkoutExercise, WorkoutSet, PersonalRecord, WorkoutTemplate } from '../types/workout';
import StorageManager from '../utils/storage';

interface WorkoutSessionState {
  currentSession: WorkoutSession | null;
  sessionHistory: WorkoutSession[];
  templates: WorkoutTemplate[];
  isLoading: boolean;
  error: string | null;
  timer: {
    isActive: boolean;
    remainingTime: number;
    exerciseId?: string;
    startTime?: number;
  };
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

const initialState: WorkoutSessionState = {
  currentSession: null,
  sessionHistory: [],
  templates: [],
  isLoading: false,
  error: null,
  timer: {
    isActive: false,
    remainingTime: 0,
  },
  syncStatus: 'idle',
};

// Add PR detection utility function
const detectPersonalRecords = async (session: WorkoutSession): Promise<PersonalRecord[]> => {
  const prs: PersonalRecord[] = [];
  const existingPRs: PersonalRecord[] = await StorageManager.getItem<PersonalRecord[]>('personalRecords') ?? [];
  
  for (const exercise of session.exercises) {
    const completedSets = exercise.sets.filter(set => set.completed && set.weight && set.reps);
    
    if (completedSets.length === 0) continue;
    
    // Check for 1RM PR (highest weight × reps calculation)
    const maxWeight = Math.max(...completedSets.map(set => set.weight!));
    const maxWeightSet = completedSets.find(set => set.weight === maxWeight);
    
    if (maxWeightSet) {
      // Simple 1RM estimation: weight × (1 + reps/30)
      const estimated1RM = maxWeight * (1 + (maxWeightSet.reps! / 30));
      
      const existing1RMPR = existingPRs.find(pr => 
        pr.exerciseId === exercise.exerciseId && pr.type === '1rm'
      );
      
      if (!existing1RMPR || estimated1RM > existing1RMPR.value) {
        prs.push({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          type: '1rm',
          value: Math.round(estimated1RM),
          previousValue: existing1RMPR?.value,
          achievedAt: new Date(),
          workoutSessionId: session.id,
        });
      }
    }
    
    // Check for volume PR (total weight moved for this exercise)
    const totalVolume = completedSets.reduce((sum, set) => 
      sum + (set.weight! * set.reps!), 0
    );
    
    const existingVolumePR = existingPRs.find((pr: PersonalRecord) => 
      pr.exerciseId === exercise.exerciseId && pr.type === 'volume'
    );
    
    if (!existingVolumePR || totalVolume > existingVolumePR.value) {
      prs.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        type: 'volume',
        value: totalVolume,
        previousValue: existingVolumePR?.value,
        achievedAt: new Date(),
        workoutSessionId: session.id,
      });
    }
    
    // Check for reps PR (most reps with any weight)
    const maxReps = Math.max(...completedSets.map(set => set.reps!));
    const maxRepsSet = completedSets.find(set => set.reps === maxReps);
    
    if (maxRepsSet) {
      const existingRepsPR = existingPRs.find(pr => 
        pr.exerciseId === exercise.exerciseId && pr.type === 'reps'
      );
      
      // Only count as PR if it's with a meaningful weight (not just bodyweight)
      if (maxRepsSet.weight! >= 50 && (!existingRepsPR || maxReps > existingRepsPR.value)) {
        prs.push({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          type: 'reps',
          value: maxReps,
          previousValue: existingRepsPR?.value,
          achievedAt: new Date(),
          workoutSessionId: session.id,
        });
      }
    }
  }
  
  return prs;
};

// Add persistence middleware
const persistWorkoutSession = (session: WorkoutSession | null) => {
  if (session) {
    StorageManager.setItem('currentWorkoutSession', session);
  } else {
    StorageManager.removeItem('currentWorkoutSession');
  }
};

// Add utility function to clean up incomplete sets
const cleanupIncompleteSets = (session: WorkoutSession): WorkoutSession => {
  return {
    ...session,
    exercises: session.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.filter(set => 
        set.completed || (set.weight && set.reps && set.weight > 0 && set.reps > 0)
      )
    })).filter(exercise => exercise.sets.length > 0) // Remove exercises with no completed sets
  };
};

// Async thunks for workout session management
export const startWorkoutSession = createAsyncThunk(
  'workoutSession/start',
  async (params: {
    name?: string;
    templateId?: string;
    template?: WorkoutTemplate;
  }, { rejectWithValue }) => {
    try {
      const session: WorkoutSession = {
        id: `session_${Date.now()}`,
        userId: 'current-user', // Will be replaced with actual user ID from auth
        name: params.name,
        templateId: params.templateId,
        startedAt: new Date(),
        status: 'active',
        exercises: [],
        personalRecords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Load template exercises if template selected
      if (params.templateId) {
        const templates: WorkoutTemplate[] = await StorageManager.getItem<WorkoutTemplate[]>('workoutTemplates') ?? [];
        const template = templates.find((t: WorkoutTemplate) => t.id === params.templateId);
        if (template) {
          session.templateName = template.name;
          session.exercises = template.exercises.map((templateExercise, index) => ({
            id: `exercise_${Date.now()}_${index}`,
            exerciseId: templateExercise.exerciseId,
            exerciseName: templateExercise.exerciseName,
            muscleGroups: [], // Will be filled from exercise library
            sets: [],
            targetRestTime: templateExercise.restTime,
            notes: templateExercise.notes,
            order: templateExercise.order,
          }));
        }
      }
      
      // Persist to local storage
      await persistWorkoutSession(session);
      return session;
    } catch (error) {
      return rejectWithValue('Failed to start workout session');
    }
  }
);

export const pauseWorkoutSession = createAsyncThunk(
  'workoutSession/pause',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutSession: WorkoutSessionState };
      const session = state.workoutSession.currentSession;
      
      if (!session) {
        return rejectWithValue('No active session to pause');
      }
      
      const updatedSession = {
        ...session,
        status: 'paused' as const,
        updatedAt: new Date(),
      };
      
      await persistWorkoutSession(updatedSession);
      return updatedSession;
    } catch (error) {
      return rejectWithValue('Failed to pause workout session');
    }
  }
);

export const resumeWorkoutSession = createAsyncThunk(
  'workoutSession/resume',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { workoutSession: WorkoutSessionState };
      const session = state.workoutSession.currentSession;
      
      if (!session) {
        return rejectWithValue('No session to resume');
      }
      
      const updatedSession = {
        ...session,
        status: 'active' as const,
        updatedAt: new Date(),
      };
      
      await persistWorkoutSession(updatedSession);
      return updatedSession;
    } catch (error) {
      return rejectWithValue('Failed to resume workout session');
    }
  }
);

export const completeWorkoutSession = createAsyncThunk(
  'workoutSession/complete',
  async ({ finalNotes }: { finalNotes?: string } = {}, { getState, dispatch }) => {
    const state = getState() as { workoutSession: WorkoutSessionState };
    const session = state.workoutSession.currentSession;
    
    if (!session) {
      throw new Error('No active session to complete');
    }

    // Clean up incomplete sets before completing
    const cleanedSession = cleanupIncompleteSets(session);

    const completedSession: WorkoutSession = {
      ...cleanedSession,
      notes: finalNotes || cleanedSession.notes,
      completedAt: new Date(),
      durationSeconds: Math.floor((Date.now() - cleanedSession.startedAt.getTime()) / 1000),
    };
    
    // Detect personal records
    const personalRecords = await detectPersonalRecords(cleanedSession);
    
    // Update stored personal records
    if (personalRecords.length > 0) {
      const existingPRs: PersonalRecord[] = await StorageManager.getItem<PersonalRecord[]>('personalRecords') ?? [];
      const updatedPRs = [...existingPRs];
      
      personalRecords.forEach(newPR => {
        const existingIndex = updatedPRs.findIndex(pr => 
          pr.exerciseId === newPR.exerciseId && pr.type === newPR.type
        );
        
        if (existingIndex >= 0) {
          updatedPRs[existingIndex] = newPR;
        } else {
          updatedPRs.push(newPR);
        }
      });
      
      await StorageManager.setItem('personalRecords', updatedPRs as unknown as WorkoutSession);
    }
    
    // Calculate workout statistics
    const totalSets = cleanedSession.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalVolume = cleanedSession.exercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed && s.weight && s.reps)
                  .reduce((vol, s) => vol + (s.weight! * s.reps!), 0), 0
    );
    
    // Save to session history
    const history: WorkoutSession[] = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') ?? [];
    history.unshift(completedSession);
    
    // Keep only last 90 days for free users
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const filteredHistory = history.filter(session => 
      new Date(session.createdAt) > ninetyDaysAgo
    );
    
    await StorageManager.setItem('workoutHistory', filteredHistory as unknown as WorkoutSession);
    await persistWorkoutSession(null);
    
    return { completedSession, updatedHistory: filteredHistory };
  }
);

export const loadWorkoutHistory = createAsyncThunk(
  'workoutSession/loadHistory',
  async (_, { rejectWithValue }) => {
    try {
      const history: WorkoutSession[] = await StorageManager.getItem<WorkoutSession[]>('workoutHistory') ?? [];
      return history;
    } catch (error) {
      return rejectWithValue('Failed to load workout history');
    }
  }
);

export const recoverActiveSession = createAsyncThunk(
  'workoutSession/recover',
  async (_, { rejectWithValue }) => {
    try {
      const session: WorkoutSession | null = await StorageManager.getItem<WorkoutSession>('currentWorkoutSession') ?? null;
      return session;
    } catch (error) {
      return rejectWithValue('Failed to recover active session');
    }
  }
);

// Add a new thunk for checking PRs on individual set completion
export const checkSetPersonalRecord = createAsyncThunk(
  'workoutSession/checkSetPR',
  async (payload: { exerciseId: string; setId: string }, { getState }) => {
    try {
      const state = getState() as { workoutSession: WorkoutSessionState };
      const session = state.workoutSession.currentSession;
      
      if (!session) return null;
      
      const exercise = session.exercises.find(ex => ex.id === payload.exerciseId);
      const set = exercise?.sets.find(s => s.id === payload.setId);
      
      if (!exercise || !set || !set.weight || !set.reps) return null;
      
      // Check if this set beats existing PRs
      const existingPRs: PersonalRecord[] = await StorageManager.getItem<PersonalRecord[]>('personalRecords') ?? [];
      const estimated1RM = set.weight * (1 + (set.reps / 30));
      
      const existing1RMPR = existingPRs.find(pr => 
        pr.exerciseId === exercise.exerciseId && pr.type === '1rm'
      );
      
      // Mark set as PR if it beats existing record
      if (!existing1RMPR || estimated1RM > existing1RMPR.value) {
        return {
          exerciseId: payload.exerciseId,
          setId: payload.setId,
          isPersonalRecord: true,
          prType: '1rm' as const,
          newValue: Math.round(estimated1RM),
          previousValue: existing1RMPR?.value,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking set PR:', error);
      return null;
    }
  }
);

// Add auto-save functionality
export const autoSaveWorkoutSession = createAsyncThunk(
  'workoutSession/autoSave',
  async (_, { getState }) => {
    const state = getState() as { workoutSession: WorkoutSessionState };
    const session = state.workoutSession.currentSession;
    
    if (session) {
      const updatedSession = {
        ...session,
        updatedAt: new Date(),
      };
      await persistWorkoutSession(updatedSession);
      return updatedSession;
    }
    return null;
  }
);

const workoutSessionSlice = createSlice({
  name: 'workoutSession',
  initialState,
  reducers: {
    // Exercise management
    addExerciseToSession: (state, action: PayloadAction<Omit<WorkoutExercise, 'id' | 'order'>>) => {
      if (state.currentSession) {
        const newExercise: WorkoutExercise = {
          ...action.payload,
          id: `exercise_${Date.now()}`,
          order: state.currentSession.exercises.length,
        };
        state.currentSession.exercises.push(newExercise);
        state.currentSession.updatedAt = new Date();
        
        // Auto-save in background
        persistWorkoutSession(state.currentSession);
      }
    },
    
    removeExerciseFromSession: (state, action: PayloadAction<string>) => {
      if (state.currentSession) {
        state.currentSession.exercises = state.currentSession.exercises.filter(
          ex => ex.id !== action.payload
        );
        // Reorder remaining exercises
        state.currentSession.exercises.forEach((ex, index) => {
          ex.order = index;
        });
        state.currentSession.updatedAt = new Date();
        
        // Auto-save in background
        persistWorkoutSession(state.currentSession);
      }
    },
    
    reorderExercises: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.currentSession) {
        const { fromIndex, toIndex } = action.payload;
        const exercises = [...state.currentSession.exercises];
        const [movedExercise] = exercises.splice(fromIndex, 1);
        exercises.splice(toIndex, 0, movedExercise);
        
        // Update order property
        exercises.forEach((ex, index) => {
          ex.order = index;
        });
        
        state.currentSession.exercises = exercises;
        state.currentSession.updatedAt = new Date();
        
        // Auto-save in background
        persistWorkoutSession(state.currentSession);
      }
    },
    
    // Set management
    addSetToExercise: (state, action: PayloadAction<{ exerciseId: string; set: Omit<WorkoutSet, 'id' | 'setNumber'> }>) => {
      if (state.currentSession) {
        const exercise = state.currentSession.exercises.find(ex => ex.id === action.payload.exerciseId);
        if (exercise) {
          const newSet: WorkoutSet = {
            ...action.payload.set,
            id: `set_${Date.now()}`,
            setNumber: exercise.sets.length + 1,
          };
          exercise.sets.push(newSet);
          state.currentSession.updatedAt = new Date();
          
          // Auto-save in background
          persistWorkoutSession(state.currentSession);
        }
      }
    },
    
    updateSet: (state, action: PayloadAction<{ exerciseId: string; setId: string; updates: Partial<WorkoutSet> }>) => {
      if (state.currentSession) {
        const exercise = state.currentSession.exercises.find(ex => ex.id === action.payload.exerciseId);
        if (exercise) {
          const set = exercise.sets.find(s => s.id === action.payload.setId);
          if (set) {
            Object.assign(set, action.payload.updates);
            state.currentSession.updatedAt = new Date();
            
            // Auto-save in background
            persistWorkoutSession(state.currentSession);
          }
        }
      }
    },
    
    completeSet: (state, action: PayloadAction<{ exerciseId: string; setId: string }>) => {
      if (state.currentSession) {
        const exercise = state.currentSession.exercises.find(ex => ex.id === action.payload.exerciseId);
        if (exercise) {
          const set = exercise.sets.find(s => s.id === action.payload.setId);
          if (set) {
            set.completed = true;
            set.completedAt = new Date();
            state.currentSession.updatedAt = new Date();
            
            // Auto-save in background
            persistWorkoutSession(state.currentSession);
          }
        }
      }
    },
    
    deleteSet: (state, action: PayloadAction<{ exerciseId: string; setId: string }>) => {
      if (state.currentSession) {
        const exercise = state.currentSession.exercises.find(ex => ex.id === action.payload.exerciseId);
        if (exercise) {
          exercise.sets = exercise.sets.filter(s => s.id !== action.payload.setId);
          // Renumber remaining sets
          exercise.sets.forEach((set, index) => {
            set.setNumber = index + 1;
          });
          state.currentSession.updatedAt = new Date();
          
          // Auto-save in background
          persistWorkoutSession(state.currentSession);
        }
      }
    },
    
    // Timer management
    startRestTimer: (state, action: PayloadAction<{ duration: number; exerciseId?: string }>) => {
      state.timer = {
        isActive: true,
        remainingTime: action.payload.duration,
        exerciseId: action.payload.exerciseId,
        startTime: Date.now(),
      };
    },
    
    stopRestTimer: (state) => {
      state.timer = {
        isActive: false,
        remainingTime: 0,
      };
    },
    
    updateRestTimer: (state, action: PayloadAction<number>) => {
      if (state.timer.isActive) {
        state.timer.remainingTime = Math.max(0, action.payload);
        if (state.timer.remainingTime === 0) {
          state.timer.isActive = false;
        }
      }
    },
    
    // Session metadata
    updateSessionNotes: (state, action: PayloadAction<string>) => {
      if (state.currentSession) {
        state.currentSession.notes = action.payload;
        state.currentSession.updatedAt = new Date();
        
        // Auto-save in background
        persistWorkoutSession(state.currentSession);
      }
    },
    
    updateSessionName: (state, action: PayloadAction<string>) => {
      if (state.currentSession) {
        state.currentSession.name = action.payload;
        state.currentSession.updatedAt = new Date();
        
        // Auto-save in background
        persistWorkoutSession(state.currentSession);
      }
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    setSyncStatus: (state, action: PayloadAction<WorkoutSessionState['syncStatus']>) => {
      state.syncStatus = action.payload;
    },
    
    markSetAsPersonalRecord: (state, action: PayloadAction<{ exerciseId: string; setId: string; prType: string }>) => {
      if (state.currentSession) {
        const exercise = state.currentSession.exercises.find(ex => ex.id === action.payload.exerciseId);
        if (exercise) {
          const set = exercise.sets.find(s => s.id === action.payload.setId);
          if (set) {
            set.isPersonalRecord = true;
            state.currentSession.updatedAt = new Date();
            
            // Auto-save in background
            persistWorkoutSession(state.currentSession);
          }
        }
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Start session
      .addCase(startWorkoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startWorkoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(startWorkoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Pause session
      .addCase(pauseWorkoutSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      .addCase(pauseWorkoutSession.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Resume session
      .addCase(resumeWorkoutSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      .addCase(resumeWorkoutSession.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Complete session
      .addCase(completeWorkoutSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeWorkoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = null;
        state.sessionHistory = action.payload.updatedHistory;
        state.timer = { isActive: false, remainingTime: 0 };
        state.error = null;
      })
      .addCase(completeWorkoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Load history
      .addCase(loadWorkoutHistory.fulfilled, (state, action) => {
        state.sessionHistory = action.payload;
      })
      .addCase(loadWorkoutHistory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Recover session
      .addCase(recoverActiveSession.fulfilled, (state, action) => {
        const session = action.payload as WorkoutSession | null;
        if (session && session.status === 'active') {
          state.currentSession = session;
        }
      })
      
      // Handle PR checking
      .addCase(checkSetPersonalRecord.fulfilled, (state, action) => {
        if (action.payload) {
          const exercise = state.currentSession?.exercises.find(ex => ex.id === action.payload!.exerciseId);
          if (exercise) {
            const set = exercise.sets.find(s => s.id === action.payload!.setId);
            if (set) {
              set.isPersonalRecord = true;
            }
          }
        }
      })
      
      // Auto-save handling
      .addCase(autoSaveWorkoutSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentSession = action.payload;
        }
      });
  },
});

// Action creators
export const {
  addExerciseToSession,
  removeExerciseFromSession,
  reorderExercises,
  addSetToExercise,
  updateSet,
  completeSet,
  deleteSet,
  startRestTimer,
  stopRestTimer,
  updateRestTimer,
  updateSessionNotes,
  updateSessionName,
  clearError,
  setSyncStatus,
  markSetAsPersonalRecord,
} = workoutSessionSlice.actions;

// Selectors
export const selectCurrentSession = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.currentSession;

export const selectSessionHistory = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.sessionHistory;

export const selectIsWorkoutActive = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.currentSession?.status === 'active';

export const selectTimer = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.timer;

export const selectWorkoutSessionLoading = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.isLoading;

export const selectWorkoutSessionError = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.error;

export const selectPersonalRecords = (state: { workoutSession: WorkoutSessionState }) => 
  state.workoutSession.currentSession?.personalRecords || [];

export const selectHasNewPersonalRecords = (state: { workoutSession: WorkoutSessionState }) => 
  (state.workoutSession.currentSession?.personalRecords?.length || 0) > 0;

export default workoutSessionSlice.reducer; 