import * as XLSX from 'xlsx';
import { getPeople, getPayments } from './storage';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';
import { roundMoney } from './money';

// Polyfill necesario para que XLSX funcione en React Native
if (typeof global.Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

/**
 * Exporta todos los pagos y miembros a un archivo Excel (.xlsx)
 * y lo descarga desde el navegador (PWA).
 */
export const exportToExcel = async () => {
  try {
    console.log('--- Iniciando exportación a Excel ---');

    // 1. Obtener datos de Supabase
    const [people, payments] = await Promise.all([getPeople(), getPayments()]);
    console.log(`Datos obtenidos: ${people.length} miembros, ${payments.length} pagos.`);

    if (payments.length === 0) {
      Alert.alert('Sin datos', 'No hay aportes registrados para exportar.');
      return;
    }

    // 2. Preparar datos para Excel
    const nameMap = people.reduce(
      (acc, p) => {
        acc[p.id] = p.name;
        return acc;
      },
      {} as Record<string, string>
    );

    const exportData = payments.map(p => ({
      Miembro: nameMap[p.personId] || 'Miembro Eliminado',
      Monto: roundMoney(p.amount),
      Fecha: p.date.slice(0, 10),
      Mes: getMonthName(p.month),
      Año: p.year,
      'ID Pago': p.id,
    }));

    // 3. Crear libro de Excel
    console.log('Creando libro de Excel...');
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aportes');

    const fileName = `Reporte_Aportes_${new Date().toISOString().split('T')[0]}.xlsx`;

    // 4. En web: descargar el archivo directo desde el navegador (PWA)
    const wboutArr = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wboutArr], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Alert.alert('¡Exportado!', `${fileName} descargado.`);
  } catch (error: any) {
    console.error('Error CRÍTICO al exportar Excel:', error);
    Alert.alert('Error de Exportación', `Detalle: ${error.message || JSON.stringify(error)}`);
  }
};

// Helper para convertir número de mes a nombre en español
export const getMonthName = (month: number) => {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return months[month] || 'Desconocido';
};