import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from '../types/navigation';
import WorkoutsListScreen from '../screens/workouts/WorkoutsListScreen';

// Placeholder screens - these will be implemented later
const ActiveWorkoutScreen = () => <></>;
const WorkoutSummaryScreen = () => <></>;
const ExerciseDetailScreen = () => <></>;
const WorkoutTemplateScreen = () => <></>;

const Stack = createNativeStackNavigator<WorkoutsStackParamList>();

export const WorkoutsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="WorkoutsList" 
        component={WorkoutsListScreen}
        options={{ title: 'Workouts' }}
      />
      <Stack.Screen 
        name="ActiveWorkout" 
        component={ActiveWorkoutScreen}
        options={{ title: 'Active Workout' }}
      />
      <Stack.Screen 
        name="WorkoutSummary" 
        component={WorkoutSummaryScreen}
        options={{ title: 'Workout Summary' }}
      />
      <Stack.Screen 
        name="ExerciseDetail" 
        component={ExerciseDetailScreen}
        options={{ title: 'Exercise Detail' }}
      />
      <Stack.Screen 
        name="WorkoutTemplate" 
        component={WorkoutTemplateScreen}
        options={{ title: 'Workout Template' }}
      />
    </Stack.Navigator>
  );
};

export default WorkoutsNavigator; 