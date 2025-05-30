import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';

// Icon component placeholder - we'll use actual icons later
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const iconMap: Record<string, string> = {
    Dashboard: '📊',
    Workouts: '💪',
    Progress: '📈',
    Library: '📚',
    Profile: '👤',
  };

  return (
    <Text style={[
      styles.icon,
      { opacity: focused ? 1 : 0.6 }
    ]}>
      {iconMap[name] || '📱'}
    </Text>
  );
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      paddingBottom: 34, // Safe area for iPhone home indicator
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      position: 'relative',
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      minHeight: 48,
    },
    tabContentFocused: {
      backgroundColor: theme.colors.primary + '15',
    },
    tabLabelFocused: {
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semiBold,
    },
    tabLabelUnfocused: {
      color: theme.colors.textSecondary,
    },
    indicator: {
      position: 'absolute',
      top: 0,
      width: 24,
      height: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: 1,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={dynamicStyles.tab}
              activeOpacity={0.7}
            >
              <View style={[
                dynamicStyles.tabContent,
                isFocused && dynamicStyles.tabContentFocused
              ]}>
                <TabIcon name={route.name} focused={isFocused} />
                <Text style={[
                  styles.tabLabel,
                  isFocused ? dynamicStyles.tabLabelFocused : dynamicStyles.tabLabelUnfocused
                ]}>
                  {typeof label === 'string' ? label : route.name}
                </Text>
              </View>
              {isFocused && <View style={dynamicStyles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CustomTabBar; 