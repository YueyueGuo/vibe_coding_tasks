import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { ProfileSetupFlow } from '../components/onboarding/ProfileSetupFlow';
import { AuthScreen } from '../components/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="SignIn" 
        component={AuthScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={AuthScreen}
        options={{ title: 'Sign Up' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={AuthScreen}
        options={{ title: 'Reset Password' }}
      />
      <Stack.Screen 
        name="ProfileSetup" 
        component={ProfileSetupFlow}
        options={{ 
          title: 'Profile Setup',
          gestureEnabled: false, // Prevent swiping back during onboarding
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 