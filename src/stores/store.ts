import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import userReducer from './userStore';
import workoutReducer from './workoutStore';
import workoutSessionReducer from './workoutSessionStore';
import subscriptionReducer from './subscriptionStore';
import aiReducer from './aiStore';

export const store = configureStore({
  reducer: {
    user: userReducer,
    workout: workoutReducer,
    workoutSession: workoutSessionReducer,
    subscription: subscriptionReducer,
    ai: aiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for date serialization
        ignoredActions: [
          'workoutSession/startWorkoutSession/fulfilled',
          'workoutSession/completeWorkoutSession/fulfilled',
          'workoutSession/pauseWorkoutSession/fulfilled',
          'workoutSession/resumeWorkoutSession/fulfilled',
          'workoutSession/addSetToExercise',
          'workoutSession/updateSet',
          'workoutSession/completeSet',
          'workoutSession/updateSessionNotes',
          'workoutSession/updateSessionName',
        ],
        // Ignore these field paths in the state
        ignoredActionsPaths: ['payload.startTime', 'payload.endTime', 'payload.createdAt', 'payload.updatedAt', 'payload.completedAt'],
        ignoredPaths: [
          'workoutSession.currentSession.startTime',
          'workoutSession.currentSession.endTime',
          'workoutSession.currentSession.createdAt',
          'workoutSession.currentSession.updatedAt',
          'workoutSession.sessionHistory.*.startTime',
          'workoutSession.sessionHistory.*.endTime',
          'workoutSession.sessionHistory.*.createdAt',
          'workoutSession.sessionHistory.*.updatedAt',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 