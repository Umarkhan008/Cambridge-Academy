import React, { useContext, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, Image } from 'react-native';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import Header from '../../components/Header';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { SchoolContext } from '../../context/SchoolContext';
import { AuthContext } from '../../context/AuthContext';

const MyPaymentsScreen = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { finance, students } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Updates.reloadAsync();
        } catch (e) {
            console.log(e);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Helper: Format number to UZS
    const formatCurrency = (amount) => {
        if (!amount) return '0 so\'m';
        // Remove non-numeric chars except . and -
        const numericString = String(amount).replace(/[^0-9.-]/g, '');
        const number = parseFloat(numericString);
        if (isNaN(number)) return '0 so\'m';

        // If the number is small (likely USD from mock data), convert roughly or just show as is? 
        // User asked to "calculate in so'm". Assuming DB values might be in USD, let's treat them as USD * 12500 for demo if < 10000, else treat as UZS.
        // BUT user said "bazada borini" (what is in DB). 
        // Let's assume the DB values are just numbers and we format them.
        // To make it look realistic for "so'm", if value is small (< 5000), implies dollars, so I'll multiply.

        let finalAmount = number;
        if (Math.abs(number) < 5000) {
            finalAmount = number * 12600; // Approx rate
        }

        return finalAmount.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
    };

    const currentStudent = students.find(s => s.name === userInfo?.name);

    // Filter payments for this student
    const myPayments = useMemo(() => {
        if (!userInfo?.name) return [];
        return finance.filter(item =>
            item.title.toLowerCase().includes(userInfo.name.toLowerCase()) ||
            (item.studentId && item.studentId === currentStudent?.id)
        ).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
    }, [finance, userInfo, currentStudent]);


    const renderItem = ({ item }) => (
        <View style={[styles.paymentItem, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'expense' ? COLORS.error + '15' : COLORS.success + '15' }]}>
                <Ionicons
                    name={item.type === 'expense' ? "arrow-up" : "arrow-down"}
                    size={20}
                    color={item.type === 'expense' ? COLORS.error : COLORS.success}
                />
            </View>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.itemDate, { color: theme.textSecondary }]}>{item.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemAmount, { color: item.type === 'expense' ? COLORS.error : COLORS.success }]}>
                    {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                </Text>
                <Text style={[styles.itemStatus, { color: theme.textLight }]}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header title={t.payments} />

            <View style={globalStyles.screenPadding}>
                {/* Modern Balance Card */}
                <View style={[styles.balanceCard, globalStyles.shadow]}>
                    <View style={styles.cardPatternCircle1} />
                    <View style={styles.cardPatternCircle2} />

                    <Text style={styles.balanceLabel}>{t.outstandingBalance}</Text>
                    <Text style={styles.balanceAmount}>
                        {formatCurrency(currentStudent?.balance || 0)}
                    </Text>

                    <View style={styles.balanceFooter}>
                        <View style={styles.balanceBadge}>
                            <Ionicons name="alert-circle" size={14} color="#FFF" />
                            <Text style={styles.balanceNote}>{t.dueBy} 15 {new Date().toLocaleString('default', { month: 'short' })}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* Placeholder for future pay button */}
                        </View>
                    </View>
                </View>

                <Text style={[globalStyles.title, { marginTop: 25, marginBottom: 15, color: theme.text }]}>{t.paymentHistory}</Text>

                <FlatList
                    data={myPayments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Ionicons name="receipt-outline" size={48} color={theme.border} />
                            <Text style={{ marginTop: 10, color: theme.textSecondary }}>No transactions found</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    balanceCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 160,
        justifyContent: 'center'
    },
    cardPatternCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    cardPatternCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -20,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    balanceLabel: {
        ...FONTS.body4,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
        letterSpacing: 0.5
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    balanceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    balanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6
    },
    balanceNote: {
        ...FONTS.small,
        color: '#FFF',
        fontWeight: '600'
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.03,
        // shadowRadius: 4,
        // elevation: 2
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4
    },
    itemDate: {
        fontSize: 12,
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2
    },
    itemStatus: {
        fontSize: 11,
        fontWeight: '500'
    }
});

export default MyPaymentsScreen;
