import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Desarrollo local sin .env usa credenciales de relleno: la app no funciona de
// verdad sin un proyecto real. En produccion (APP_ENV=production) el build falla
// si faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.
const fallbackSupabaseUrl = 'https://your-project-ref.supabase.co';
const fallbackSupabaseAnonKey = 'your-anon-key';

const appEnv = process.env.APP_ENV || 'development';
const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (appEnv === 'production' && (!envSupabaseUrl || !envSupabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables in production build.');
}

const supabaseUrl = envSupabaseUrl || fallbackSupabaseUrl;
const supabaseAnonKey = envSupabaseAnonKey || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
