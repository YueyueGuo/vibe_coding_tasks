import { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Navigation prop types
export type AuthNavigationProp = NavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = NavigationProp<MainTabParamList>;
export type WorkoutStackNavigationProp = NavigationProp<WorkoutsStackParamList>;

// Route prop types
export type AuthRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>;
export type WorkoutStackRouteProp<T extends keyof WorkoutsStackParamList> = RouteProp<WorkoutsStackParamList, T>;

// Combined navigation types
export type RootNavigationProp = AuthNavigationProp | MainTabNavigationProp | WorkoutStackNavigationProp;

// Auth Stack Navigator params
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

// Main Tab Navigator params
export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Progress: undefined;
  Library: undefined;
  Profile: undefined;
};

// Dashboard Stack Navigator params
export type DashboardStackParamList = {
  DashboardHome: undefined;
  QuickWorkout: undefined;
  WorkoutHistory: undefined;
  Achievements: undefined;
};

// Workouts Stack Navigator params
export type WorkoutsStackParamList = {
  WorkoutsList: undefined;
  ActiveWorkout: { workoutId?: string };
  WorkoutSummary: { workoutId: string };
  ExerciseDetail: { exerciseId: string };
  WorkoutTemplate: { templateId?: string };
};

// Progress Stack Navigator params
export type ProgressStackParamList = {
  ProgressHome: undefined;
  ProgressCharts: undefined;
  PersonalRecords: undefined;
  BodyMeasurements: undefined;
  ProgressPhotos: undefined;
};

// Library Stack Navigator params
export type LibraryStackParamList = {
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  CustomExercise: { exerciseId?: string };
  WorkoutTemplates: undefined;
  TemplateDetail: { templateId: string };
};

// Profile Stack Navigator params
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  Subscription: undefined;
  Support: undefined;
  About: undefined;
  EditProfile: undefined;
};

// Root Navigator params (combines Auth and Main)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

// Screen props types for type-safe navigation
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<DashboardStackParamList, T>,
    MainTabScreenProps<'Dashboard'>
  >;

export type WorkoutsStackScreenProps<T extends keyof WorkoutsStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<WorkoutsStackParamList, T>,
    MainTabScreenProps<'Workouts'>
  >;

export type ProgressStackScreenProps<T extends keyof ProgressStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<ProgressStackParamList, T>,
    MainTabScreenProps<'Progress'>
  >;

export type LibraryStackScreenProps<T extends keyof LibraryStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<LibraryStackParamList, T>,
    MainTabScreenProps<'Library'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'Profile'>
  >;

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// Declare global types for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 