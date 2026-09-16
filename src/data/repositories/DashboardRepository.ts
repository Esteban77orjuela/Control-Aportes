import { supabase } from '../../lib/supabase';
import { Person } from '../../types';

export const DashboardRepository = {
    getStats: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase.rpc('get_music_dashboard_stats', { p_user_id: user.id });

            if (error) throw error;

            return data as {
                totalMembers: number;
                totalTransactions: number;
                totalAmount: number;
                peopleStats: (Person & { totalContributed: number })[];
            };
        } catch (e) {
            console.error('Error fetching dashboard stats via RPC', e);
            return {
                totalMembers: 0,
                totalTransactions: 0,
                totalAmount: 0,
                peopleStats: [],
            };
        }
    }
};
