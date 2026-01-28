import React, { useContext, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    useWindowDimensions,
    Image,
    TextInput,
    Platform,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';

// Enable LayoutAnimation for Android


const CourseDetailScreen = ({ route, navigation }) => {
    const { width } = useWindowDimensions();
    const { courses, students, attendance } = useContext(SchoolContext);
    const { t } = useContext(LanguageContext);
    const { theme, isDarkMode } = useContext(ThemeContext);

    const { id } = route.params || {};
    let { course } = route.params || {};

    // Get group from context if only ID is provided
    if (!course && id) {
        course = courses.find(c => c.id.toString() === id.toString());
    }

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Paused, Left
    const [settingsCollapsed, setSettingsCollapsed] = useState(true);

    const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

    // Check if today's attendance is already taken
    const isAttendanceTaken = useMemo(() => {
        if (!course || !attendance) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return attendance.some(a => String(a.courseId) === String(course.id) && a.date === todayStr);
    }, [attendance, course]);

    // Group-specific student data
    const groupStudents = useMemo(() => {
        if (!course) return [];
        return students.filter(s => s.assignedCourseId === course.id || s.course === course.title);
    }, [course, students]);

    const filteredStudents = useMemo(() => {
        return groupStudents.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [groupStudents, searchQuery, filterStatus]);

    // System Status Logic
    const getSystemStatus = () => {
        if (!course) return 'UPCOMING';
        const now = new Date();
        const start = course.startDate ? new Date(course.startDate) : new Date(2020, 0, 1);
        const end = course.endDate ? new Date(course.endDate) : new Date(2030, 0, 1);

        if (now < start) return 'UPCOMING';
        if (now > end) return 'COMPLETED';
        return 'LIVE'; // Defaulting to "LIVE" for active period, though Dashboard has more granular time-based check
    };

    const isDayActive = (checkDayIdx) => { // 0-6 (Mon-Sun)
        if (!course || !course.days) return false;

        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const targetDayName = dayNames[checkDayIdx];

        const aliasesForDays = {
            'Monday': ['Mon', 'Du', 'Dushanba', 'D'],
            'Tuesday': ['Tue', 'Se', 'Seshanba', 'S'],
            'Wednesday': ['Wed', 'Chor', 'Chorshanba', 'Ch', 'Cho'],
            'Thursday': ['Thu', 'Pay', 'Payshanba', 'P', 'Pa'],
            'Friday': ['Fri', 'Jum', 'Juma', 'J', 'Ju'],
            'Saturday': ['Sat', 'Shan', 'Shanba', 'Sh', 'Sha'],
            'Sunday': ['Sun', 'Yak', 'Yakshanba', 'Y', 'Ya']
        };

        const targetAliases = (aliasesForDays[targetDayName] || []).map(a => a.toLowerCase());
        const courseDaysRaw = Array.isArray(course.days) ? course.days : (course.days || '').toString().split(/[,\s-/]+/);
        const courseDays = courseDaysRaw.map(d => d.trim().toLowerCase());

        return courseDays.some(d =>
            d.includes('daily') ||
            d.includes('har kuni') ||
            targetAliases.some(alias => d === alias || d.includes(alias))
        );
    };

    const isTodayLesson = (() => {
        const todayIdx = (new Date().getDay() + 6) % 7; // ISO Mon-Sun
        return isDayActive(todayIdx);
    })();

    const toggleSettings = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSettingsCollapsed(!settingsCollapsed);
    };

    if (!course) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Text style={{ color: theme.text }}>Guruh topilmadi</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={{ color: theme.primary }}>Orqaga</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const status = getSystemStatus();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Minimal Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.headerTitle}>{course.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status === 'LIVE' ? (isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#E8F5E9') : (isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#FFF3E0') }]}>
                            <Text style={[styles.statusText, { color: status === 'LIVE' ? (isDarkMode ? '#3FB950' : '#4CAF50') : (isDarkMode ? '#F59E0B' : '#FF9800') }]}>
                                {status === 'LIVE' ? t.active_status.toUpperCase() : status === 'UPCOMING' ? t.upcoming.toUpperCase() : t.completed_status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.headerSub}>
                        {course.instructor || course.teacher} • {course.room || t.roomError} • {course.time}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Key Metrics */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <Feather name="users" size={16} color="#5865F2" />
                        <Text style={styles.metricValue}>{groupStudents.length}</Text>
                        <Text style={styles.metricLabel}>{t.student}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Feather name="dollar-sign" size={16} color="#27AE60" />
                        <Text style={styles.metricValue}>12.4M</Text>
                        <Text style={styles.metricLabel}>{t.metricsDaromad}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Feather name="bar-chart-2" size={16} color="#F2994A" />
                        <Text style={styles.metricValue}>92%</Text>
                        <Text style={styles.metricLabel}>{t.metricsDavomat}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Feather name="star" size={16} color="#9B51E0" />
                        <Text style={styles.metricValue}>4.9</Text>
                        <Text style={styles.metricLabel}>{t.metricsReyting}</Text>
                    </View>
                </View>

                {/* Schedule Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.groupSchedule}</Text>
                    <View style={styles.daysRow}>
                        {['Du', 'Se', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map((day, idx) => {
                            const todayIdx = (new Date().getDay() + 6) % 7; // ISO week
                            const isToday = idx === todayIdx;
                            const isActive = isDayActive(idx);

                            return (
                                <View key={day} style={styles.dayCol}>
                                    <View style={[
                                        styles.dayChip,
                                        isActive && styles.dayChipActive,
                                        isToday && styles.dayChipToday
                                    ]}>
                                        <Text style={[
                                            styles.dayText,
                                            isActive && styles.dayTextActive,
                                            isToday && { color: COLORS.primary }
                                        ]}>{day}</Text>
                                    </View>
                                    {isToday && <View style={styles.todayDot} />}
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                        <Text style={styles.timeText}>{course.time} (1.5 soat)</Text>
                    </View>
                </View>

                {/* Students Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t.students} ({groupStudents.length})</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllBtn}>{t.all}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color={theme.textLight} />
                        <TextInput
                            placeholder={`${t.search}...`}
                            placeholderTextColor={theme.textLight}
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        {['All', 'Active', 'Paused', 'Left'].map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
                                onPress={() => setFilterStatus(f)}
                            >
                                <Text style={[styles.filterText, filterStatus === f && styles.filterTextActive]}>
                                    {f === 'All' ? t.all : f === 'Active' ? t.active_status : f === 'Paused' ? 'Toʻxtatilgan' : 'Ketgan'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Student List */}
                    <View style={styles.studentList}>
                        {filteredStudents.map((s, idx) => (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.studentRow, idx === filteredStudents.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => navigation.navigate('StudentDetail', { studentId: s.id })}
                            >
                                <Image source={{ uri: s.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.studentAvatar} />
                                <View style={styles.studentDetails}>
                                    <Text style={styles.studentName}>{s.name}</Text>
                                    <View style={styles.studentMeta}>
                                        <View style={[styles.miniBadge, { backgroundColor: s.status === 'Active' ? (isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#E8F5E9') : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FFEBEE') }]}>
                                            <Text style={[styles.miniBadgeText, { color: s.status === 'Active' ? (isDarkMode ? '#3FB950' : '#4CAF50') : (isDarkMode ? '#FF8F75' : '#D32F2F') }]}>
                                                {s.status === 'Active' ? t.active_status : t.pending}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.rowAction}>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                        {filteredStudents.length === 0 && (
                            <View style={styles.emptyList}>
                                <Text style={styles.emptyText}>{t.noResults}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Group Settings */}
                <View style={styles.settingsSection}>
                    <TouchableOpacity style={styles.settingsHeader} onPress={toggleSettings}>
                        <View style={styles.settingsHeaderTitle}>
                            <Feather name="settings" size={18} color={theme.textSecondary} />
                            <Text style={styles.settingsTitle}>{t.groupSettings}</Text>
                        </View>
                        <Ionicons name={settingsCollapsed ? "chevron-down" : "chevron-up"} size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {!settingsCollapsed && (
                        <View style={styles.settingsContent}>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>{t.acceptNewStudents}</Text>
                                <Switch
                                    value={true}
                                    trackColor={{ true: theme.primary + '80' }}
                                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
                                />
                            </View>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>{t.visibleInCatalog}</Text>
                                <Switch value={true} trackColor={{ true: theme.primary + '80' }} />
                            </View>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.dangerBtn}>
                                <Feather name="pause-circle" size={18} color="#FF9800" />
                                <Text style={[styles.dangerText, { color: '#FF9800' }]}>{t.pauseGroup}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dangerBtn}>
                                <Feather name="archive" size={18} color="#D32F2F" />
                                <Text style={[styles.dangerText, { color: '#D32F2F' }]}>{t.archiveGroup}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Sticky Bottom Attendance Button */}
            <View style={styles.bottomBar}>
                {isAttendanceTaken ? (
                    <TouchableOpacity
                        style={[styles.attendanceBtn, { backgroundColor: (isDarkMode ? '#059669' : '#4CAF50') }]}
                        onPress={() => navigation.navigate('Attendance', { course: course })}
                    >
                        <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                        <Text style={styles.attendanceBtnText}>Davomat olingan (Tahrirlash)</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.attendanceBtn, !isTodayLesson && styles.attendanceBtnDisabled]}
                        onPress={() => navigation.navigate('Attendance', { course: course })}
                        disabled={!isTodayLesson}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.attendanceBtnText}>{t.takeDailyAttendance}</Text>
                    </TouchableOpacity>
                )}
                {!isTodayLesson && !isAttendanceTaken && (
                    <Text style={styles.attendanceHint}>{t.noAttendanceOnNonStudyDays}</Text>
                )}
            </View>
        </SafeAreaView>
    );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        marginLeft: 10,
        flex: 1
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    headerSub: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2
    },
    scrollContent: {
        paddingBottom: 120
    },
    metricsRow: {
        flexDirection: 'row',
        padding: 15,
        gap: 10
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginVertical: 4
    },
    metricLabel: {
        fontSize: 10,
        color: theme.textSecondary,
        fontWeight: '500'
    },
    section: {
        backgroundColor: theme.surface,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 20,
        padding: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    viewAllBtn: {
        fontSize: 13,
        color: theme.primary,
        fontWeight: '600'
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    dayCol: {
        alignItems: 'center'
    },
    dayChip: {
        width: 40,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    dayChipActive: {
        backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#EEF0FF',
        borderColor: isDarkMode ? 'rgba(79, 70, 229, 0.4)' : '#C2C9FF'
    },
    dayChipToday: {
        borderColor: theme.primary,
        borderWidth: 2
    },
    dayText: {
        fontSize: 12,
        color: theme.textLight,
        fontWeight: '600'
    },
    dayTextActive: {
        color: theme.primary
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.primary,
        marginTop: 4
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    timeText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500'
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 15
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: theme.text
    },
    filterRow: {
        gap: 8,
        marginBottom: 15
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: theme.background
    },
    filterChipActive: {
        backgroundColor: theme.text
    },
    filterText: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600'
    },
    filterTextActive: {
        color: theme.surface
    },
    studentList: {
        marginTop: 5
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    studentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12
    },
    studentDetails: {
        flex: 1
    },
    studentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.text
    },
    studentMeta: {
        flexDirection: 'row',
        marginTop: 4
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    rowAction: {
        padding: 5
    },
    emptyList: {
        padding: 20,
        alignItems: 'center'
    },
    emptyText: {
        color: theme.textLight,
        fontSize: 13
    },
    settingsSection: {
        marginHorizontal: 15,
        marginBottom: 15,
        backgroundColor: theme.surface,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15
    },
    settingsHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    settingsTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.text
    },
    settingsContent: {
        padding: 15,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: theme.border
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10
    },
    settingLabel: {
        fontSize: 14,
        color: theme.text
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 10
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12
    },
    dangerText: {
        fontSize: 14,
        fontWeight: '600'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    attendanceBtn: {
        backgroundColor: theme.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10
    },
    attendanceBtnDisabled: {
        backgroundColor: theme.border
    },
    attendanceBtnText: {
        color: theme.surface,
        fontSize: 16,
        fontWeight: 'bold'
    },
    attendanceHint: {
        textAlign: 'center',
        fontSize: 11,
        color: theme.textLight,
        marginTop: 8
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background
    }
});

export default CourseDetailScreen;
