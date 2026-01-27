
export const theme = {
    colors: {
        primary: '#4F46E5', // Indigo 600 - Modern, Trustworthy
        secondary: '#10B981', // Emerald 500 - Growth, Generosity (Green)
        accent: '#F59E0B', // Amber 500 - Highlight
        background: '#F9FAFB', // Gray 50 - Clean background
        surface: '#FFFFFF', // White - Cards
        text: '#111827', // Gray 900 - High contrast text
        textSecondary: '#6B7280', // Gray 500 - Subtext
        error: '#EF4444', // Red 500
        success: '#10B981',
        border: '#E5E7EB', // Gray 200
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 16,
        xl: 24,
    },
    shadows: {
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        card: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 5,
        }
    },
    typography: {
        header: {
            fontSize: 24,
            fontWeight: '700' as '700',
            color: '#111827',
        },
        subHeader: {
            fontSize: 18,
            fontWeight: '600' as '600',
            color: '#374151',
        },
        body: {
            fontSize: 16,
            color: '#4B5563',
        },
        caption: {
            fontSize: 14,
            color: '#6B7280',
        }
    }
};
