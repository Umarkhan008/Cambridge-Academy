import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import Chart from '../components/Chart';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const TransactionItem = ({ item, onLongPress }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    return (
        <TouchableOpacity
            style={[styles.transactionItem, globalStyles.shadow, { backgroundColor: theme.surface }]}
            onLongPress={() => onLongPress(item)}
            delayLongPress={500}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, {
                backgroundColor: item.type === 'income' ? COLORS.success + '20' : COLORS.danger + '20'
            }]}>
                <Ionicons
                    name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={item.type === 'income' ? COLORS.success : COLORS.danger}
                />
            </View>

            <View style={styles.transactionContent}>
                <Text style={[styles.transactionTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.transactionDate, { color: theme.textLight }]}>{item.date}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: item.type === 'income' ? COLORS.success : theme.text }]}>
                    {item.amount}
                </Text>
                <Text style={[styles.status, { color: theme.textSecondary }]}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );
};

const FinanceScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { finance, addTransaction, deleteTransaction, revenueData, getTotalRevenue } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('income'); // income | expense

    const handleAddTransaction = async () => {
        if (!title || !amount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newTransaction = {
            title,
            amount: type === 'income' ? `+$${amount}` : `-$${amount}`,
            status: 'Completed',
            type: type,
            date: new Date().toISOString().split('T')[0]
        };

        showLoader(t.saving || 'Saqlanmoqda...');
        try {
            await addTransaction(newTransaction);
            setModalVisible(false);
            setTitle('');
            setAmount('');
            setType('income');
        } finally {
            hideLoader();
        }
    };

    const handleDeleteTransaction = (item) => {
        Alert.alert(
            t.deleteTransaction || "Delete Transaction",
            `${t.deleteConfirmMsg || 'Haqiqatan ham o\'chirmoqchimisiz?'} "${item.title}"?`,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.delete || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader(t.deleting || 'O\'chirilmoqda...');
                        try {
                            await deleteTransaction(item.id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    // --- Web Specific Components ---
    const WebSummaryCard = ({ title, value, trend, icon, color }) => (
        <View style={[styles.webSummaryCard, { backgroundColor: theme.surface, shadowColor: theme.text }]}>
            <View style={[styles.webSummaryIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.webSummaryTitle, { color: theme.textSecondary }]}>{title}</Text>
                <Text style={[styles.webSummaryValue, { color: theme.text }]}>{value}</Text>
                {trend && <Text style={[styles.webSummaryTrend, { color: COLORS.success }]}>{trend}</Text>}
            </View>
        </View>
    );

    const WebFinanceTable = () => (
        <View style={[styles.webTableContainer, { backgroundColor: theme.surface, borderColor: theme.border, flex: 1 }]}>
            {/* Header */}
            <View style={[styles.webTableHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.webTh, { flex: 0.5, color: theme.textSecondary }]}>#</Text>
                <Text style={[styles.webTh, { flex: 2, color: theme.textSecondary }]}>Title</Text>
                <Text style={[styles.webTh, { flex: 1.5, color: theme.textSecondary }]}>Date</Text>
                <Text style={[styles.webTh, { flex: 1.5, color: theme.textSecondary }]}>Amount</Text>
                <Text style={[styles.webTh, { flex: 1, color: theme.textSecondary }]}>Type</Text>
                <Text style={[styles.webTh, { flex: 1, color: theme.textSecondary }]}>Status</Text>
                <Text style={[styles.webTh, { flex: 1, color: theme.textSecondary, textAlign: 'right' }]}>Actions</Text>
            </View>

            <ScrollView style={{ flex: 1 }}>
                {finance.map((item, index) => (
                    <View key={item.id} style={[styles.webTableRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.webTd, { flex: 0.5, color: theme.textLight }]}>{index + 1}</Text>
                        <View style={[styles.webTd, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                            {/* Mock Avatar for context */}
                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: item.type === 'income' ? COLORS.primary : COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.title.charAt(0)}</Text>
                            </View>
                            <Text style={{ color: theme.text, fontWeight: '500' }}>{item.title}</Text>
                        </View>
                        <Text style={[styles.webTd, { flex: 1.5, color: theme.textSecondary }]}>{item.date || 'N/A'}</Text>
                        <Text style={[styles.webTd, { flex: 1.5, color: item.type === 'income' ? COLORS.success : COLORS.danger, fontWeight: 'bold' }]}>
                            {item.amount}
                        </Text>
                        <View style={[styles.webTd, { flex: 1 }]}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: item.type === 'income' ? COLORS.success + '20' : COLORS.danger + '20', alignSelf: 'flex-start' }}>
                                <Text style={{ fontSize: 12, color: item.type === 'income' ? COLORS.success : COLORS.danger }}>{item.type}</Text>
                            </View>
                        </View>
                        <View style={[styles.webTd, { flex: 1 }]}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.info + '20', alignSelf: 'flex-start' }}>
                                <Text style={{ fontSize: 12, color: COLORS.info }}>{item.status || 'Success'}</Text>
                            </View>
                        </View>
                        <View style={[styles.webTd, { flex: 1, alignItems: 'flex-end' }]}>
                            <TouchableOpacity onPress={() => handleDeleteTransaction(item)} style={{ padding: 8 }}>
                                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {!isWeb && (
                <Header
                    title={t.finance || "Finance"}
                    subtitle={t.revenueExpenses || "Revenue & Expenses"}
                    rightIcon="add"
                    onRightPress={() => setModalVisible(true)}
                    showBack={true}
                />
            )}

            {isWeb && (
                <View style={[styles.webHeader, { borderBottomColor: theme.border }]}>
                    <View>
                        <Text style={[globalStyles.h2, { color: theme.text }]}>{t.overview}</Text>
                        <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{t.financeSubtitle}</Text>
                    </View>
                    <TouchableOpacity
                        style={[globalStyles.button, { paddingHorizontal: 20 }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={globalStyles.buttonText}>+ {t.addTransaction}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ flex: 1 }}>
                {isWeb ? (
                    <View style={[globalStyles.screenPadding, { flex: 1, maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
                            <WebSummaryCard
                                title={t.totalRevenue}
                                value={getTotalRevenue()}
                                trend="+12.5%"
                                icon="wallet"
                                color={COLORS.success}
                            />
                            <WebSummaryCard
                                title={t.pendingPayments}
                                value="$1,250"
                                trend="8 Students"
                                icon="time"
                                color={COLORS.warning}
                            />
                            <WebSummaryCard
                                title={t.totalExpenses}
                                value="$3,400"
                                trend="-2.4%"
                                icon="trending-down"
                                color={COLORS.danger}
                            />
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={[globalStyles.title, { color: theme.text }]}>{t.recentTransactions || "Recent Transactions"}</Text>
                        </View>

                        <WebFinanceTable />
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={globalStyles.screenPadding}>
                            <View style={[styles.summaryContainer, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                                <View style={globalStyles.rowBetween}>
                                    <View>
                                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{t.totalRevenue || "Total Revenue"}</Text>
                                        <Text style={[styles.totalAmount, { color: theme.text }]}>{getTotalRevenue()}</Text>
                                    </View>
                                    <View style={styles.growthBadge}>
                                        <Ionicons name="trending-up" size={16} color={COLORS.success} />
                                        <Text style={styles.growthText}>+12.5%</Text>
                                    </View>
                                </View>
                            </View>

                            <Chart
                                title={t.monthlyRevenue || t.totalRevenue}
                                data={revenueData}
                                type="bar"
                            />

                            <View style={styles.sectionHeader}>
                                <Text style={[globalStyles.title, { color: theme.text }]}>{t.recentActivities}</Text>
                                <Text style={styles.linkText} onPress={() => navigation.navigate('History')}>{t.seeAll}</Text>
                            </View>

                            {finance.map((item) => (
                                <TransactionItem
                                    key={item.id}
                                    item={item}
                                    onLongPress={handleDeleteTransaction}
                                />
                            ))}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Add Transaction Modal */}
            <Modal
                animationType={isWeb ? "fade" : "slide"}
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalOverlay, isWeb && styles.webModalOverlay]}
                >
                    <View style={[styles.modalView, { backgroundColor: theme.surface }, isWeb && styles.webModalView]}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.addTransaction}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.transactionTitle}</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder={t.transactionTitle}
                                placeholderTextColor={theme.textLight}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.amount} ($)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="500"
                                placeholderTextColor={theme.textLight}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.type}</Text>
                            <View style={globalStyles.row}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        type === 'income' ? { backgroundColor: COLORS.success, borderColor: COLORS.success } : { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('income')}
                                >
                                    <Text style={{ color: type === 'income' ? COLORS.white : theme.text }}>{t.income}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeOption,
                                        type === 'expense' ? { backgroundColor: COLORS.danger, borderColor: COLORS.danger } : { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('expense')}
                                >
                                    <Text style={{ color: type === 'expense' ? COLORS.white : theme.text }}>{t.expense}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
                            <Text style={styles.submitBtnText}>{t.saveChanges}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    webHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 20,
        borderBottomWidth: 1
    },
    webSummaryCard: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    webSummaryIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    webSummaryTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4
    },
    webSummaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2
    },
    webSummaryTrend: {
        fontSize: 12,
        fontWeight: '600'
    },

    // Web Table Styles
    webTableContainer: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden'
    },
    webTableHeader: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    webTableRow: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        alignItems: 'center'
    },
    webTh: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    webTd: {
        fontSize: 14,
    },

    scrollContent: {
        paddingBottom: 100
    },
    summaryContainer: {
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.base * 2,
    },
    totalLabel: {
        ...FONTS.body4,
        marginBottom: 4,
    },
    totalAmount: {
        ...FONTS.h1,
    },
    growthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    growthText: {
        ...FONTS.body4,
        color: COLORS.success,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.base,
        marginTop: SIZES.base,
    },
    linkText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding * 0.75,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.base,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 1.5,
    },
    transactionContent: {
        flex: 1,
    },
    transactionTitle: {
        ...FONTS.body3,
        marginBottom: 2,
        fontWeight: '500',
    },
    transactionDate: {
        ...FONTS.small,
    },
    amount: {
        ...FONTS.h4,
        marginBottom: 2,
    },
    status: {
        ...FONTS.small,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    webModalOverlay: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalView: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SIZES.padding,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    webModalView: {
        borderRadius: 20,
        width: 450
    },
    modalTitle: {
        ...FONTS.h3,
        marginBottom: SIZES.padding
    },
    inputContainer: {
        marginBottom: SIZES.padding
    },
    label: {
        ...FONTS.body4,
        marginBottom: 8
    },
    input: {
        height: 50,
        borderRadius: SIZES.radius,
        paddingHorizontal: 15,
        borderWidth: 1,
        ...FONTS.body3
    },
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 4
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.base
    },
    submitBtnText: {
        color: COLORS.white,
        ...FONTS.h3
    }
});

export default FinanceScreen;
