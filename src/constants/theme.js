export const COLORS = {
    // W3CRM Vibrant Palette
    primary: '#FF6D4D', // Vibrant Coral Red
    primaryLight: '#FF8F75',
    primaryDark: '#D94A2B',

    secondary: '#D08AE1', // Soft Purple (Accent)
    secondaryLight: '#E8B6F3',

    white: '#FFFFFF',
    black: '#000000',

    accent: '#2BC155', // Fresh Green
    danger: '#FF4C4C', // Bright Red
    warning: '#FFBC11', // Sunny Yellow
    success: '#2BC155', // Fresh Green
    info: '#3F8CFF', // Bright Blue

    background: '#FAFBFC', // Very subtle cool gray (almost white)
    surface: '#FFFFFF',

    // Modern Text Colors
    text: '#3E4954', // Dark Blue-Gray
    textSecondary: '#888888', // Soft Gray
    textLight: '#B0B0B0',

    border: '#EEEEEE', // Very light border

    // Professional Dark Mode Palette
    dark: {
        background: '#0F1218',
        surface: '#161B22',
        surfaceLight: '#1C2128',
        text: '#E6E8EB',
        textSecondary: '#9AA4B2',
        textLight: '#6E7681',
        border: '#21262D',
        borderLight: '#30363D',
        primary: '#FF8F75', // Softer primary for dark mode
        accent: '#3FB950', // Softer green for dark mode
        card: '#161B22',
        shadow: 'rgba(0, 0, 0, 0.4)',
    }
};

export const SIZES = {
    // Global sizes
    base: 8,
    font: 14,
    radius: 16, // Softer curves (increased from 12)
    padding: 24,

    // Font sizes
    h1: 30,
    h2: 22,
    h3: 16,
    h4: 14,
    body1: 30,
    body2: 22,
    body3: 16,
    body4: 14,
    small: 12,

    // App dimensions
    width: null, // Set at runtime
    height: null // Set at runtime
};

export const FONTS = {
    h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
    h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
    h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 22, fontWeight: 'bold' },
    h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 22, fontWeight: 'bold' },
    body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 36 },
    body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 30 },
    body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 22 },
    body4: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 22 },
    small: { fontFamily: 'System', fontSize: SIZES.small, lineHeight: 18 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
