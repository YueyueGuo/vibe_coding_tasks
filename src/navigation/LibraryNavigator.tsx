import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryStackParamList } from '../types/navigation';
import ExerciseLibraryScreen from '../screens/library/ExerciseLibraryScreen';

// Placeholder screens - these will be implemented later
const ExerciseDetailScreen = () => <></>;
const CustomExerciseScreen = () => <></>;
const WorkoutTemplatesScreen = () => <></>;
const TemplateDetailScreen = () => <></>;

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export const LibraryNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ExerciseLibrary" 
        component={ExerciseLibraryScreen}
        options={{ title: 'Exercise Library' }}
      />
      <Stack.Screen 
        name="ExerciseDetail" 
        component={ExerciseDetailScreen}
        options={{ title: 'Exercise Detail' }}
      />
      <Stack.Screen 
        name="CustomExercise" 
        component={CustomExerciseScreen}
        options={{ title: 'Custom Exercise' }}
      />
      <Stack.Screen 
        name="WorkoutTemplates" 
        component={WorkoutTemplatesScreen}
        options={{ title: 'Workout Templates' }}
      />
      <Stack.Screen 
        name="TemplateDetail" 
        component={TemplateDetailScreen}
        options={{ title: 'Template Detail' }}
      />
    </Stack.Navigator>
  );
};

export default LibraryNavigator; 