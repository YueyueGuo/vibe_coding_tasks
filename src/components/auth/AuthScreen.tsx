import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { theme } from '../../styles/theme';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');

  const renderAuthForm = () => {
    switch (mode) {
      case 'signin':
        return (
          <SignInForm
            onSuccess={onAuthSuccess}
            onSwitchToSignUp={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        );
      case 'signup':
        return (
          <SignUpForm
            onSuccess={onAuthSuccess}
            onSwitchToSignIn={() => setMode('signin')}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordForm
            onSuccess={() => setMode('signin')}
            onBackToSignIn={() => setMode('signin')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderAuthForm()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default AuthScreen; 