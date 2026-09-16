import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

/**
 * StorageRepository - Capa de Infraestructura para Archivos
 * Maneja la subida segura de firmas y documentos a Supabase Storage (Fase 5)
 */
export const StorageRepository = {
    /**
     * Sube una firma en Base64 a Supabase Storage y retorna la ruta
     */
    uploadSignature: async (base64Data: string, pathPrefix: string = 'retreat'): Promise<string> => {
        try {
            // Eliminar el prefijo data URI si existe
            const base64Str = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
            
            // Convertir a ArrayBuffer usando base64-arraybuffer (muy eficiente en React Native)
            const fileData = decode(base64Str);
            
            // Generar nombre de archivo único
            const fileName = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
            
            const { data, error } = await supabase.storage
                .from('signatures')
                .upload(fileName, fileData, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (error) throw error;
            
            return data.path;
        } catch (e) {
            console.error('Error uploading signature to Storage:', e);
            throw new Error('No se pudo subir la firma al servidor de almacenamiento.');
        }
    },

    /**
     * Obtiene la URL pública de una firma
     */
    getSignatureUrl: (path: string): string => {
        if (!path) return '';
        const { data } = supabase.storage.from('signatures').getPublicUrl(path);
        return data.publicUrl;
    }
};
