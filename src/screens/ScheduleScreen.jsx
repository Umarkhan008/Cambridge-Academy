import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, FlatList, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import Header from '../components/Header';

const getTimeMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(/[: -]/);
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
};

const ScheduleScreen = ({ navigation, route }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { schedule, addClass, deleteClass, courses } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const { readOnly } = route.params || {};

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [weeklyClasses, setWeeklyClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState([]); // Today's classes
    const [currentLesson, setCurrentLesson] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [teacher, setTeacher] = useState('');
    const [time, setTime] = useState('');
    const [room, setRoom] = useState('');

    const flatListRef = useRef(null);
    const [weekDates, setWeekDates] = useState([]);

    // --- Data Processing ---
    useEffect(() => {
        // Construct all classes logic (merged from original)
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // 1. Recurring Courses
        const courseClasses = courses.flatMap(c => {
            if (!c.days) return [];
            let courseDaysArray = Array.isArray(c.days) ? c.days : c.days.toString().split(/[\s,]+/);
            // Day Aliases Logic
            const dayAliases = [
                ['Sun', 'Sunday', 'Yak', 'Yakshanba', 'Y', 'Ya', 'Sun'],
                ['Mon', 'Monday', 'Du', 'Dushanba', 'D', 'Mon'],
                ['Tue', 'Tuesday', 'Se', 'Seshanba', 'S', 'Tue'],
                ['Wed', 'Wednesday', 'Chor', 'Chorshanba', 'Ch', 'Cho', 'Wed'],
                ['Thu', 'Thursday', 'Pay', 'Payshanba', 'P', 'Pa', 'Thu'],
                ['Fri', 'Friday', 'Jum', 'Juma', 'J', 'Ju', 'Fri'],
                ['Sat', 'Saturday', 'Shan', 'Shanba', 'Sh', 'Sha', 'Sat']
            ];

            const isDaily = courseDaysArray.some(d => d.toLowerCase().includes('daily') || d.toLowerCase().includes('har kuni'));

            const applicableDays = dayMap.filter((dayName, idx) => {
                if (isDaily) return true;
                const aliases = dayAliases[idx].map(a => a.toLowerCase());
                return courseDaysArray.some(d => aliases.some(alias => d.toLowerCase() === alias || d.toLowerCase().includes(alias)));
            });

            return applicableDays.map(dayName => ({
                id: 'c_' + c.id + '_' + dayName,
                originalId: c.id,
                title: c.title,
                teacher: c.instructor || c.teacher,
                time: c.time,
                room: c.room || 'Room 1',
                isCourse: true,
                color: getCourseColor(c.id),
                dayName: dayName,
                type: 'course',
                duration: 90 // Default 90 mins if no end time
            }));
        });

        // 2. Manual Schedule
        const manualClasses = schedule.map(s => {
            const d = new Date(s.date);
            const dayName = dayMap[d.getDay()];
            return {
                ...s,
                id: 'm_' + s.id,
                isCourse: false,
                color: theme.textLight,
                dayName: dayName,
                type: 'manual',
                duration: 90
            };
        });

        const all = [...courseClasses, ...manualClasses];
        setWeeklyClasses(all);

        // Filter for specific selected date
        if (selectedDate) {
            const targetDateObj = new Date(selectedDate);
            const targetDayName = dayMap[targetDateObj.getDay()];

            const todays = all.filter(item => {
                if (item.type === 'manual') return item.date === selectedDate;
                if (item.type === 'course') return item.dayName === targetDayName;
                return false;
            }).sort((a, b) => getTimeMinutes(a.time) - getTimeMinutes(b.time));

            setFilteredClasses(todays);
        }

    }, [selectedDate, courses, schedule, theme]);

    // --- Current Lesson Logic ---
    useEffect(() => {
        // Find if there is a lesson NOW
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Only check if selectedDate is TODAY
        const isToday = selectedDate === new Date().toISOString().split('T')[0];

        if (isToday && filteredClasses.length > 0) {
            const active = filteredClasses.find(c => {
                const start = getTimeMinutes(c.time);
                const end = start + (c.duration || 90);
                return currentMinutes >= start && currentMinutes < end;
            });
            setCurrentLesson(active || null);
        } else {
            setCurrentLesson(null);
        }
    }, [filteredClasses, selectedDate]);


    // --- Init Horizontal Calendar ---
    useEffect(() => {
        const today = new Date();
        const tempDates = [];
        // Generate -2 to +14 days
        for (let i = -2; i <= 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            tempDates.push(d.toISOString().split('T')[0]);
        }
        setWeekDates(tempDates);

        setTimeout(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: 2, animated: true, viewPosition: 0.5 });
            }
        }, 500);
    }, []);

    const getCourseColor = (id) => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
        let hash = 0;
        const str = String(id);
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash % colors.length)];
    };


    // --- Actions ---
    const handleAddClass = async () => {
        if (!title || !time) {
            Alert.alert(t.error, t.fillAllFields);
            return;
        }

        const newClass = {
            title,
            teacher,
            time,
            room,
            date: selectedDate
        };

        showLoader(t.saving || 'Saqlanmoqda...');
        try {
            await addClass(newClass);
            setModalVisible(false);
            setTitle(''); setTeacher(''); setTime(''); setRoom('');
        } finally {
            hideLoader();
        }
    };

    const handleDeleteClass = (item) => {
        Alert.alert(
            t.delete || "Delete",
            `${t.deleteConfirm || "Are you sure you want to delete"} "${item.title}"?`,
            [
                { text: t.cancel || "Cancel", style: "cancel" },
                {
                    text: t.delete || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        showLoader(t.deleting || 'O\'chirilmoqda...');
                        try {
                            const originalId = item.id.split('_')[1];
                            await deleteClass(originalId);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    // --- Renderers ---

    const renderDateItem = ({ item }) => {
        const d = new Date(item);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = dayNames[d.getDay()];
        const dayNum = d.getDate();
        const isSelected = item === selectedDate;
        const isToday = item === new Date().toISOString().split('T')[0];

        // Check for dots
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const targetDayName = dayMap[d.getDay()];

        const hasLessons = weeklyClasses.some(c => {
            if (c.type === 'manual') return c.date === item;
            if (c.type === 'course') return c.dayName === targetDayName;
            return false;
        });

        return (
            <TouchableOpacity
                style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                onPress={() => setSelectedDate(item)}
            >
                <Text style={[styles.dateDay, isSelected && styles.textWhite]}>{day}</Text>
                <Text style={[styles.dateNum, isSelected && styles.textWhite]}>{dayNum}</Text>
                {isToday && !isSelected && <View style={styles.todayIndicator} />}
                {!isSelected && hasLessons && <View style={styles.lessonDot} />}
            </TouchableOpacity>
        );
    };

    const renderCurrentLesson = () => {
        if (!currentLesson) return null;
        return (
            <TouchableOpacity
                style={styles.nowCard}
                onPress={() => {
                    const course = courses.find(c => c.id === currentLesson.originalId);
                    if (course) navigation.navigate('CourseDetail', { course });
                }}
            >
                <View style={styles.nowHeader}>
                    <View style={styles.nowBadge}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.nowText}>{t.currentLesson}</Text>
                    </View>
                    <Text style={styles.nowTime}>{currentLesson.time}</Text>
                </View>
                <Text style={styles.nowTitle}>{currentLesson.title}</Text>
                <View style={styles.nowMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={14} color="#FFF" />
                        <Text style={styles.metaText}>{currentLesson.teacher || t.teachers.slice(0, -3)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#FFF" />
                        <Text style={styles.metaText}>{currentLesson.room || t.roomError}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderTimeline = () => {
        // Generate slots from 08:00 to 22:00
        const startHour = 8;
        const endHour = 22;
        const slots = [];

        for (let h = startHour; h < endHour; h++) {
            slots.push(`${h < 10 ? '0' + h : h}:00`);
            slots.push(`${h < 10 ? '0' + h : h}:30`);
        }

        return (
            <View style={styles.timelineContainer}>
                {slots.map((timeSlot, index) => {
                    // Check if any lesson starts at this timeSlot
                    const lessonsStarting = filteredClasses.filter(l => {
                        const lTime = l.time ? l.time.split(/[- ]/)[0] : '';
                        // Simple normalization: 09:00 == 9:00
                        const normL = getTimeMinutes(lTime);
                        const normS = getTimeMinutes(timeSlot);
                        return Math.abs(normL - normS) < 15; // Within 15 mins
                    });

                    return (
                        <View key={index} style={styles.timeRow}>
                            <View style={styles.timeLabelCol}>
                                <Text style={styles.timeLabelText}>{timeSlot}</Text>
                            </View>
                            <View style={styles.timeContentCol}>
                                <View style={styles.gridLine} />
                                {lessonsStarting.length > 0 ? (
                                    lessonsStarting.map(lesson => (
                                        <TouchableOpacity
                                            key={lesson.id}
                                            style={[styles.lessonBlock, { borderLeftColor: lesson.color }]}
                                            onPress={() => {
                                                if (lesson.isCourse) {
                                                    const course = courses.find(c => c.id === lesson.originalId);
                                                    if (course) navigation.navigate('CourseDetail', { course });
                                                }
                                            }}
                                        >
                                            <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                                            <View style={styles.lessonMetaRow}>
                                                <Text style={styles.lessonMeta}>{lesson.room || 'Room ?'}</Text>
                                                <Text style={styles.lessonMeta}>•</Text>
                                                <Text style={styles.lessonMeta}>{lesson.teacher || 'Teacher ?'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <TouchableOpacity
                                        style={styles.freeSlot}
                                        onPress={() => {
                                            if (!readOnly) {
                                                setTime(timeSlot);
                                                setModalVisible(true);
                                            }
                                        }}
                                    >
                                        {/* Invisible tap area unless user wants to add */}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]} >
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <Header
                title={t.schedule}
                rightIcon="calendar-outline"
                onRightPress={() => setCalendarVisible(true)}
            />

            {/* Top Date Nav */}
            <View style={styles.dateNavContainer}>
                <FlatList
                    ref={flatListRef}
                    data={weekDates}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    renderItem={renderDateItem}
                    contentContainerStyle={{ paddingHorizontal: 15 }}
                    getItemLayout={(data, index) => (
                        { length: 60, offset: 60 * index, index }
                    )}
                />
            </View>

            <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={true}
            >
                {/* Today Overview */}
                {renderCurrentLesson()}

                {/* Timeline */}
                <View style={styles.timelineWrapper}>
                    {renderTimeline()}
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 130 }} />
            </ScrollView>

            {/* Floating Action Button */}
            {!readOnly && (
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={28} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* Calendar Modal */}
            <Modal
                visible={calendarVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCalendarVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t.selectDate}</Text>
                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={selectedDate}
                            onDayPress={day => {
                                setSelectedDate(day.dateString);
                                setCalendarVisible(false);
                            }}
                            theme={{
                                selectedDayBackgroundColor: COLORS.primary,
                                todayTextColor: COLORS.primary,
                                arrowColor: COLORS.primary,
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Add Class Modal - Reusing logic, simple UI */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.addNewLesson}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formDateLabel}>{selectedDate}</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t.subjectName}</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    placeholder={t.subjectName}
                                    placeholderTextColor={theme.textLight}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.inputLabel}>{t.time}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="09:00"
                                        placeholderTextColor={theme.textLight}
                                        value={time}
                                        onChangeText={setTime}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>{t.rooms}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="101"
                                        placeholderTextColor={theme.textLight}
                                        value={room}
                                        onChangeText={setRoom}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t.teachers.slice(0, -3)}</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    placeholder={t.teachers.slice(0, -3)}
                                    placeholderTextColor={theme.textLight}
                                    value={teacher}
                                    onChangeText={setTeacher}
                                />
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddClass}>
                                <Text style={styles.submitBtnText}>{t.saqlash}</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE'
    },
    dateNavContainer: {
        paddingVertical: 15,
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        marginBottom: 10
    },
    dateItem: {
        width: 50,
        height: 70,
        borderRadius: 14, // Rounded corners
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    dateItemSelected: {
        backgroundColor: '#1F2022',
        elevation: 5,
        shadowColor: '#1F2022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    dateDay: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    dateNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    textWhite: {
        color: '#FFF'
    },
    todayIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4F46E5', // Primary
        marginTop: 4
    },
    lessonDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#10B981', // Green for lessons
        marginTop: 4
    },

    // Now Card
    nowCard: {
        marginHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#4F46E5', // Primary Blue
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    nowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    nowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6
    },
    pulsingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF3B30' // Red
    },
    nowText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold'
    },
    nowTime: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.9
    },
    nowTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10
    },
    nowMeta: {
        flexDirection: 'row',
        gap: 15
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    metaText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13
    },

    // Timeline
    timelineWrapper: {
        paddingHorizontal: 15,
        paddingTop: 10
    },
    timelineContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    timeRow: { // Row for each time slot
        flexDirection: 'row',
        minHeight: 60, // Height of slot
    },
    timeLabelCol: {
        width: 50,
        alignItems: 'flex-start',
        paddingTop: 0 // Align with line
    },
    timeLabelText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
        transform: [{ translateY: -8 }] // Center vertically on line
    },
    timeContentCol: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingLeft: 10,
        paddingBottom: 10
    },
    gridLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#F0F0F0'
    },
    lessonBlock: {
        backgroundColor: '#F3F4F6',
        marginTop: 4,
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 4,
        marginBottom: 4
    },
    lessonTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2022',
        marginBottom: 2
    },
    lessonMetaRow: {
        flexDirection: 'row',
        gap: 5
    },
    lessonMeta: {
        fontSize: 11,
        color: '#666'
    },
    freeSlot: {
        flex: 1,
        height: '100%',
        // Optional dashed background for free slots
        // backgroundColor: '#FAFAFA'
    },

    // Floating Action Button
    fab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6
    },

    // Unified Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    formDateLabel: { fontSize: 14, color: COLORS.primary, marginBottom: 15, fontWeight: '600', marginLeft: 4 },
    rowInputs: { flexDirection: 'row', marginBottom: 0 }
});

export default ScheduleScreen;
