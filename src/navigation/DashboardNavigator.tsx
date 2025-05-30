import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../types/navigation';
import DashboardHomeScreen from '../screens/dashboard/DashboardHomeScreen';

// Placeholder screens - these will be implemented later
const QuickWorkoutScreen = () => <></>;
const WorkoutHistoryScreen = () => <></>;
const AchievementsScreen = () => <></>;

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export const DashboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="DashboardHome" 
        component={DashboardHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="QuickWorkout" 
        component={QuickWorkoutScreen}
        options={{ title: 'Quick Workout' }}
      />
      <Stack.Screen 
        name="WorkoutHistory" 
        component={WorkoutHistoryScreen}
        options={{ title: 'Workout History' }}
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator; 