import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihrttbpolvcpqvroacah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocnR0YnBvbHZjcHF2cm9hY2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxMDUsImV4cCI6MjA4NjQxNDEwNX0.cfrJZ_Z2i8aothvEVdzCJ8MlMQJ9X1DxazJqCs3nIY4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
