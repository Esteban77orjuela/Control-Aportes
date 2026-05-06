import { supabase } from '../../lib/supabase';

/**
 * AuditRepository - Responsable de la trazabilidad del sistema.
 * Registra cada acción crítica para auditorías financieras futuras.
 */
export const AuditRepository = {
    log: async (action: string, tableName: string, recordId: string, oldData?: any, newData?: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action,
                table_name: tableName,
                record_id: recordId,
                old_data: oldData,
                new_data: newData
            }]);
        } catch (e) {
            // El log de auditoría no debe bloquear la operación principal
            console.error('Error recording audit log:', e);
        }
    }
};
