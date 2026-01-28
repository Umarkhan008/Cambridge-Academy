import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <View style={[globalStyles.card, globalStyles.shadow, styles.container, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
                <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>

                {trend && (
                    <View style={styles.trendContainer}>
                        <Ionicons
                            name={trend === 'up' ? 'trending-up' : 'trending-down'}
                            size={14}
                            color={trend === 'up' ? COLORS.success : COLORS.danger}
                        />
                        <Text style={[
                            styles.trendText,
                            { color: trend === 'up' ? COLORS.success : COLORS.danger }
                        ]}>
                            {trendValue}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20, // Increased padding
        marginBottom: SIZES.base * 2,
        borderRadius: 20, // Rounded Card
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18, // Soft Square
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
        opacity: 0.8
    },
    value: {
        fontSize: 24, // Larger Value
        fontWeight: 'bold',
        marginBottom: 2,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2
    },
    trendText: {
        ...FONTS.small,
        marginLeft: 6,
        fontWeight: '700',
    }
});

export default StatCard;
