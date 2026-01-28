import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Input = ({ label, icon, error, ...props }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[styles.inputContainer, error && styles.inputError]}>
                {icon && (
                    <Ionicons name={icon} size={20} color={COLORS.textLight} style={styles.icon} />
                )}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.textLight}
                    cursorColor={COLORS.primary}
                    {...props}
                />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.base * 2,
    },
    label: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding * 0.5,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    icon: {
        marginRight: SIZES.base,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.text,
        ...FONTS.body3,
    },
    errorText: {
        ...FONTS.small,
        color: COLORS.danger,
        marginTop: 4,
    },
});

export default Input;
