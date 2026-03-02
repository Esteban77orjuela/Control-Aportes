import * as XLSX from 'xlsx';
// En Expo SDK 54, las funciones clásicas están en 'expo-file-system/legacy'
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getPeople, getPayments } from './storage';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';

// Polyfill necesario para que XLSX funcione en React Native
if (typeof global.Buffer === 'undefined') {
    (global as any).Buffer = Buffer;
}

/**
 * Exporta todos los pagos y miembros a un archivo Excel (.xlsx)
 * y abre el menú nativo para compartir (WhatsApp, correo, etc.)
 */
export const exportToExcel = async () => {
    try {
        console.log('--- Iniciando exportación a Excel ---');

        // 1. Obtener datos de Supabase
        const [people, payments] = await Promise.all([getPeople(), getPayments()]);
        console.log(`Datos obtenidos: ${people.length} miembros, ${payments.length} pagos.`);

        if (payments.length === 0) {
            Alert.alert("Sin datos", "No hay aportes registrados para exportar.");
            return;
        }

        // 2. Preparar datos para Excel
        const nameMap = people.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {} as Record<string, string>);

        const exportData = payments.map(p => ({
            'Miembro': nameMap[p.personId] || 'Miembro Eliminado',
            'Monto': p.amount,
            'Fecha': p.date,
            'Mes': getMonthName(p.month),
            'Año': p.year,
            'ID Pago': p.id
        }));

        // 3. Crear libro de Excel
        console.log('Creando libro de Excel...');
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Aportes");

        // 4. Generar archivo en base64
        console.log('Generando archivo binario (base64)...');
        const wbout = XLSX.write(wb, {
            type: 'base64',
            bookType: 'xlsx'
        });

        if (!wbout) {
            throw new Error('La generación del archivo Excel falló (output vacío).');
        }

        // 5. Guardar en el sistema de archivos del celular
        const fileName = `Reporte_Aportes_${new Date().toISOString().split('T')[0]}.xlsx`;
        const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

        if (!baseDir) {
            throw new Error('No se pudo determinar un directorio válido para guardar el archivo.');
        }

        const fileUri = `${baseDir}${fileName}`;
        console.log('Guardando archivo en:', fileUri);

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64
        });

        // 6. Compartir el archivo
        console.log('Intentando compartir archivo...');
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Exportar Reporte de Aportes',
                UTI: 'com.microsoft.excel.xlsx'
            });
            console.log('Menú de compartir abierto.');
        } else {
            console.warn('Sharing no disponible en este dispositivo/plataforma.');
            Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
        }

    } catch (error: any) {
        console.error("Error CRÍTICO al exportar Excel:", error);
        Alert.alert("Error de Exportación", `Detalle: ${error.message || JSON.stringify(error)}`);
    }
};

// Helper para convertir número de mes a nombre en español
const getMonthName = (month: number) => {
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return months[month] || "Desconocido";
};
