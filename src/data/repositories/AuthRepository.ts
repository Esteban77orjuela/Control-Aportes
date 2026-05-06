import { supabase } from '../../lib/supabase';

export const AuthRepository = {
    logout: async (): Promise<void> => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (e) {
            console.error('Error al cerrar sesión:', e);
            throw e;
        }
    }
};
