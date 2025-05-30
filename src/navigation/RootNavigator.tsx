import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../stores/store';
import { RootStackParamList } from '../types/navigation';
import { navigationRef } from '../services/navigationService';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ProfileSetupFlow } from '../components/onboarding/ProfileSetupFlow';
import { NavigationGuard } from './NavigationGuard';
import LoadingScreen from '../components/common/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['weightlifting-tracker://'],
  config: {
    screens: {
      Auth: {
        screens: {
          SignIn: 'auth/signin',
          SignUp: 'auth/signup',
          ForgotPassword: 'auth/forgot-password',
          ProfileSetup: 'auth/profile-setup',
        },
      },
      Main: {
        screens: {
          Dashboard: {
            screens: {
              DashboardHome: 'dashboard',
              QuickWorkout: 'dashboard/quick-workout',
              WorkoutHistory: 'dashboard/history',
              Achievements: 'dashboard/achievements',
            },
          },
          Workouts: {
            screens: {
              WorkoutsList: 'workouts',
              ActiveWorkout: 'workouts/active/:workoutId?',
              WorkoutSummary: 'workouts/summary/:workoutId',
              ExerciseDetail: 'workouts/exercise/:exerciseId',
              WorkoutTemplate: 'workouts/template/:templateId?',
            },
          },
          Progress: {
            screens: {
              ProgressHome: 'progress',
              ProgressCharts: 'progress/charts',
              PersonalRecords: 'progress/records',
              BodyMeasurements: 'progress/measurements',
              ProgressPhotos: 'progress/photos',
            },
          },
          Library: {
            screens: {
              ExerciseLibrary: 'library',
              ExerciseDetail: 'library/exercise/:exerciseId',
              CustomExercise: 'library/custom/:exerciseId?',
              WorkoutTemplates: 'library/templates',
              TemplateDetail: 'library/template/:templateId',
            },
          },
          Profile: {
            screens: {
              ProfileHome: 'profile',
              Settings: 'profile/settings',
              Subscription: 'profile/subscription',
              Support: 'profile/support',
              About: 'profile/about',
              EditProfile: 'profile/edit',
            },
          },
        },
      },
      Onboarding: 'onboarding',
    },
  },
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);

  const getInitialRouteName = (): keyof RootStackParamList => {
    if (!isAuthenticated) {
      return 'Auth';
    }
    
    if (currentUser && !currentUser.profileCompleted) {
      return 'Onboarding';
    }
    
    return 'Main';
  };

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking}
      fallback={<LoadingScreen />}
    >
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen 
          name="Onboarding" 
          component={ProfileSetupFlow}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Main">
          {() => (
            <NavigationGuard requireAuth={true} requireOnboarding={true}>
              <MainTabNavigator />
            </NavigationGuard>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator; 