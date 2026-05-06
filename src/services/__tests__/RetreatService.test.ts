import { RetreatService } from '../RetreatService';

/**
 * Ejemplo de Pruebas Unitarias (SDLC Profesional)
 * En una arquitectura limpia, la lógica de negocio se prueba independientemente de la UI.
 */
describe('RetreatService - Lógica de Negocio', () => {
    
    test('Detección automática de género (Heurística)', () => {
        expect(RetreatService.guessGender('María Paula')).toBe('female');
        expect(RetreatService.guessGender('Juan José')).toBe('male');
        expect(RetreatService.guessGender('Andrea')).toBe('male'); // Excepción
    });

    test('Cálculo de edad preciso', () => {
        const birthDate = '2000-01-01';
        // Asumiendo que hoy es 2024
        const age = RetreatService.calculateAge(birthDate);
        expect(age).toBeGreaterThan(20);
    });

    test('Identificación de cumpleaños semanal', () => {
        // Obtenemos una fecha de hace unos días pero con el mes/día actual
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 2);
        
        const birthDateStr = `1995-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
        
        expect(RetreatService.isBirthdayThisWeek(birthDateStr)).toBe(true);
    });
});
