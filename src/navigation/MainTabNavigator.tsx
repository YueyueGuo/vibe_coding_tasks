import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { CustomTabBar } from './CustomTabBar';
import { DashboardNavigator } from './DashboardNavigator';
import { WorkoutsNavigator } from './WorkoutsNavigator';
import { ProgressNavigator } from './ProgressNavigator';
import { LibraryNavigator } from './LibraryNavigator';
import { ProfileNavigator } from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardNavigator}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsNavigator}
        options={{
          title: 'Workouts',
          tabBarLabel: 'Workouts',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressNavigator}
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryNavigator}
        options={{
          title: 'Library',
          tabBarLabel: 'Library',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 