import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  displayName?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryGoal?: 'strength' | 'muscle_gain' | 'weight_loss' | 'endurance' | 'general_fitness';
  workoutFrequency?: number;
  preferredUnits?: 'metric' | 'imperial';
  isProfileComplete?: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  profileCompleted: boolean;
  createdAt: string;
}

interface UserState {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AppUser>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    setProfileCompleted: (state, action: PayloadAction<boolean>) => {
      if (state.currentUser) {
        state.currentUser.profileCompleted = action.payload;
      }
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setUser, setProfileCompleted, clearUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer; 