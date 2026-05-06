import { RetreatRepository } from '../data/repositories/RetreatRepository';
import { AuditRepository } from '../data/repositories/AuditRepository';
import { StorageRepository } from '../data/repositories/StorageRepository';
import { Youth, RetreatSaving } from '../types';
import { YouthValidator, SavingValidator } from '../utils/validators';
import { generateUUID } from '../utils/uuid';

/**
 * RetreatService - Capa de Aplicación
 * Centraliza la lógica de negocio del módulo de retiro.
 * Implementa validaciones y transformaciones complejas antes de la persistencia.
 */
export const RetreatService = {
    /**
     * Registra un nuevo joven aplicando validaciones de seguridad
     */
    registerYouth: async (youthData: Omit<Youth, 'id' | 'createdAt'>): Promise<void> => {
        // 1. Validación de integridad
        const validation = YouthValidator.validate(youthData);
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            throw new Error(firstError);
        }

        // 2. Lógica de negocio: Auto-detección de género si no viene definido
        const gender = youthData.gender || RetreatService.guessGender(youthData.name);

        // 3. Persistencia
        const id = generateUUID();
        await RetreatRepository.saveYouth({
            ...youthData,
            gender,
            id
        });

        // 4. Auditoría
        await AuditRepository.log('INSERT', 'youths', id, null, { ...youthData, gender });
    },

    /**
     * Actualiza el perfil de un joven
     */
    updateYouth: async (youth: Youth): Promise<void> => {
        const validation = YouthValidator.validate(youth);
        if (!validation.isValid) {
            throw new Error(Object.values(validation.errors)[0]);
        }
        await RetreatRepository.updateYouth(youth);
        await AuditRepository.log('UPDATE', 'youths', youth.id, 'old_data_fetching_required', youth);
    },

    /**
     * Registra un abono con validación financiera
     */
    addSaving: async (saving: RetreatSaving): Promise<void> => {
        const validation = SavingValidator.validate(saving.amount);
        if (!validation.isValid) {
            throw new Error(validation.errors.amount);
        }

        if (!saving.signatureBase64 && !saving.signaturePath) {
            throw new Error('La firma es obligatoria para garantizar la trazabilidad.');
        }

        const finalSaving = { 
            ...saving,
            id: saving.id || generateUUID() // Generación segura para idempotencia offline
        };

        // Subir al Storage y quitar el payload Base64 antes de guardar
        if (saving.signatureBase64) {
            const path = await StorageRepository.uploadSignature(saving.signatureBase64, `youth_${saving.youthId}`);
            finalSaving.signaturePath = path;
            finalSaving.signatureBase64 = undefined; // No guardamos Base64 en la base de datos
        }

        await RetreatRepository.saveRetreatSaving(finalSaving);
        await AuditRepository.log('INSERT', 'retreat_savings', finalSaving.id || 'new', null, finalSaving);
    },

    /**
     * Heurística para detección de género
     */
    guessGender: (name: string): 'male' | 'female' => {
        const n = name.trim().toLowerCase();
        if (!n) return 'male';
        if (['luca', 'mika', 'andrea', 'bautista'].includes(n)) return 'male';
        if (n.endsWith('a')) return 'female';
        return 'male';
    },

    /**
     * Calcula la edad de un joven
     */
    calculateAge: (birthDate?: string): number | null => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate + 'T00:00:00');
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    },

    /**
     * Determina si el cumpleaños es en la semana actual
     */
    isBirthdayThisWeek: (birthDate?: string): boolean => {
        if (!birthDate) return false;
        const today = new Date();
        const birth = new Date(birthDate + 'T00:00:00');
        
        const birthThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        const diffTime = birthThisYear.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 && diffDays <= 7;
    }
};
