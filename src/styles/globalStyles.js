import { StyleSheet, Platform } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        ...Platform.select({
            web: {
                display: 'flex',
                height: '100%',
                overflow: 'hidden',
            }
        })
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.padding * 0.75,
        marginBottom: SIZES.base * 2,
        ...Platform.select({
            ios: {
                shadowColor: '#a0a0a0',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1, // Softer
                shadowRadius: 20, // Diffused
            },
            android: {
                elevation: 4, // Slightly cleaner elevation
                shadowColor: '#a0a0a0', // Attempt to tint shadow on modern Android
            },
        }),
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#888',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 25,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    title: {
        ...FONTS.h2,
        color: COLORS.text,
        marginBottom: SIZES.base,
    },
    subtitle: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
    },
    input: {
        height: 54,
        backgroundColor: '#F5F6FA', // Light Gray background
        borderWidth: 1,
        borderColor: 'transparent', // No border by default
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        marginBottom: SIZES.base * 2,
        color: COLORS.text,
        ...FONTS.body3,
    },
    button: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        ...FONTS.h3,
        color: COLORS.surface,
    },
    screenPadding: {
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding,
        paddingBottom: SIZES.padding * 2,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    }
});

export default globalStyles;
