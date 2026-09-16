import { supabase } from '../../../lib/supabase';

export const getCurrentUserEmail = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.email || null;
};
