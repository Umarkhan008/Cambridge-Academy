import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, FlatList, Dimensions, RefreshControl } from 'react-native';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import Header from '../../components/Header';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { SchoolContext } from '../../context/SchoolContext';
import { AuthContext } from '../../context/AuthContext';

const MyScheduleScreen = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, students, schedule } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);

    // Identify current student (fallback logic needs improvement in real app but sufficient here)
    const currentStudent = students.find(s => s.name === userInfo?.name) || students[0];

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [filteredClasses, setFilteredClasses] = useState([]);

    // Horizontal Calendar State
    const [dates, setDates] = useState([]);
    const flatListRef = useRef(null);

    useEffect(() => {
        const today = new Date();
        const tempDates = [];
        for (let i = -3; i <= 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            tempDates.push(d.toISOString().split('T')[0]);
        }
        setDates(tempDates);

        setTimeout(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: 3, animated: true, viewPosition: 0.5 });
            }
        }, 500);
    }, []);

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

    // Filter Logic
    useEffect(() => {
        if (!selectedDate || !currentStudent) return;

        const dateObj = new Date(selectedDate);
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayMap[dateObj.getDay()];

        const myCourseId = currentStudent.assignedCourseId; // assuming string or int

        const dayCourses = courses.filter(c => {
            // Loose comparison or exact depending on data types. Firestore IDs are strings.
            // If myCourseId is from Firestore, it is string. c.id is string.
            if (c.id != myCourseId) return false;

            if (!c.days) return false;
            return c.days.includes(dayName) || c.days.includes('Daily');
        }).map(c => ({
            id: 'c_' + c.id,
            title: c.title,
            teacher: c.instructor,
            time: c.time,
            room: 'Room 1',
            isCourse: true,
            color: getCourseColor(c.id)
        }));

        setFilteredClasses(dayCourses);

    }, [selectedDate, courses, currentStudent]);

    const getCourseColor = (id) => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
        let hash = 0;
        const str = String(id);
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    // Components
    const DateItem = ({ date, isSelected }) => {
        const d = new Date(date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = dayNames[d.getDay()];
        const dayNum = d.getDate();

        return (
            <TouchableOpacity
                style={[
                    styles.dateItem,
                    isSelected && { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 5 }
                ]}
                onPress={() => setSelectedDate(date)}
            >
                <Text style={[styles.dayName, { color: isSelected ? 'white' : theme.textSecondary }]}>{day}</Text>
                <Text style={[styles.dayNum, { color: isSelected ? 'white' : theme.text }]}>{dayNum}</Text>
                {date === new Date().toISOString().split('T')[0] && (
                    <View style={[styles.todayDot, { backgroundColor: isSelected ? 'white' : COLORS.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    const renderClassItem = (item, index) => {
        const isLast = index === filteredClasses.length - 1;
        const startTime = item.time ? item.time.split(/[-]/)[0].trim() : "N/A";

        return (
            <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                    <Text style={[styles.timeText, { color: theme.text }]}>{startTime}</Text>
                    <View style={[styles.timelineLine, { backgroundColor: theme.border }, isLast && { height: '50%' }]} />
                    <View style={[styles.timelineDot, { borderColor: item.color || COLORS.primary, backgroundColor: theme.background }]} />
                </View>

                <View style={styles.timelineRight}>
                    <View
                        style={[styles.classCard, { backgroundColor: theme.surface, shadowColor: theme.text }]}
                    >
                        <View style={[styles.cardColorStrip, { backgroundColor: item.color || COLORS.primary }]} />
                        <View style={styles.cardContent}>
                            <View style={globalStyles.rowBetween}>
                                <Text style={[styles.classTitle, { color: theme.text }]}>{item.title}</Text>
                                {item.room ? (
                                    <View style={[styles.tag, { backgroundColor: (item.color || COLORS.primary) + '20' }]}>
                                        <Text style={[styles.tagText, { color: item.color || COLORS.primary }]}>{item.room}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.time}</Text>
                                <View style={styles.spacer} />
                                <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.teacher}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header
                title={t.mySchedule}
                rightIcon="calendar"
                onRightPress={() => setCalendarVisible(true)}
            />

            {/* General Schedule Info Card */}
            {currentStudent?.assignedCourseId && (() => {
                const assignedCourse = courses.find(c => c.id === currentStudent.assignedCourseId);
                if (assignedCourse) {
                    return (
                        <View style={{ paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding }}>
                            <View style={[styles.scheduleInfoCard, { backgroundColor: COLORS.primary }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name="time" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{assignedCourse.title}</Text>
                                </View>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{t.days}:</Text> {assignedCourse.days}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{t.time}:</Text> {assignedCourse.time}
                                </Text>
                            </View>
                        </View>
                    );
                }
                return null;
            })()}

            <View style={styles.dateStripContainer}>
                <FlatList
                    ref={flatListRef}
                    data={dates}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    renderItem={({ item }) => <DateItem date={item} isSelected={item === selectedDate} />}
                    contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
                    style={{ flexGrow: 0 }}
                    getItemLayout={(data, index) => (
                        { length: 60, offset: 60 * index, index }
                    )}
                />
            </View>

            <View style={[styles.selectedDayHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.selectedDayText, { color: theme.text }]}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                }
            >
                {filteredClasses.length > 0 ? (
                    filteredClasses.map(renderClassItem)
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={60} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.textLight }]}>{t.noClasses}</Text>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={calendarVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCalendarVisible(false)}
            >
                <View style={[styles.calendarModalOverlay, { backgroundColor: theme.background }]}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[globalStyles.h3, { color: theme.text }]}>{t.selectDate}</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        <Calendar
                            current={selectedDate}
                            onDayPress={day => {
                                setSelectedDate(day.dateString);
                                setCalendarVisible(false);
                            }}
                            theme={{
                                calendarBackground: theme.background,
                                textSectionTitleColor: theme.textSecondary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: COLORS.primary,
                                dayTextColor: theme.text,
                                textDisabledColor: theme.textLight,
                                arrowColor: COLORS.primary,
                                monthTextColor: theme.text,
                            }}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    dateStripContainer: {
        paddingVertical: SIZES.base * 1.5,
    },
    dateItem: {
        width: 50,
        height: 70,
        borderRadius: 25,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    dayName: {
        ...FONTS.small,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontSize: 10
    },
    dayNum: {
        ...FONTS.h3,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4
    },
    selectedDayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.base,
        borderBottomWidth: 1,
        marginBottom: SIZES.base
    },
    selectedDayText: {
        ...FONTS.h3,
        fontWeight: 'bold'
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 100
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: 100,
    },
    timelineLeft: {
        width: 60,
        alignItems: 'center',
    },
    timeText: {
        ...FONTS.h4,
        fontWeight: '600',
        marginTop: 0,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    timelineDot: {
        position: 'absolute',
        top: 6,
        right: 23,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        zIndex: 1,
        backgroundColor: 'white'
    },
    timelineRight: {
        flex: 1,
        paddingBottom: SIZES.padding,
        paddingLeft: SIZES.base
    },
    classCard: {
        flex: 1,
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        flexDirection: 'row'
    },
    cardColorStrip: {
        width: 6,
        height: '100%'
    },
    cardContent: {
        flex: 1,
        padding: SIZES.base * 1.5,
    },
    classTitle: {
        ...FONTS.h4,
        fontWeight: 'bold',
        marginBottom: 4
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        ...FONTS.small,
        fontWeight: '700'
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8
    },
    spacer: {
        width: 12
    },
    metaText: {
        ...FONTS.small,
        marginLeft: 4,
        fontWeight: '500'
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        opacity: 0.7
    },
    emptyText: {
        ...FONTS.body3,
        marginTop: SIZES.base,
        marginBottom: SIZES.padding
    },
    calendarModalOverlay: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.padding
    },
    scheduleInfoCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5
    }
});

export default MyScheduleScreen;
