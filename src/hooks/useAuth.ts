import { useAppDispatch, useAppSelector } from '../stores/store';
import { setUser, clearUser, setLoading, setError, AppUser } from '../stores/userStore';
import { SupabaseService } from '../services/supabaseService';
import { NavigationService } from '../services/navigationService';
import { useCallback, useEffect } from 'react';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const isLoading = useAppSelector(state => state.user.isLoading);
  const error = useAppSelector(state => state.user.error);

  // Initialize auth state on hook mount
  useEffect(() => {
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = SupabaseService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          handleUserSignedOut();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch(setLoading(true));
      const session = await SupabaseService.getCurrentSession();
      
      if (session?.user) {
        await handleUserSignedIn(session.user);
      } else {
        dispatch(clearUser());
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch(setError('Failed to initialize authentication'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUserSignedIn = async (supabaseUser: any) => {
    try {
      // Convert Supabase user to our AppUser type
      const userData: AppUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName: supabaseUser.user_metadata?.firstName || supabaseUser.user_metadata?.lastName 
          ? `${supabaseUser.user_metadata?.firstName || ''} ${supabaseUser.user_metadata?.lastName || ''}`.trim()
          : undefined,
        profileCompleted: supabaseUser.user_metadata?.profileCompleted || false,
        createdAt: supabaseUser.created_at, // Keep as string from Supabase
      };
  
      dispatch(setUser(userData));
      dispatch(setError(null));

      // Navigate based on profile completion
      if (!userData.profileCompleted) {
        NavigationService.navigateToOnboarding();
      } else {
        NavigationService.navigateToMain();
      }
    } catch (error) {
      console.error('Error handling signed in user:', error);
      dispatch(setError('Failed to load user profile'));
    }
  };

  const handleUserSignedOut = () => {
    dispatch(clearUser());
    NavigationService.navigateToAuth();
  };

  const signIn = useCallback(async (credentials: SignInCredentials): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { user: supabaseUser, error: authError } = await SupabaseService.signIn(
        credentials.email,
        credentials.password
      );

      if (authError) {
        dispatch(setError(getAuthErrorMessage(authError.message)));
        return false;
      }

      if (supabaseUser) {
        await handleUserSignedIn(supabaseUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      dispatch(setError('An unexpected error occurred during sign in'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { user: supabaseUser, error: authError } = await SupabaseService.signUp(
        credentials.email,
        credentials.password,
        {
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          profileCompleted: false,
        }
      );

      if (authError) {
        dispatch(setError(getAuthErrorMessage(authError.message)));
        return false;
      }

      if (supabaseUser) {
        // For email confirmation flow, user won't be signed in immediately
        if (supabaseUser.email_confirmed_at) {
          await handleUserSignedIn(supabaseUser);
        } else {
          dispatch(setError('Please check your email to confirm your account'));
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      dispatch(setError('An unexpected error occurred during sign up'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { error: authError } = await SupabaseService.signOut();

      if (authError) {
        dispatch(setError('Failed to sign out'));
        return false;
      }

      handleUserSignedOut();
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch(setError('An unexpected error occurred during sign out'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { error: authError } = await SupabaseService.resetPassword(email);

      if (authError) {
        dispatch(setError(getAuthErrorMessage(authError.message)));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      dispatch(setError('An unexpected error occurred while sending reset email'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const updateProfile = useCallback(async (updates: Partial<{
    firstName: string;
    lastName: string;
    profileCompleted: boolean;
  }>): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const currentUser = await SupabaseService.getCurrentUser();
      if (!currentUser) {
        dispatch(setError('No authenticated user found'));
        return false;
      }

      // Update user metadata in Supabase
      const { error } = await SupabaseService.getClient().auth.updateUser({
        data: updates
      });

      if (error) {
        dispatch(setError('Failed to update profile'));
        return false;
      }

      // Update local user state
      if (user.currentUser) {
        const updatedUser = {
          ...user.currentUser,
          ...updates,
          updatedAt: new Date(),
        };
        dispatch(setUser(updatedUser));
      }

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      dispatch(setError('An unexpected error occurred while updating profile'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user.currentUser]);

  const clearError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  // Helper function to convert Supabase error messages to user-friendly messages
  const getAuthErrorMessage = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please check your email and confirm your account',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Invalid email': 'Please enter a valid email address',
    };

    return errorMap[errorMessage] || errorMessage;
  };

  return {
    // State
    user: user.currentUser,
    isAuthenticated: !!user.currentUser && !user.isLoading,
    isLoading,
    error,

    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,

    // Computed properties
    needsOnboarding: user.currentUser && !user.currentUser.profileCompleted,
  };
};