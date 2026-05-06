import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Fallback temporal para no romper instalaciones actuales mientras se completa
// la migracion de secretos a EAS/ENV en todos los entornos.
const fallbackSupabaseUrl = 'https://ihrttbpolvcpqvroacah.supabase.co';
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocnR0YnBvbHZjcHF2cm9hY2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxMDUsImV4cCI6MjA4NjQxNDEwNX0.cfrJZ_Z2i8aothvEVdzCJ8MlMQJ9X1DxazJqCs3nIY4';

const appEnv = process.env.APP_ENV || 'development';
const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (appEnv === 'production' && (!envSupabaseUrl || !envSupabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables in production build.');
}

const supabaseUrl = envSupabaseUrl || fallbackSupabaseUrl;
const supabaseAnonKey = envSupabaseAnonKey || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
