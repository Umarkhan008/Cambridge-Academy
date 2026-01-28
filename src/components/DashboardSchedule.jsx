import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { ThemeContext } from '../context/ThemeContext';
import { SchoolContext } from '../context/SchoolContext';
import { useNavigation } from '@react-navigation/native';

const DashboardSchedule = () => {
    const { width } = useWindowDimensions();
    const isWeb = width > 700;
    const { theme } = useContext(ThemeContext);
    const { courses } = useContext(SchoolContext);
    const navigation = useNavigation();

    // Time slots from 08:00 to 20:00
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    // Get current time for indicator
    const getCurrentTime = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Get today's day name
    // Get today's day index (0-6)
    const getTodayDayName = () => new Date().getDay();

    // Helper to check if a course is scheduled for today
    const isCourseToday = (course, todayIndex) => {
        if (!course.days) return false;

        // Handle "Daily"
        if (Array.isArray(course.days) && course.days.includes('Daily')) return true;
        if (typeof course.days === 'string' && course.days.includes('Daily')) return true;

        // Day Aliases - English and Uzbek (Short/Full) + Presets (DCHJ/SPSH)
        const dayAliases = [
            ['Sun', 'Sunday', 'Yak', 'Yakshanba', 'Ya'], // 0
            ['Mon', 'Monday', 'Du', 'Dushanba', 'DCHJ'],   // 1
            ['Tue', 'Tuesday', 'Se', 'Seshanba', 'SPSH'],  // 2
            ['Wed', 'Wednesday', 'Chor', 'Chorshanba', 'Ch', 'DCHJ'], // 3
            ['Thu', 'Thursday', 'Pay', 'Payshanba', 'Pa', 'SPSH'], // 4
            ['Fri', 'Friday', 'Jum', 'Juma', 'Ju', 'DCHJ'],      // 5
            ['Sat', 'Saturday', 'Shan', 'Shanba', 'Sh', 'SPSH']  // 6
        ];

        const todayAliases = dayAliases[todayIndex];

        // normalize course.days to array
        let courseDaysArray = [];
        if (Array.isArray(course.days)) {
            courseDaysArray = course.days;
        } else if (typeof course.days === 'string') {
            // Split by comma or space if needed, or just treat as single item array
            courseDaysArray = course.days.split(/[\s,]+/);
        }

        // Check if any aliases match any of the course days
        return courseDaysArray.some(day =>
            todayAliases.some(alias => day.toLowerCase().includes(alias.toLowerCase()))
        );
    };

    // Parse time string to get hour (e.g., "14:30" -> 14.5)
    const parseStartHour = (timeStr) => {
        if (!timeStr) return null;
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
            const h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            return h + m / 60;
        }
        return null;
    };

    // Parse duration from time string (e.g., "14:00-16:30" -> 2.5 hours)
    const parseDuration = (timeStr) => {
        if (!timeStr) return 1;
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (match) {
            const startH = parseInt(match[1], 10);
            const startM = parseInt(match[2], 10);
            const endH = parseInt(match[3], 10);
            const endM = parseInt(match[4], 10);

            const startTotal = startH + startM / 60;
            const endTotal = endH + endM / 60;
            return endTotal - startTotal;
        }
        return 1; // Default 1 hour
    };

    // Get today's classes
    const todayClasses = useMemo(() => {
        const todayIdx = getTodayDayName();

        // Get courses for today
        const courseClasses = courses.filter(course => {
            return isCourseToday(course, todayIdx);
        }).map((course, idx) => ({
            id: `course_${course.id}`,
            title: course.title,
            teacher: course.instructor,
            room: `Room ${(idx % 3) + 1}`,
            time: course.time,
            startHour: parseStartHour(course.time),
            duration: parseDuration(course.time),
            color: course.color || COLORS.primary,
            type: 'course',
            roomIndex: idx % 3
        }));

        return [...courseClasses].filter(c => c.startHour !== null);
    }, [courses]);

    // Group classes by room
    const roomGroups = useMemo(() => {
        const rooms = [
            { id: 0, name: '1-xona', classes: [] },
            { id: 1, name: '2-xona', classes: [] },
            { id: 2, name: '3-xona', classes: [] }
        ];

        todayClasses.forEach(cls => {
            rooms[cls.roomIndex].classes.push(cls);
        });

        return rooms;
    }, [todayClasses]);

    // Calculate position for current time indicator
    const getCurrentTimePosition = () => {
        const [hours, minutes] = currentTime.split(':').map(Number);
        if (hours < 8 || hours > 20) return null;

        const hourWidth = 100; // Width per hour slot
        const position = (hours - 8) * hourWidth + (minutes / 60) * hourWidth;
        return position;
    };

    const currentTimePosition = getCurrentTimePosition();

    // Check if class is finished
    const isClassFinished = (cls) => {
        const [hours] = currentTime.split(':').map(Number);
        return cls.startHour + cls.duration <= hours;
    };

    // Check if class is currently active (happening now)
    const isClassCurrent = (cls) => {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const currentFloat = hours + minutes / 60;
        const startFloat = cls.startHour;
        const endFloat = cls.startHour + cls.duration;
        return currentFloat >= startFloat && currentFloat < endFloat;
    };

    // Render class card
    const renderClassCard = (cls) => {
        const finished = isClassFinished(cls);
        const active = isClassCurrent(cls);

        return (
            <TouchableOpacity
                key={cls.id}
                style={[
                    styles.classCard,
                    {
                        backgroundColor: cls.color + '30',
                        borderLeftColor: cls.color,
                        left: (cls.startHour - 8) * 100,
                        width: cls.duration * 100 - 8,
                        opacity: finished ? 0.6 : 1,
                        // Active styles
                        borderColor: active ? COLORS.primary : 'transparent',
                        borderWidth: active ? 2 : 0,
                        borderLeftWidth: active ? 4 : 3, // Thicker left border if active
                        shadowOpacity: active ? 0.3 : 0.1,
                        shadowRadius: active ? 8 : 3,
                        transform: active ? [{ scale: 1.02 }] : [],
                        zIndex: active ? 100 : 1 // Higher zIndex for active
                    }
                ]}
                onPress={() => {
                    if (cls.type === 'course') {
                        const course = courses.find(c => c.id === cls.id.replace('course_', ''));
                        if (course) {
                            navigation.navigate('CourseDetail', { course });
                        }
                    }
                }}
            >
                {active && (
                    <View style={[styles.finishedBadge, { backgroundColor: COLORS.success, right: -4, top: -8 }]}>
                        <Text style={styles.finishedText}>Hozir</Text>
                    </View>
                )}
                {finished && (
                    <View style={[styles.finishedBadge, { backgroundColor: COLORS.textLight }]}>
                        <Text style={styles.finishedText}>Tugadi</Text>
                    </View>
                )}
                <Text style={[styles.classTitle, { color: theme.text }]} numberOfLines={1}>
                    {cls.title}
                </Text>
                <Text style={[styles.classTeacher, { color: theme.textSecondary }]} numberOfLines={1}>
                    {cls.teacher}
                </Text>

                {/* Attendance Button for Active Classes */}
                {active ? (
                    <TouchableOpacity
                        style={[styles.attendanceBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => {
                            const course = courses.find(c => c.id === cls.id.replace('course_', ''));
                            if (course) {
                                navigation.navigate('Attendance', { courseId: course.id, courseName: course.title });
                            }
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={12} color="white" style={{ marginRight: 4 }} />
                        <Text style={styles.attendanceBtnText}>Davomat</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.classRoom, { color: theme.textLight }]} numberOfLines={1}>
                        {cls.room}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: theme.text }]}>Dars Jadvali</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Bugungi barcha darslar va kelilar darslar
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.todayBadge, { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.todayBadgeText}>Bugun: {todayClasses.length}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => navigation.navigate('Schedule', { readOnly: true })}
                    >
                        <Text style={[styles.viewAllText, { color: COLORS.primary }]}>Barchasini ko'rish</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Schedule Grid */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.grid}>
                    {/* Time Header */}
                    <View style={styles.timeHeader}>
                        <View style={[styles.roomLabelCell, { backgroundColor: theme.background }]}>
                            <Text style={[styles.roomLabelText, { color: theme.textSecondary }]}>Xona</Text>
                        </View>
                        {timeSlots.map((time, idx) => (
                            <View
                                key={time}
                                style={[
                                    styles.timeCell,
                                    { borderLeftColor: theme.border },
                                    idx === 0 && { borderLeftWidth: 0 }
                                ]}
                            >
                                <Text style={[styles.timeText, { color: theme.textSecondary }]}>{time}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Room Rows */}
                    {roomGroups.map((room, roomIdx) => (
                        <View key={room.id} style={styles.roomRow}>
                            {/* Room Label */}
                            <View style={[styles.roomLabel, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                                <Text style={[styles.roomName, { color: theme.text }]}>{room.name}</Text>
                            </View>

                            {/* Time Grid */}
                            <View style={styles.timeGrid}>
                                {/* Grid Lines */}
                                {timeSlots.map((time, idx) => (
                                    <View
                                        key={time}
                                        style={[
                                            styles.gridCell,
                                            {
                                                borderLeftColor: theme.border,
                                                borderTopColor: theme.border,
                                                backgroundColor: idx % 2 === 0 ? theme.background : 'transparent'
                                            },
                                            idx === 0 && { borderLeftWidth: 0 }
                                        ]}
                                    />
                                ))}

                                {/* Class Cards */}
                                {room.classes.map(cls => renderClassCard(cls))}

                                {/* Current Time Indicator */}
                                {currentTimePosition !== null && (
                                    <View style={[styles.currentTimeIndicator, { left: currentTimePosition }]}>
                                        <View style={styles.currentTimeLine} />
                                        {roomIdx === 0 && (
                                            <View style={styles.currentTimeLabel}>
                                                <Text style={styles.currentTimeText}>Joriy vaqt: {currentTime}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Empty State */}
            {todayClasses.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={theme.textLight} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Bugun darslar yo'q
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: SIZES.padding,
        marginBottom: SIZES.padding,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SIZES.padding,
        flexWrap: 'wrap',
        gap: 10
    },
    headerLeft: {
        flex: 1,
        minWidth: 200
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    title: {
        ...FONTS.h3,
        fontWeight: 'bold',
        marginBottom: 4
    },
    subtitle: {
        ...FONTS.body4,
    },
    todayBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    todayBadgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        ...FONTS.body4,
        fontWeight: '600',
    },
    scrollView: {
        marginHorizontal: -SIZES.padding,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
    },
    grid: {
        minWidth: 1300, // 100px per hour * 13 hours
    },
    timeHeader: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    roomLabelCell: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 8,
    },
    roomLabelText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timeCell: {
        width: 100,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 4,
        borderLeftWidth: 1,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    roomRow: {
        flexDirection: 'row',
        height: 80,
    },
    roomLabel: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    roomName: {
        fontSize: 13,
        fontWeight: '600',
    },
    timeGrid: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
    },
    gridCell: {
        width: 100,
        height: 80,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    classCard: {
        position: 'absolute',
        top: 8,
        height: 64,
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 3,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    classTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    classTeacher: {
        fontSize: 11,
        marginBottom: 2,
    },
    classRoom: {
        fontSize: 10,
    },
    finishedBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    finishedText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
    },
    currentTimeIndicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        zIndex: 10,
    },
    currentTimeLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#FFD700',
    },
    currentTimeLabel: {
        position: 'absolute',
        top: -24,
        left: -50,
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        width: 100,
    },
    currentTimeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        ...FONTS.body3,
        marginTop: 12,
    },
    attendanceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4
    },
    attendanceBtnText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    }
});

export default DashboardSchedule;
