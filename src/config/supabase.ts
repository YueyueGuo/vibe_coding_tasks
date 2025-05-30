import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Environment configuration
// These should be moved to environment variables in production
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.warn('SUPABASE_URL not properly configured. Please set EXPO_PUBLIC_SUPABASE_URL in your environment.');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-anon-key') {
  console.warn('SUPABASE_ANON_KEY not properly configured. Please set EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.');
}

// Create Supabase client with React Native specific options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Storage implementation for React Native
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    // Enable realtime for live updates
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export the client configuration for testing purposes
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
}; 