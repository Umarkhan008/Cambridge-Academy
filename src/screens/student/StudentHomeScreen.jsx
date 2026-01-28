import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import { AuthContext } from '../../context/AuthContext';
import { SchoolContext } from '../../context/SchoolContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';

import { useNavigation } from '@react-navigation/native';

const StudentHomeScreen = () => {
    const { userInfo } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, students } = useContext(SchoolContext);
    const navigation = useNavigation();

    // Logic to find "Next Class"
    const currentStudent = students.find(s => s.name === userInfo?.name) || students[0];
    let nextClass = null;

    if (currentStudent?.assignedCourseId) {
        const course = courses.find(c => c.id === currentStudent.assignedCourseId);
        if (course) {
            nextClass = course;
        }
    }

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

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                }
            >
                {/* Modern Header Section */}
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <View style={styles.headerContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{t.hello}</Text>
                            <Text style={[styles.name, { color: theme.text }]}>{userInfo?.name || 'Student'}</Text>
                        </View>
                        <TouchableOpacity style={[styles.avatarContainer, { borderColor: COLORS.primary }]}>
                            {userInfo?.avatar ? (
                                <Image
                                    source={{ uri: userInfo.avatar }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: COLORS.primary }]}>
                                    <Text style={styles.avatarText}>
                                        {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'S'}
                                    </Text>
                                    {/* Geometric decoration for "random figure" feel */}
                                    <View style={[styles.avatarDecoration, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats Integrated in Header Area */}
                    <View style={styles.statsWrapper}>
                        <View style={[styles.statBox, { backgroundColor: COLORS.success + '15', flex: 1.2, marginRight: 8 }]}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.success }]}>
                                <Ionicons name="wallet-outline" size={14} color="white" />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.text, fontSize: 13 }]}>
                                    {(currentStudent?.balance || 0).toLocaleString('uz-UZ').replace(/,/g, ' ')}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: 10 }]}>{t.balance}</Text>
                            </View>
                        </View>

                        <View style={[styles.statBox, { backgroundColor: COLORS.primary + '15', flex: 1 }]}>
                            <View style={[styles.statIconBadge, { backgroundColor: COLORS.primary }]}>
                                <Ionicons name="checkmark-sharp" size={14} color="white" />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.text, fontSize: 16 }]}>92%</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: 10 }]}>{t.attendance}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[globalStyles.screenPadding, { paddingTop: 20 }]}>

                    {/* New "Overview" Card instead of Next Class */}
                    <Text style={[globalStyles.title, { color: theme.text, marginBottom: 15 }]}>{t.overview}</Text>

                    {/* Financial & Course Status Card */}
                    <View style={[styles.overviewCard, globalStyles.shadow, { backgroundColor: COLORS.primary }]}>
                        <View style={styles.overviewHeader}>
                            <View>
                                <Text style={styles.overviewLabel}>{t.myCourses}</Text>
                                <Text style={styles.overviewValue}>{nextClass ? nextClass.title : (currentStudent?.course || t.noCourseAssigned)}</Text>
                            </View>
                            <View style={styles.statusChip}>
                                <Text style={styles.statusChipText}>{currentStudent?.status || t.pending}</Text>
                            </View>
                        </View>

                        <View style={styles.overviewDivider} />

                        <View style={styles.overviewRow}>
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewItemLabel}>{t.balance}</Text>
                                <Text style={styles.overviewItemValue}>
                                    {(currentStudent?.balance || 0).toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm
                                </Text>
                            </View>
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewItemLabel}>{t.monthly}</Text>
                                <Text style={styles.overviewItemValue}>{nextClass?.price ? nextClass.price.replace('$', '') + " so'm" : '0 so\'m'}</Text>
                            </View>
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewItemLabel}>{t.lessons}</Text>
                                <Text style={styles.overviewItemValue}>24</Text>
                            </View>
                        </View>

                        {/* Circular Decorative elements */}
                        <View style={styles.circle1} />
                        <View style={styles.circle2} />
                    </View>

                    {/* Quick Actions Grid */}
                    <Text style={[globalStyles.title, { color: theme.text, marginTop: 25, marginBottom: 15 }]}>{t.quickActions}</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('Schedule')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="calendar" size={24} color="#1565C0" />
                            </View>
                            <Text style={[styles.actionText, { color: theme.text }]}>{t.schedule}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('MyCourses')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="book" size={24} color="#2E7D32" />
                            </View>
                            <Text style={[styles.actionText, { color: theme.text }]}>{t.classes}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('Payments')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                                <Ionicons name="wallet" size={24} color="#EF6C00" />
                            </View>
                            <Text style={[styles.actionText, { color: theme.text }]}>{t.payments}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Announcements - Redesigned */}
                    <Text style={[globalStyles.title, { color: theme.text, marginTop: 25 }]}>{t.announcements}</Text>
                    <View style={[styles.announcementCardNew, globalStyles.shadow, { backgroundColor: theme.surface }]}>
                        <View style={[styles.announcementIconBox, { backgroundColor: '#FFEBEE' }]}>
                            <Ionicons name="notifications" size={24} color="#D32F2F" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.announcementTitleNew, { color: theme.text }]}>{t.systemUpdate}</Text>
                            <Text style={[styles.announcementTextNew, { color: theme.textSecondary }]} numberOfLines={2}>
                                {t.systemMaintenanceMsg}
                            </Text>
                            <Text style={[styles.announcementTimeNew, { color: theme.textLight }]}>{t.justNow}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: SIZES.padding * 1.5,
        paddingBottom: SIZES.padding,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 10
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        marginBottom: 20
    },
    greeting: {
        ...FONTS.h4,
        fontWeight: '500',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4
    },
    avatarContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        padding: 3,
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 27,
    },
    placeholderAvatar: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        zIndex: 2,
    },
    avatarDecoration: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 40,
        height: 40,
        borderRadius: 20,
        zIndex: 1,
    },
    statsWrapper: {
        flexDirection: 'row',
        marginHorizontal: SIZES.padding,
        paddingVertical: 15,
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
    },
    statDivider: {
        width: 1,
        height: '80%',
        marginHorizontal: 10
    },
    statIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500'
    },
    overviewCard: {
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden'
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    overviewLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500'
    },
    overviewValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    statusChip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    statusChipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    overviewDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20
    },
    overviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    overviewItem: {
        alignItems: 'flex-start'
    },
    overviewItemLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4
    },
    overviewItemValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    circle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    circle2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // Minimal shadow for clean look
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600'
    },
    announcementCardNew: {
        padding: 16,
        marginTop: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    announcementIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15
    },
    announcementTitleNew: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    announcementTextNew: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6
    },
    announcementTimeNew: {
        fontSize: 11
    }
});


export default StudentHomeScreen;
