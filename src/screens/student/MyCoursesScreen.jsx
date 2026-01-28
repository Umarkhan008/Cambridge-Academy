import React, { useContext, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import * as Updates from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import Header from '../../components/Header';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { SchoolContext } from '../../context/SchoolContext';
import { AuthContext } from '../../context/AuthContext';

const MyCoursesScreen = () => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { courses, students } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);

    // Find current student. For demo, we match by name or fallback to the first student
    const currentStudent = students.find(s => s.name === userInfo?.name) || students[0];

    // Get assigned course
    const enrolledCourses = [];
    if (currentStudent?.assignedCourseId) {
        const course = courses.find(c => c.id === currentStudent.assignedCourseId);
        if (course) {
            enrolledCourses.push({
                ...course,
                progress: 0.1, // Demo progress
                totalLessons: 24,
                completedLessons: 2
            });
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



    // Custom Progress Bar for iOS compatibility
    const CustomProgressBar = ({ progress, color }) => {
        const { theme } = useContext(ThemeContext);
        return (
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('CourseDetail', { course: item, isEnrolled: true })}
            activeOpacity={0.7}
        >
            <View style={[globalStyles.card, globalStyles.shadow, styles.courseCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.iconContainer, { backgroundColor: (item.color || COLORS.primary) + '20' }]}>
                    <Ionicons name={item.icon || 'book'} size={28} color={item.color || COLORS.primary} />
                </View>

                <View style={styles.content}>
                    <View style={globalStyles.rowBetween}>
                        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                        {/* Percentage removed as per request */}
                    </View>
                    <Text style={[styles.instructor, { color: theme.textSecondary }]}>{item.instructor || t.instructorNotAssigned}</Text>

                    {/* Progress bar removed as per request */}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Header title={t.myCourses} />

            <View style={globalStyles.screenPadding}>
                <FlatList
                    data={enrolledCourses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: theme.textSecondary }}>{t.noCourses}</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    courseCard: {
        flexDirection: 'row',
        padding: SIZES.padding,
        marginBottom: SIZES.base * 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SIZES.base * 2,
    },
    content: {
        flex: 1,
    },
    title: {
        ...FONTS.h4,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    percentage: {
        ...FONTS.h4,
        fontWeight: 'bold',
    },
    instructor: {
        ...FONTS.body4,
        marginBottom: 12,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    lessons: {
        ...FONTS.small,
        textAlign: 'right',
    }
});

export default MyCoursesScreen;
