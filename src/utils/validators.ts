/**
 * Sistema de Validación de Dominio
 * Sigue los principios de Programación Defensiva para asegurar la integridad de los datos financieros.
 */

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export const YouthValidator = {
    validate: (data: any): ValidationResult => {
        const errors: Record<string, string> = {};

        if (!data.name || data.name.trim().length < 3) {
            errors.name = 'El nombre debe tener al menos 3 caracteres.';
        }

        if (data.targetAmount <= 0) {
            errors.targetAmount = 'La meta de ahorro debe ser un monto positivo.';
        }

        if (data.phone && !/^\d{7,15}$/.test(data.phone.replace(/\s/g, ''))) {
            errors.phone = 'El teléfono no tiene un formato válido.';
        }

        if (data.birthDate) {
            const birth = new Date(data.birthDate);
            const today = new Date();
            if (birth > today) {
                errors.birthDate = 'La fecha de nacimiento no puede ser en el futuro.';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

export const SavingValidator = {
    validate: (amount: number): ValidationResult => {
        const errors: Record<string, string> = {};

        if (amount <= 0) {
            errors.amount = 'El monto del abono debe ser mayor a cero.';
        }

        if (amount > 5000000) { // Límite de seguridad razonable
            errors.amount = 'El monto excede el límite permitido para un solo abono.';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};
