import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un UUID v4 válido para ser usado como ID en la base de datos (Postgres UUID type).
 */
export const generateUUID = (): string => {
    return uuidv4();
};
