import { supabase } from '../config/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { WorkoutSession, WorkoutExercise, PersonalRecord } from '../types/workout';

export type AuthResult = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

/**
 * Core Supabase service for authentication and database operations
 * Provides a typed interface for all backend interactions
 */
export class SupabaseService {
  
  // Authentication methods
  static async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  static async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }

  // Database query helpers
  static getClient() {
    return supabase;
  }

  static from(table: string) {
    return supabase.from(table);
  }

  static storage() {
    return supabase.storage;
  }

  // Real-time subscription helpers
  static subscribe(table: string, event: string = '*', callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: event as any, schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  // Authentication state listener
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export default SupabaseService; 