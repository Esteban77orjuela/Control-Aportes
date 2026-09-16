import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const getAuthenticatedUserOrThrow = async (): Promise<User> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    throw new Error('AUTH_REQUIRED');
  }
  return data.user;
};
