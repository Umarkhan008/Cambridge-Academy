import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Image,
    TouchableOpacity,
    useWindowDimensions,
    Animated,
    Easing,
    Platform,
    UIManager,
    Modal,
    FlatList,
    TextInput,
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useUI } from '../context/UIContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import DashboardDesktop from './DashboardDesktop';

import { SchoolContext } from '../context/SchoolContext';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { ThemeContext } from '../context/ThemeContext';
import globalStyles from '../styles/globalStyles';

// Premium Design Tokens are now handled dynamically inside the component

// ==================== PREMIUM DESIGN TOKENS ====================
// These are now handled dynamically inside the component
const getDesignTokens = (theme, isDarkMode) => ({
    colors: {
        // Gradient pairs
        primaryGradient: isDarkMode ? ['#4F46E5', '#3730A3'] : ['#667eea', '#764ba2'],
        secondaryGradient: isDarkMode ? ['#A855F7', '#7E22CE'] : ['#f093fb', '#f5576c'],
        accentGradient: isDarkMode ? ['#3B82F6', '#1D4ED8'] : ['#4facfe', '#00f2fe'],
        orangeGradient: isDarkMode ? ['#F59E0B', '#D97706'] : ['#fa709a', '#fee140'],
        purpleGradient: ['#a18cd1', '#fbc2eb'],
        successGradient: isDarkMode ? ['#059669', '#064E3B'] : ['#11998e', '#38ef7d'],
        warmGradient: isDarkMode ? ['#EF4444', '#991B1B'] : ['#FF6B6B', '#FF8E53'],

        // Base colors
        background: isDarkMode ? '#0F1117' : theme.background,
        surface: isDarkMode ? '#1E2330' : theme.surface,
        surfaceLight: isDarkMode ? '#242B3D' : (theme.surfaceLight || '#F4F6FA'),

        // Text
        textPrimary: theme.text,
        textSecondary: isDarkMode ? '#A0AEC0' : theme.textSecondary,
        textLight: isDarkMode ? '#718096' : (theme.textLight || '#9CA3AF'),
        textOnDark: '#FFFFFF',

        // Accent
        accent: theme.primary,
        accentLight: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(118, 75, 162, 0.1)',

        // Status
        live: '#FF3B30',
        success: '#10B981',
        warning: '#F59E0B',

        // Glass effect
        glass: isDarkMode ? 'rgba(30, 35, 48, 0.9)' : 'rgba(255, 255, 255, 0.85)',
        glassBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',

        // Shadows
        shadowLight: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(103, 126, 234, 0.08)',
        shadowMedium: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(103, 126, 234, 0.15)',
        shadowDark: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(26, 29, 41, 0.12)',
    },
    spacing: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
    },
    radius: {
        sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, full: 999,
    },
    typography: {
        displayLarge: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
        displayMedium: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
        headlineLarge: { fontSize: 22, fontWeight: '700', letterSpacing: 0 },
        headlineMedium: { fontSize: 18, fontWeight: '600', letterSpacing: 0.1 },
        titleLarge: { fontSize: 16, fontWeight: '600', letterSpacing: 0.15 },
        titleMedium: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
        bodyLarge: { fontSize: 16, fontWeight: '400', letterSpacing: 0.15 },
        bodyMedium: { fontSize: 14, fontWeight: '400', letterSpacing: 0.25 },
        bodySmall: { fontSize: 12, fontWeight: '400', letterSpacing: 0.4 },
        labelLarge: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
        labelMedium: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
        labelSmall: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
    }
});

const DashboardMobile = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const {
        courses,
        students,
        recentActivities,
        attendance,
        processDailyDeductions,
        addTransaction,
        updateStudent
    } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { showLoader, hideLoader } = useUI();

    const DESIGN = useMemo(() => getDesignTokens(theme, isDarkMode), [theme, isDarkMode]);
    const styles = useMemo(() => getStyles(DESIGN, isDarkMode, theme), [DESIGN, isDarkMode, theme]);

    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activitiesVisible, setActivitiesVisible] = useState(false);

    // Quick Payment State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paySearch, setPaySearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [payAmount, setPayAmount] = useState('');

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const searchedStudents = useMemo(() => {
        if (!paySearch.trim()) return [];
        return students.filter(s =>
            s.name.toLowerCase().includes(paySearch.toLowerCase()) ||
            (s.phone && s.phone.includes(paySearch))
        ).slice(0, 5);
    }, [students, paySearch]);

    const handleQuickPayment = async () => {
        if (!selectedStudent || !payAmount) {
            Alert.alert('Xatolik', 'Talaba va summani kiriting');
            return;
        }

        const amount = parseFloat(payAmount.replace(/[^\d]/g, ''));
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Xatolik', 'To\'g\'ri summa kiriting');
            return;
        }

        try {
            showLoader('To\'lov amalga oshirilmoqda...');

            // 1. Add Transaction
            await addTransaction({
                title: 'Tezkor to\'lov',
                amount: amount.toString(),
                type: 'Income',
                category: 'O' + '\'' + 'quv haqi',
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                date: new Date().toLocaleDateString()
            });

            // 2. Update Student Balance
            const newBalance = (selectedStudent.balance || 0) + amount;
            await updateStudent(selectedStudent.id, { balance: newBalance });

            Alert.alert('Muvaffaqiyatli', `${selectedStudent.name} uchun ${amount.toLocaleString()} UZS qabul qilindi`);
            setPaymentModalVisible(false);
            setPaySearch('');
            setSelectedStudent(null);
            setPayAmount('');
        } catch (error) {
            console.error(error);
            Alert.alert('Xatolik', 'To\'lovni saqlashda xatolik yuz berdi');
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        // Run auto-deduction check on mount and periodically
        processDailyDeductions();

        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            // Check for new deductions every minute as time progresses
            processDailyDeductions();
        }, 60000);

        // Pulse animation for LIVE badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 800,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();

        // Entry animations
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        return () => clearInterval(timer);
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // --- SYSTEM LOGIC (preserved from original) ---

    const isCourseToday = (course) => {
        if (!course || !course.days) return false;

        const now = currentTime;
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = daysOfWeek[now.getDay()];

        // Uzbek day type logic
        const courseDaysStr = (course.days || '').toString().toUpperCase();

        // 1. Check for DCHJ (Mon, Wed, Fri)
        if (courseDaysStr.includes('DCHJ')) {
            const isDCHJ = [1, 3, 5].includes(now.getDay());
            if (isDCHJ) return true;
        }

        // 2. Check for SPSH (Tue, Thu, Sat)
        if (courseDaysStr.includes('SPSH')) {
            const isSPSH = [2, 4, 6].includes(now.getDay());
            if (isSPSH) return true;
        }

        // 3. General day matching
        const aliases = {
            'Monday': ['Mon', 'Du', 'Dushanba', 'D'],
            'Tuesday': ['Tue', 'Se', 'Seshanba', 'S'],
            'Wednesday': ['Wed', 'Chor', 'Chorshanba', 'Ch'],
            'Thursday': ['Thu', 'Pay', 'Payshanba', 'P'],
            'Friday': ['Fri', 'Jum', 'Juma', 'J'],
            'Saturday': ['Sat', 'Shan', 'Shanba', 'Sh'],
            'Sunday': ['Sun', 'Yak', 'Yakshanba', 'Y', 'Ya']
        };

        const todayAliases = (aliases[todayName] || []).map(a => a.toLowerCase());
        const courseDaysRaw = Array.isArray(course.days) ? course.days : (course.days || '').toString().split(/[,\s-/]+/);
        const courseDays = courseDaysRaw.map(d => d.trim().toLowerCase());

        return courseDays.some(d =>
            d.includes('daily') ||
            d.includes('har kuni') ||
            todayAliases.some(alias => d === alias || d.includes(alias))
        );
    };

    const getGroupStatus = (course) => {
        if (course.isPaused) return 'PAUSED';

        const now = currentTime;
        const currentHour = now.getHours() + now.getMinutes() / 60;

        const start = course.startDate ? new Date(course.startDate) : new Date(2020, 0, 1);
        const end = course.endDate ? new Date(course.endDate) : new Date(2030, 0, 1);

        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        if (todayDate < startDateOnly) return 'UPCOMING';
        if (todayDate > endDateOnly) return 'COMPLETED';

        const isToday = isCourseToday(course);

        if (isToday && course.time) {
            // Robust time parsing
            const timeStr = course.time.replace(/\s/g, ''); // Remove spaces
            const startMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);

            if (startMatch) {
                const startH = parseInt(startMatch[1]);
                const startM = parseInt(startMatch[2]);
                const startFloat = startH + startM / 60;

                let duration = 1.5;
                const endMatch = timeStr.match(/[-–—](\d{1,2}):(\d{2})$/); // Match end time after separator

                if (endMatch) {
                    const endH = parseInt(endMatch[1]);
                    const endM = parseInt(endMatch[2]);
                    const endFloat = endH + endM / 60;

                    if (currentHour >= startFloat && currentHour < endFloat) {
                        return 'LIVE';
                    } else if (currentHour < startFloat) {
                        return 'PENDING';
                    } else if (currentHour >= endFloat) {
                        return 'FINISHED';
                    }
                } else {
                    // Fallback to 1.5h duration if end time not found
                    const endFloat = startFloat + duration;
                    if (currentHour >= startFloat && currentHour < endFloat) {
                        return 'LIVE';
                    } else if (currentHour < startFloat) {
                        return 'PENDING';
                    } else if (currentHour >= endFloat) {
                        return 'FINISHED';
                    }
                }
            }
        }

        return 'ACTIVE';
    };

    const categorizedGroups = useMemo(() => {
        const live = [];
        const upcoming = [];
        const completed = [];
        const todaySchedule = [];
        const stats = {
            liveCount: 0,
            upcomingCount: 0,
            completedCount: 0,
            attendanceRate: 85
        };

        courses.forEach(c => {
            const status = getGroupStatus(c);
            const extendedCourse = { ...c, systemStatus: status };

            if (status === 'LIVE') {
                live.push(extendedCourse);
                stats.liveCount++;
            } else if (status === 'UPCOMING') {
                upcoming.push(extendedCourse);
                stats.upcomingCount++;
            } else if (status === 'COMPLETED') {
                completed.push(extendedCourse);
                stats.completedCount++;
            }

            const isToday = isCourseToday(c);
            if ((status === 'LIVE' || status === 'ACTIVE' || status === 'PENDING' || status === 'FINISHED') && isToday) {
                todaySchedule.push(extendedCourse);
            }
        });

        todaySchedule.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        return { live, upcoming, completed, todaySchedule, stats };
    }, [courses, currentTime]);

    const formatDaysShort = (daysString) => {
        if (!daysString) return '';
        const dayMap = {
            'dushanba': 'Du', 'seshanba': 'Se', 'chorshanba': 'Chor',
            'payshanba': 'Pay', 'juma': 'Jum', 'shanba': 'Shan', 'yakshanba': 'Yak',
            'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed',
            'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun',
            'du': 'Du', 'se': 'Se', 'chor': 'Chor', 'pay': 'Pay', 'jum': 'Jum', 'shan': 'Shan', 'yak': 'Yak'
        };
        const parts = daysString.toString().split(/[,\s-/]+/);
        const formatted = parts.map(d => {
            const lower = d.trim().toLowerCase();
            return dayMap[lower] || d;
        }).filter(d => d.length > 0);

        return formatted.join(' • ');
    };

    // ==================== PREMIUM UI COMPONENTS ====================

    const PremiumHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.profileSection}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.8}
            >
                <View style={styles.avatarWrapper}>
                    <Image
                        source={userInfo?.avatar ? { uri: userInfo.avatar } : { uri: 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                        style={styles.avatar}
                    />
                    <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.greeting}>{t.assalomuAlaykum || "Assalomu alaykum"} 👋</Text>
                    <Text style={styles.userName}>{userInfo?.name || t.user}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="search" size={22} color={DESIGN.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setActivitiesVisible(true)}
                >
                    <Ionicons name="notifications" size={22} color={DESIGN.colors.textPrimary} />
                    {recentActivities.length > 0 && (
                        <Animated.View style={[styles.notificationBadge, { opacity: pulseAnim }]} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const QuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                    if (width < 1280) {
                        navigation.navigate('More', { screen: 'Leads', params: { openAddModal: true } });
                    } else {
                        navigation.navigate('Leads', { openAddModal: true });
                    }
                }}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#6366f1', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                >
                    <View style={styles.quickActionIconBg}>
                        <Ionicons name="person-add" size={18} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>Lead qo'shish</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setPaymentModalVisible(true)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                >
                    <View style={styles.quickActionIconBg}>
                        <Ionicons name="card" size={18} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>To'lov qilish</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const StatCard = ({ gradient, icon, value, label, onPress, delay = 0 }) => {
        const cardScale = useRef(new Animated.Value(0.9)).current;
        const cardOpacity = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 400,
                    delay,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={styles.statCardWrapper}
            >
                <Animated.View style={[
                    styles.statCardContainer,
                    { transform: [{ scale: cardScale }], opacity: cardOpacity }
                ]}>
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGradient}
                    >
                        {/* Decorative circles */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />

                        <View style={styles.statIconWrapper}>
                            <View style={styles.statIconCircle}>
                                <Ionicons name={icon} size={20} color="rgba(255,255,255,0.95)" />
                            </View>
                        </View>

                        <Text style={styles.statValue}>{value}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const StatsSection = () => (
        <Animated.View
            style={[
                styles.statsSection,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
        >
            <Text style={styles.sectionTitle}>{t.bugungiStatistika || "Statistika"}</Text>
            <View style={styles.statsRow}>
                <StatCard
                    gradient={DESIGN.colors.primaryGradient}
                    icon="people"
                    value={students.length}
                    label="O'quvchilar"
                    onPress={() => navigation.navigate('Students')}
                    delay={0}
                />
                <StatCard
                    gradient={DESIGN.colors.warmGradient}
                    icon="warning"
                    value={students.filter(s => (s.balance || 0) <= 0).length}
                    label="Qarzdorlar"
                    onPress={() => navigation.navigate('Students')}
                    delay={100}
                />
                <StatCard
                    gradient={['#8B5CF6', '#A855F7']}
                    icon="layers"
                    value={courses.length}
                    label="Guruhlar"
                    onPress={() => navigation.navigate('Courses')}
                    delay={200}
                />
            </View>
        </Animated.View>
    );

    const LessonCard = ({ item, index }) => {
        const cardColors = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#fa709a', '#fee140'],
            ['#a18cd1', '#fbc2eb'],
        ];
        const gradient = cardColors[index % cardColors.length];
        const isLive = item.systemStatus === 'LIVE';
        const isPending = item.systemStatus === 'PENDING';
        const isFinished = item.systemStatus === 'FINISHED';

        const studentCount = students.filter(s => s.assignedCourseId === item.id).length;

        return (
            <TouchableOpacity
                style={styles.lessonCardWrapper}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(isLive ? 'Attendance' : 'CourseDetail', { course: item })}
            >
                <View style={styles.lessonCard}>
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.lessonCardGradient}
                    >
                        {/* Decorative shapes */}
                        <View style={styles.lessonDecorShape1} />
                        <View style={styles.lessonDecorShape2} />

                        {/* Content */}
                        <View style={styles.lessonContent}>
                            {/* Status Badges - Moved inside flow to prevent overlap */}
                            <View style={styles.lessonStatusContainerInline}>
                                {isLive && (
                                    <Animated.View style={[styles.liveBadge, { opacity: pulseAnim }]}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>LIVE • Dars bo'lmoqda</Text>
                                    </Animated.View>
                                )}
                                {isPending && (
                                    <View style={styles.pendingBadge}>
                                        <Ionicons name="time-outline" size={12} color="#FFF" />
                                        <Text style={styles.statusBadgeText}>KUTILMOQDA</Text>
                                    </View>
                                )}
                                {isFinished && (
                                    <View style={styles.finishedBadge}>
                                        <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.statusBadgeText}>TUGALLANGAN</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.lessonTitle} numberOfLines={2}>
                                {item.title}
                            </Text>

                            <View style={styles.lessonMeta}>
                                <View style={styles.lessonMetaItem}>
                                    <Ionicons name="person-circle" size={16} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.lessonMetaText}>
                                        {item.instructor || item.teacher}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.lessonFooter}>
                                <View style={styles.lessonStats}>
                                    <View style={styles.lessonStatItem}>
                                        <Ionicons name="people" size={14} color="rgba(255,255,255,0.85)" />
                                        <Text style={styles.lessonStatText}>{studentCount}</Text>
                                    </View>
                                    <View style={styles.lessonDivider} />
                                    <Text style={styles.lessonDaysText}>
                                        {formatDaysShort(item.days)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Arrow Button */}
                        <View style={styles.lessonArrowWrapper}>
                            <View style={[styles.lessonArrowButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)' }]}>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        );
    };

    const TodaysLessonsSection = () => {
        const { todaySchedule, live, upcoming } = categorizedGroups;
        const displayList = [...live, ...todaySchedule, ...upcoming];
        const uniqueDisplayList = [...new Map(displayList.map(item => [item.id, item])).values()];

        return (
            <View style={styles.lessonsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t.bugungiDarslar || "Bugungi darslar"}</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Schedule')}
                        style={styles.seeAllButton}
                    >
                        <Text style={styles.seeAllText}>{t.seeAll || "Barchasi"}</Text>
                        <Ionicons name="chevron-forward" size={16} color={DESIGN.colors.accent} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.lessonsScroll}
                    decelerationRate="fast"
                    snapToInterval={width * 0.55 + DESIGN.spacing.md}
                >
                    {uniqueDisplayList.length > 0 ? (
                        uniqueDisplayList.map((item, index) => (
                            <LessonCard key={item.id || index} item={item} index={index} />
                        ))
                    ) : (
                        <View style={styles.emptyLessons}>
                            <View style={styles.emptyIconWrapper}>
                                <Ionicons name="calendar-outline" size={40} color={DESIGN.colors.textLight} />
                            </View>
                            <Text style={styles.emptyTitle}>{t.noClassesToday || "Bugun darslar yo'q"}</Text>
                            <Text style={styles.emptySubtitle}>{t.enjoyYourWeekend || "Dam oling!"}</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const ActivityProgressCard = () => {
        const progressAnim = useRef(new Animated.Value(0)).current;

        // Calculate real attendance statistics based on groups
        const attendanceStats = useMemo(() => {
            const attendanceRecords = attendance || [];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Get day of week (0 = Sunday, 1 = Monday, etc.)
            const todayDayIndex = today.getDay();

            // Helper function to check if a course has class on a given day index
            const hasCourseOnDay = (course, dayIndex) => {
                if (!course.days) return false;
                const courseDays = course.days;

                // DCHJ = Dushanba(1), Chorshanba(3), Juma(5)
                // SPSH = Seshanba(2), Payshanba(4), Shanba(6)
                // Har kuni = every day

                if (courseDays === 'Har kuni' || courseDays === 'Daily' || courseDays.includes('Har kuni')) {
                    return true;
                }

                if (courseDays === 'DCHJ' || courseDays.includes('DCHJ')) {
                    return [1, 3, 5].includes(dayIndex); // Mon, Wed, Fri
                }

                if (courseDays === 'SPSH' || courseDays.includes('SPSH')) {
                    return [2, 4, 6].includes(dayIndex); // Tue, Thu, Sat
                }

                // Custom days format (Du, Chor, Jum, etc.)
                const dayMapping = {
                    0: ['Yak', 'Sun'],
                    1: ['Du', 'Dush', 'Mon'],
                    2: ['Se', 'Sesh', 'Tue'],
                    3: ['Chor', 'Wed'],
                    4: ['Pay', 'Pays', 'Thu'],
                    5: ['Jum', 'Fri'],
                    6: ['Sha', 'Shan', 'Sat']
                };

                return dayMapping[dayIndex]?.some(d => courseDays.includes(d)) || false;
            };

            // Find courses that have classes today
            const todaysCourses = courses.filter(course => hasCourseOnDay(course, todayDayIndex));

            // Count how many of today's courses have attendance records
            const coursesWithAttendance = todaysCourses.filter(course => {
                // Check if there's any attendance record for this course today
                return attendanceRecords.some(record =>
                    record.courseId === course.id && record.date === todayStr
                );
            });

            const todayTotal = todaysCourses.length;
            const todayCompleted = coursesWithAttendance.length;

            // Generate last 7 days statistics
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                last7Days.push(dateStr);
            }

            // Count attendance for each day (by unique courses that had attendance)
            const dailyStats = last7Days.map(date => {
                const dateObj = new Date(date);
                const dayIndex = dateObj.getDay();

                // Courses that should have had class on this day
                const scheduledCourses = courses.filter(course => hasCourseOnDay(course, dayIndex));

                // Courses that have attendance records for this day
                const completedCourses = new Set(
                    attendanceRecords
                        .filter(r => r.date === date)
                        .map(r => r.courseId)
                );

                const scheduled = scheduledCourses.length;
                const completed = completedCourses.size;
                const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

                return { date, completed, scheduled, rate };
            });

            // Calculate overall rate and today's rate
            const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

            // Calculate overall average for the last 7 days including today
            const totalScheduled = dailyStats.reduce((sum, d) => sum + d.scheduled, 0);
            const totalCompleted = dailyStats.reduce((sum, d) => sum + d.completed, 0);
            const weeklyAverage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

            // The main rate should focus on today if there are classes today, otherwise show weekly average
            const displayRate = todayTotal > 0 ? todayRate : weeklyAverage;

            return {
                dailyStats,
                overallRate: displayRate,
                todayRate,
                weeklyAverage,
                totalCompleted,
                totalScheduled,
                todayCompleted,
                todayTotal
            };
        }, [attendance, courses]);

        useEffect(() => {
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1500,
                delay: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        }, []);

        const progressWidth = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${attendanceStats.overallRate}%`],
        });

        // Generate attendance bars for the chart
        const generateChartPoints = () => {
            return attendanceStats.dailyStats.map((day, i) => {
                const height = day.rate > 0 ? (day.rate / 100) * 60 + 10 : 15;
                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.chartBar,
                            {
                                height,
                                opacity: progressAnim,
                                backgroundColor: day.rate >= 80 ? '#8B5CF6' : day.rate >= 50 ? '#F59E0B' : '#EF4444',
                                transform: [{
                                    scaleY: progressAnim
                                }]
                            }
                        ]}
                    />
                );
            });
        };

        return (
            <View style={styles.activityCard}>
                <LinearGradient
                    colors={isDarkMode ? ['#1E2330', '#1A2131'] : ['#1A1D29', '#2D3142']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activityCardGradient}
                >
                    {/* Decorative glow */}
                    <View style={styles.activityGlow} />

                    <View style={styles.activityHeader}>
                        <View>
                            <Text style={styles.activityTitle}>{t.attendanceStats || "Davomat statistikasi"}</Text>
                            <Text style={styles.activitySubtitle}>
                                {t.last7Days || "Oxirgi 7 kun"} • {attendanceStats.totalCompleted}/{attendanceStats.totalScheduled} guruh
                            </Text>
                        </View>
                        <View style={styles.activityPercentage}>
                            <Text style={styles.percentageValue}>{attendanceStats.overallRate}</Text>
                            <Text style={styles.percentageSymbol}>%</Text>
                        </View>
                    </View>

                    {/* Chart visualization */}
                    <View style={styles.chartContainer}>
                        {generateChartPoints()}
                    </View>

                    {/* Progress line */}
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                            <LinearGradient
                                colors={attendanceStats.overallRate >= 80
                                    ? ['#10B981', '#34D399', '#6EE7B7']
                                    : attendanceStats.overallRate >= 50
                                        ? ['#F59E0B', '#FBBF24', '#FCD34D']
                                        : ['#EF4444', '#F87171', '#FCA5A5']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.progressGradient}
                            />
                        </Animated.View>
                        <View style={styles.progressDot} />
                    </View>

                    <View style={styles.activityFooterStats}>
                        <View style={styles.activityStatItem}>
                            <Ionicons
                                name={attendanceStats.overallRate >= 80 ? "checkmark-circle" : "alert-circle"}
                                size={16}
                                color={attendanceStats.overallRate >= 80 ? "#10B981" : "#F59E0B"}
                            />
                            <Text style={styles.activityStatText}>
                                {attendanceStats.overallRate >= 80 ? "Yaxshi" : attendanceStats.overallRate >= 50 ? "O'rtacha" : "Past"}
                            </Text>
                        </View>
                        <View style={styles.activityStatItem}>
                            <Ionicons name="today" size={16} color="#8B5CF6" />
                            <Text style={styles.activityStatText}>
                                Bugun: {attendanceStats.todayCompleted}/{attendanceStats.todayTotal} guruh
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const ActivitiesModal = () => (
        <Modal
            visible={activitiesVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setActivitiesVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />

                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t.recentActivities || "So'nggi faolliklar"}</Text>
                        <TouchableOpacity
                            onPress={() => setActivitiesVisible(false)}
                            style={styles.modalCloseBtn}
                        >
                            <Ionicons name="close" size={24} color={DESIGN.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={recentActivities.slice(0, 10)}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <Animated.View
                                style={[
                                    styles.activityItem,
                                    { opacity: 1, transform: [{ translateX: 0 }] }
                                ]}
                            >
                                <LinearGradient
                                    colors={DESIGN.colors.primaryGradient}
                                    style={styles.activityItemIcon}
                                >
                                    <Ionicons name={item.icon || "flash"} size={18} color="white" />
                                </LinearGradient>
                                <View style={styles.activityItemInfo}>
                                    <Text style={styles.activityItemText}>{item.target || item.action}</Text>
                                    <View style={styles.activityItemFooter}>
                                        <Text style={styles.activityItemUser}>{item.name}</Text>
                                        <View style={styles.activityTimeDot} />
                                        <Text style={styles.activityItemTime}>{item.time}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyActivities}>
                                <Ionicons name="notifications-off-outline" size={48} color={DESIGN.colors.textLight} />
                                <Text style={styles.emptyActivitiesText}>{t.noActivities || "Faolliklar yo'q"}</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={DESIGN.colors.background} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={DESIGN.colors.accent}
                        colors={[DESIGN.colors.accent]}
                    />
                }
            >
                <PremiumHeader />
                <QuickActions />
                <StatsSection />
                <TodaysLessonsSection />

                <View style={styles.activitySection}>
                    <Text style={styles.sectionTitle}>{t.attendance || "Davomat"}</Text>
                    <ActivityProgressCard />
                </View>
            </ScrollView>

            <ActivitiesModal />

            {/* Quick Payment Modal */}
            <Modal
                visible={paymentModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.payModalContent}
                    >
                        <View style={styles.payModalHeader}>
                            <Text style={styles.payModalTitle}>Tezkor To'lov</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1F2022" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Talabani qidiring</Text>
                        <View style={styles.paySearchContainer}>
                            <Ionicons name="search" size={20} color="#828282" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.paySearchInput}
                                placeholder="Ism yoki telefon..."
                                value={paySearch}
                                onChangeText={setPaySearch}
                            />
                        </View>

                        {searchedStudents.length > 0 && (
                            <View style={styles.searchDropdown}>
                                {searchedStudents.map(s => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.searchResultItem}
                                        onPress={() => {
                                            setSelectedStudent(s);
                                            setPaySearch(s.name);
                                        }}
                                    >
                                        <View style={styles.searchResultAvatar}>
                                            <Text style={styles.searchResultAvatarText}>{s.name[0]}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.searchResultName}>{s.name}</Text>
                                            <Text style={styles.searchResultSub}>{s.course || 'Guruhsiz'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {selectedStudent && (
                            <View style={styles.selectedStudentBox}>
                                <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                                <Text style={styles.selectedStudentName}>{selectedStudent.name} tanlandi</Text>
                                <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                                    <Text style={styles.changeLabel}>O'zgartirish</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>To'lov summasi (UZS)</Text>
                        <View style={styles.amountInputContainer}>
                            <Ionicons name="cash-outline" size={22} color={DESIGN.colors.primary} />
                            <TextInput
                                style={styles.amountInput}
                                placeholder="Masalan: 500,000"
                                keyboardType="numeric"
                                value={payAmount}
                                onChangeText={setPayAmount}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.paySubmitBtn, (!selectedStudent || !payAmount) && styles.paySubmitBtnDisabled]}
                            onPress={handleQuickPayment}
                            disabled={!selectedStudent || !payAmount}
                        >
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={styles.paySubmitGradient}
                            >
                                <Text style={styles.paySubmitText}>To'lovni tasdiqlash</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ==================== PREMIUM STYLES ====================
const getStyles = (DESIGN, isDarkMode, theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DESIGN.spacing.xl,
        paddingTop: DESIGN.spacing.md,
        paddingBottom: DESIGN.spacing.lg,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: DESIGN.colors.surface,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: DESIGN.colors.success,
        borderWidth: 2,
        borderColor: DESIGN.colors.background,
    },
    userInfo: {
        marginLeft: DESIGN.spacing.md,
    },
    greeting: {
        ...DESIGN.typography.bodySmall,
        color: DESIGN.colors.textSecondary,
        marginBottom: 2,
    },
    userName: {
        ...DESIGN.typography.headlineMedium,
        color: DESIGN.colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: DESIGN.spacing.sm,
    },
    iconButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: DESIGN.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: DESIGN.colors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    notificationBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: DESIGN.colors.live,
        borderWidth: 2,
        borderColor: DESIGN.colors.surface,
    },

    // Stats Section
    statsSection: {
        paddingHorizontal: DESIGN.spacing.xl,
        marginBottom: DESIGN.spacing.xxl,
    },
    sectionTitle: {
        ...DESIGN.typography.headlineLarge,
        color: DESIGN.colors.textPrimary,
        marginBottom: DESIGN.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: DESIGN.spacing.md,
    },
    statCardWrapper: {
        flex: 1,
    },
    statCardContainer: {
        borderRadius: DESIGN.radius.xl,
        shadowColor: DESIGN.colors.shadowMedium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    statCardGradient: {
        borderRadius: DESIGN.radius.xl,
        padding: DESIGN.spacing.lg,
        minHeight: 130,
        overflow: 'hidden',
        justifyContent: 'space-between',
    },
    decorCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statIconWrapper: {
        alignSelf: 'flex-start',
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        ...DESIGN.typography.displayMedium,
        color: DESIGN.colors.textOnDark,
        marginTop: DESIGN.spacing.sm,
    },
    statLabel: {
        ...DESIGN.typography.labelMedium,
        color: 'rgba(255,255,255,0.85)',
        marginTop: DESIGN.spacing.xs,
    },

    // Lessons Section
    lessonsSection: {
        marginBottom: DESIGN.spacing.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DESIGN.spacing.xl,
        marginBottom: DESIGN.spacing.lg,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DESIGN.spacing.xs,
    },
    seeAllText: {
        ...DESIGN.typography.labelLarge,
        color: DESIGN.colors.accent,
    },
    lessonsScroll: {
        paddingHorizontal: DESIGN.spacing.xl,
        paddingRight: DESIGN.spacing.xxxl,
    },
    lessonCardWrapper: {
        marginRight: DESIGN.spacing.md,
    },
    lessonCard: {
        width: 220,
        borderRadius: DESIGN.radius.xxl,
        backgroundColor: DESIGN.colors.surface,
        shadowColor: DESIGN.colors.shadowMedium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
    lessonCardGradient: {
        padding: DESIGN.spacing.lg,
        minHeight: 200,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    lessonDecorShape1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    lessonDecorShape2: {
        position: 'absolute',
        bottom: 60,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    lessonStatusContainerInline: {
        flexDirection: 'row',
        marginBottom: DESIGN.spacing.sm,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: DESIGN.spacing.sm + 4,
        paddingVertical: DESIGN.spacing.xs,
        borderRadius: DESIGN.radius.full,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: DESIGN.colors.live,
    },
    liveText: {
        ...DESIGN.typography.labelSmall,
        color: DESIGN.colors.live,
        fontWeight: '800',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: DESIGN.spacing.sm + 2,
        paddingVertical: DESIGN.spacing.xs,
        borderRadius: DESIGN.radius.full,
        gap: 4,
    },
    finishedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: DESIGN.spacing.sm + 2,
        paddingVertical: DESIGN.spacing.xs,
        borderRadius: DESIGN.radius.full,
        gap: 4,
    },
    statusBadgeText: {
        ...DESIGN.typography.labelSmall,
        color: '#FFF',
        fontWeight: '700',
    },
    lessonContent: {
        flex: 1,
    },
    lessonTitle: {
        ...DESIGN.typography.headlineMedium,
        color: DESIGN.colors.textOnDark,
        marginBottom: DESIGN.spacing.sm,
        lineHeight: 24,
    },
    lessonMeta: {
        marginBottom: DESIGN.spacing.md,
    },
    lessonMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DESIGN.spacing.xs,
    },
    lessonMetaText: {
        ...DESIGN.typography.bodySmall,
        color: 'rgba(255,255,255,0.85)',
    },
    lessonFooter: {
        marginTop: 'auto',
    },
    lessonStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DESIGN.spacing.xs,
    },
    lessonStatText: {
        ...DESIGN.typography.labelMedium,
        color: 'rgba(255,255,255,0.9)',
    },
    lessonDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: DESIGN.spacing.sm,
    },
    lessonDaysText: {
        ...DESIGN.typography.labelSmall,
        color: 'rgba(255,255,255,0.8)',
    },
    lessonArrowWrapper: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    lessonArrowButton: {
        width: 56,
        height: 56,
        borderTopLeftRadius: DESIGN.radius.xl,
        backgroundColor: DESIGN.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyLessons: {
        width: 300,
        height: 180,
        backgroundColor: DESIGN.colors.surface,
        borderRadius: DESIGN.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: DESIGN.colors.surfaceLight,
        borderStyle: 'dashed',
    },
    emptyIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: DESIGN.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DESIGN.spacing.md,
    },
    emptyTitle: {
        ...DESIGN.typography.titleMedium,
        color: DESIGN.colors.textSecondary,
    },
    emptySubtitle: {
        ...DESIGN.typography.bodySmall,
        color: DESIGN.colors.textLight,
        marginTop: DESIGN.spacing.xs,
    },

    // Activity Section
    activitySection: {
        paddingHorizontal: DESIGN.spacing.xl,
        marginBottom: DESIGN.spacing.xxl,
    },
    activityCard: {
        borderRadius: DESIGN.radius.xxl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    activityCardGradient: {
        padding: DESIGN.spacing.xl,
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    activityGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: DESIGN.spacing.xl,
    },
    activityTitle: {
        ...DESIGN.typography.titleLarge,
        color: DESIGN.colors.textOnDark,
    },
    activitySubtitle: {
        ...DESIGN.typography.bodySmall,
        color: 'rgba(255,255,255,0.5)',
        marginTop: DESIGN.spacing.xs,
    },
    activityPercentage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    percentageValue: {
        fontSize: 42,
        fontWeight: '800',
        color: DESIGN.colors.textOnDark,
        lineHeight: 42,
    },
    percentageSymbol: {
        ...DESIGN.typography.titleLarge,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 60,
        marginBottom: DESIGN.spacing.lg,
        paddingHorizontal: DESIGN.spacing.sm,
    },
    chartBar: {
        width: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressGradient: {
        flex: 1,
    },
    progressDot: {
        position: 'absolute',
        right: 0,
        top: -4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#D946EF',
        borderWidth: 2,
        borderColor: DESIGN.colors.textOnDark,
    },
    activityFooterStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: DESIGN.spacing.lg,
    },
    activityStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DESIGN.spacing.xs,
    },
    activityStatText: {
        ...DESIGN.typography.labelMedium,
        color: 'rgba(255,255,255,0.7)',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: DESIGN.colors.surface,
        borderTopLeftRadius: DESIGN.radius.xxl,
        borderTopRightRadius: DESIGN.radius.xxl,
        padding: DESIGN.spacing.xl,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: DESIGN.colors.surfaceLight,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: DESIGN.spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DESIGN.spacing.xl,
    },
    modalTitle: {
        ...DESIGN.typography.headlineLarge,
        color: DESIGN.colors.textPrimary,
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DESIGN.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DESIGN.spacing.lg,
        backgroundColor: DESIGN.colors.surfaceLight,
        borderRadius: DESIGN.radius.lg,
        marginBottom: DESIGN.spacing.md,
    },
    activityItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: DESIGN.spacing.md,
    },
    activityItemInfo: {
        flex: 1,
    },
    activityItemText: {
        ...DESIGN.typography.titleMedium,
        color: DESIGN.colors.textPrimary,
        marginBottom: DESIGN.spacing.xs,
    },
    activityItemFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityItemUser: {
        ...DESIGN.typography.bodySmall,
        color: DESIGN.colors.textSecondary,
    },
    activityTimeDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: DESIGN.colors.textLight,
        marginHorizontal: DESIGN.spacing.sm,
    },
    activityItemTime: {
        ...DESIGN.typography.bodySmall,
        color: DESIGN.colors.textLight,
    },
    emptyActivities: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DESIGN.spacing.xxxl,
    },
    emptyActivitiesText: {
        ...DESIGN.typography.bodyMedium,
        color: DESIGN.colors.textLight,
        marginTop: DESIGN.spacing.md,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: DESIGN.spacing.xl,
        gap: DESIGN.spacing.md,
        marginBottom: DESIGN.spacing.lg,
    },
    quickActionButton: {
        flex: 1,
        height: 60,
        borderRadius: DESIGN.radius.xl,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    quickActionGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DESIGN.spacing.lg,
        gap: 12,
    },
    quickActionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionText: {
        ...DESIGN.typography.titleMedium,
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    // Quick Payment Modal Styles
    payModalContent: {
        backgroundColor: DESIGN.colors.surface,
        width: '90%',
        borderRadius: 32,
        padding: 24,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    payModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    payModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: DESIGN.colors.textPrimary,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
        marginBottom: 8,
        marginTop: 15,
    },
    paySearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DESIGN.colors.surfaceLight,
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 54,
        borderWidth: 1,
        borderColor: DESIGN.colors.glassBorder,
    },
    paySearchInput: {
        flex: 1,
        fontSize: 15,
        color: DESIGN.colors.textPrimary,
    },
    searchDropdown: {
        backgroundColor: DESIGN.colors.surface,
        borderRadius: 16,
        marginTop: 5,
        borderWidth: 1,
        borderColor: DESIGN.colors.glassBorder,
        maxHeight: 200,
        overflow: 'hidden',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.glassBorder,
        gap: 12,
    },
    searchResultAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DESIGN.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultAvatarText: {
        color: DESIGN.colors.primary,
        fontWeight: 'bold',
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2022',
    },
    searchResultSub: {
        fontSize: 11,
        color: '#828282',
    },
    selectedStudentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F7EE',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
    },
    selectedStudentName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: DESIGN.colors.success,
    },
    changeLabel: {
        fontSize: 12,
        color: DESIGN.colors.textSecondary,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DESIGN.colors.surfaceLight,
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 60,
        borderWidth: 1,
        borderColor: DESIGN.colors.accent + '20',
    },
    amountInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 20,
        fontWeight: 'bold',
        color: DESIGN.colors.primary,
    },
    paySubmitBtn: {
        marginTop: 30,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    paySubmitBtnDisabled: {
        opacity: 0.5,
    },
    paySubmitGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paySubmitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

const DashboardScreen = () => {
    const { width } = useWindowDimensions();
    // Desktop Layout for screens wider than 1280px
    if (width >= 1280) {
        return <DashboardDesktop />;
    }
    return <DashboardMobile />;
};

export default DashboardScreen;
