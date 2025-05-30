import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button } from '../../components/common';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';

export const ProfileHomeScreen: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const user = useSelector((state: RootState) => state.user.currentUser);

  const menuItems = [
    { title: 'Edit Profile', icon: '👤', onPress: () => {} },
    { title: 'Settings', icon: '⚙️', onPress: () => {} },
    { title: 'Subscription', icon: '💎', onPress: () => {} },
    { title: 'Support', icon: '🎧', onPress: () => {} },
    { title: 'About', icon: 'ℹ️', onPress: () => {} },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.themeCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Appearance
          </Text>
          <View style={styles.themeRow}>
            <Text style={[styles.themeLabel, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
            <Button 
              title={isDark ? 'On' : 'Off'}
              size="sm"
              variant={isDark ? 'primary' : 'outline'}
              onPress={toggleTheme}
            />
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Menu
          </Text>
          
          {menuItems.map((item, index) => (
            <View key={index} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: theme.colors.textSecondary }]}>
                →
              </Text>
            </View>
          ))}
        </Card>

        <Button 
          title="Sign Out"
          variant="danger"
          onPress={() => {}}
          style={styles.signOutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  themeCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 18,
  },
  signOutButton: {
    marginTop: 16,
  },
});

export default ProfileHomeScreen; 