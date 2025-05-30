import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../types/navigation';
import ProgressHomeScreen from '../screens/progress/ProgressHomeScreen';

// Placeholder screens - these will be implemented later
const ProgressChartsScreen = () => <></>;
const PersonalRecordsScreen = () => <></>;
const BodyMeasurementsScreen = () => <></>;
const ProgressPhotosScreen = () => <></>;

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export const ProgressNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ProgressHome" 
        component={ProgressHomeScreen}
        options={{ title: 'Progress' }}
      />
      <Stack.Screen 
        name="ProgressCharts" 
        component={ProgressChartsScreen}
        options={{ title: 'Progress Charts' }}
      />
      <Stack.Screen 
        name="PersonalRecords" 
        component={PersonalRecordsScreen}
        options={{ title: 'Personal Records' }}
      />
      <Stack.Screen 
        name="BodyMeasurements" 
        component={BodyMeasurementsScreen}
        options={{ title: 'Body Measurements' }}
      />
      <Stack.Screen 
        name="ProgressPhotos" 
        component={ProgressPhotosScreen}
        options={{ title: 'Progress Photos' }}
      />
    </Stack.Navigator>
  );
};

export default ProgressNavigator; 