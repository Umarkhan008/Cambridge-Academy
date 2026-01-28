import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, TextInput, Modal, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SchoolContext } from '../context/SchoolContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const DashboardDesktop = () => {
    const navigation = useNavigation();
    const { courses, students, finance, addStudent, addLead, recentActivities, schedule, teachers } = useContext(SchoolContext);
    const { userInfo } = useContext(AuthContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { width } = useWindowDimensions();

    const [searchQuery, setSearchQuery] = useState('');
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [leadModalVisible, setLeadModalVisible] = useState(false);
    const [notificationsVisible, setNotificationsVisible] = useState(false);

    // Student modal states
    const [studentName, setStudentName] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [studentCourse, setStudentCourse] = useState('');
    const [studentBalance, setStudentBalance] = useState('');

    // Lead modal states
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadSource, setLeadSource] = useState('');
    const [leadNotes, setLeadNotes] = useState('');

    const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

    // Statistika
    const stats = useMemo(() => {
        const liveGroups = courses.filter(c => c.status === 'Live' || c.status === 'Active' || c.systemStatus === 'LIVE').length;
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.status === 'Active').length;

        // Today's classes calculation
        const now = new Date();
        const dayOfWeek = now.getDay();
        const todayClassesCount = courses.filter(course => {
            if (!course || !course.days || course.status === 'Completed' || course.status === 'Paused') return false;
            const courseDaysStr = (course.days || '').toString().toUpperCase();
            if (courseDaysStr.includes('DCHJ') && [1, 3, 5].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('SPSH') && [2, 4, 6].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('HAR KUNI')) return true;
            // Also check individual days if they are stored as array or comma separated
            const daysMap = { 'DUSHANBA': 1, 'SESHANBA': 2, 'CHORSHANBA': 3, 'PAYSHANBA': 4, 'JUMA': 5, 'SHANBA': 6, 'YAKSHANBA': 0 };
            return Object.keys(daysMap).some(day => courseDaysStr.includes(day) && daysMap[day] === dayOfWeek);
        }).length;

        const totalRevenue = finance?.reduce((sum, item) => {
            if (item.type !== 'income' && item.type !== 'Income') return sum;
            const amountStr = (item.amount || '0').toString().replace(/[^0-9.-]+/g, "");
            const amount = parseFloat(amountStr) || 0;
            return sum + amount;
        }, 0) || 0;

        return [
            {
                id: 1,
                label: 'Jami O\'quvchilar',
                value: totalStudents,
                icon: 'people',
                gradient: ['#667eea', '#764ba2'],
                trend: `${activeStudents} faol`,
                trendUp: true
            },
            {
                id: 2,
                label: 'Faol Guruhlar',
                value: liveGroups,
                icon: 'school',
                gradient: ['#fa709a', '#fee140'],
                trend: `${liveGroups} ta guruh`,
                trendUp: true
            },
            {
                id: 3,
                label: 'Bugungi Darslar',
                value: todayClassesCount,
                icon: 'today',
                gradient: ['#43e97b', '#38f9d7'],
                trend: todayClassesCount > 0 ? 'Bugun' : 'Darslar yo\'q',
                trendUp: todayClassesCount > 0
            },
            {
                id: 4,
                label: 'Daromad (oy)',
                value: totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : totalRevenue.toLocaleString(),
                icon: 'trending-up',
                gradient: ['#30cfd0', '#330867'],
                trend: '+12.5%',
                trendUp: true
            },
        ];
    }, [courses, students, finance, isDarkMode]);

    // Bugungi darslar ro'yxati - yaxshilangan versiya
    const upcomingClasses = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeFloat = currentHour + currentMinutes / 60;

        // Parse time string to get start hour (e.g., "14:30" -> 14.5)
        const parseTimeToFloat = (timeStr) => {
            if (!timeStr) return null;
            const match = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (match) {
                return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
            }
            return null;
        };

        // Parse end time from time range (e.g., "14:00 - 16:00" -> 16)
        const parseEndTimeToFloat = (timeStr) => {
            if (!timeStr) return null;
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
            if (match) {
                return parseInt(match[3], 10) + parseInt(match[4], 10) / 60;
            }
            // Agar faqat start time bo'lsa, 1.5 soat qo'shamiz
            const startTime = parseTimeToFloat(timeStr);
            return startTime ? startTime + 1.5 : null;
        };

        return courses.filter(course => {
            if (!course || !course.days || course.status === 'Completed' || course.status === 'Paused') return false;
            const courseDaysStr = (course.days || '').toString().toUpperCase();
            if (courseDaysStr.includes('DCHJ') && [1, 3, 5].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('SPSH') && [2, 4, 6].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('HAR KUNI')) return true;

            const daysMap = { 'DUSHANBA': 1, 'SESHANBA': 2, 'CHORSHANBA': 3, 'PAYSHANBA': 4, 'JUMA': 5, 'SHANBA': 6, 'YAKSHANBA': 0 };
            return Object.keys(daysMap).some(day => courseDaysStr.includes(day) && daysMap[day] === dayOfWeek);
        }).slice(0, 5).map((course, index) => {
            const startTime = parseTimeToFloat(course.time);
            const endTime = parseEndTimeToFloat(course.time);

            // LIVE status - hozir dars bo'layotganmi?
            const isLive = startTime && endTime && currentTimeFloat >= startTime && currentTimeFloat < endTime;

            // Tugaganmi?
            const isFinished = endTime && currentTimeFloat >= endTime;

            // Kelajakdami?
            const isUpcoming = startTime && currentTimeFloat < startTime;

            // O'qituvchi ismini topish
            let teacherName = course.instructor || course.teacher || course.teacherName;
            if ((!teacherName || teacherName === 'Admin') && course.instructorId) {
                const teacherObj = teachers?.find(t => t.id === course.instructorId);
                if (teacherObj) teacherName = teacherObj.name;
            }

            return {
                id: course.id,
                name: course.title,
                teacher: teacherName || 'O\'qituvchi tayinlanmagan',
                time: course.time || '10:00 - 11:30',
                room: course.room || course.roomName || `${index + 1}-xona`,
                students: students.filter(s => s.assignedCourseId === course.id || s.courseId === course.id).length,
                color: course.color || ['#667eea', '#fa709a', '#43e97b', '#30cfd0', '#f093fb'][index % 5],
                isLive,
                isFinished,
                isUpcoming,
                startTime,
                endTime
            };
        }).sort((a, b) => {
            // Live darslar birinchi, keyin upcoming, keyin finished
            if (a.isLive && !b.isLive) return -1;
            if (!a.isLive && b.isLive) return 1;
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            return (a.startTime || 0) - (b.startTime || 0);
        });
    }, [courses, students]);

    // Formatli aktivliklar - real ma'lumotlardan
    const formattedActivities = useMemo(() => {
        return recentActivities.slice(0, 4).map(activity => {
            let icon = 'notifications-outline';
            let color = '#667eea';
            let text = activity.target || 'Yangi hodisa';

            // Icon va rangni harakat turiga qarab o'zgartirish
            if (activity.target?.includes('student') || activity.target?.includes('qo\'shildi')) {
                icon = 'person-add';
                color = '#667eea';
            } else if (activity.target?.includes('to\'lov') || activity.target?.includes('payment')) {
                icon = 'cash';
                color = '#43e97b';
            } else if (activity.target?.includes('course') || activity.target?.includes('guruh')) {
                icon = 'people';
                color = '#fa709a';
            } else if (activity.target?.includes('dars') || activity.target?.includes('class')) {
                icon = 'checkmark-circle';
                color = '#f5576c';
            }

            // Vaqtni hisoblash
            let timeText = 'Hozirgina';
            if (activity.createdAt?.seconds) {
                const diffMs = Date.now() - (activity.createdAt.seconds * 1000);
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                if (diffDays > 0) {
                    timeText = `${diffDays} kun oldin`;
                } else if (diffHours > 0) {
                    timeText = `${diffHours} soat oldin`;
                } else if (diffMins > 0) {
                    timeText = `${diffMins} daqiqa oldin`;
                }
            }

            return {
                icon,
                text,
                time: timeText,
                color
            };
        });
    }, [recentActivities]);

    // Student qo'shish
    const handleAddStudent = async () => {
        if (!studentName.trim() || !studentPhone.trim()) {
            Alert.alert('Xatolik', 'Ism va telefon raqamini kiriting');
            return;
        }

        const newStudent = {
            name: studentName.trim(),
            phone: studentPhone.trim(),
            course: studentCourse || 'Guruhsiz',
            balance: parseFloat(studentBalance) || 0,
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        if (addStudent) {
            await addStudent(newStudent);
        }

        // Reset form
        setStudentName('');
        setStudentPhone('');
        setStudentCourse('');
        setStudentBalance('');
        setStudentModalVisible(false);

        Alert.alert('Muvaffaqiyat', 'O\'quvchi muvaffaqiyatli qo\'shildi');
    };

    // Lead qo'shish
    const handleAddLead = async () => {
        if (!leadName.trim() || !leadPhone.trim()) {
            Alert.alert('Xatolik', 'Ism va telefon raqamini kiriting');
            return;
        }

        const newLead = {
            name: leadName.trim(),
            phone: leadPhone.trim(),
            source: leadSource || 'Boshqa',
            notes: leadNotes,
            status: 'Yangi'
        };

        if (addLead) {
            await addLead(newLead);
        }

        // Reset form
        setLeadName('');
        setLeadPhone('');
        setLeadSource('');
        setLeadNotes('');
        setLeadModalVisible(false);

        Alert.alert('Muvaffaqiyat', 'Lead muvaffaqiyatli qo\'shildi');
    };

    // KPI Card
    const KPICard = ({ item }) => (
        <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.kpiCard}
        >
            <View style={styles.kpiHeader}>
                <View style={styles.kpiIconBox}>
                    <Ionicons name={item.icon} size={24} color="#fff" />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: item.trendUp ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name={item.trendUp ? 'arrow-up' : 'time-outline'} size={12} color="#fff" />
                    <Text style={styles.trendText}>{item.trend}</Text>
                </View>
            </View>
            <Text style={styles.kpiValue}>{item.value}</Text>
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <View style={styles.kpiGlow} />
        </LinearGradient>
    );

    // Dars kartasi - premium dizayn
    const ClassCard = ({ item }) => {
        const getStatusBadge = () => {
            if (item.isLive) {
                return (
                    <View style={[styles.statusBadge, styles.liveBadge]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.statusBadgeText}>HOZIR BO'LMOQDA</Text>
                    </View>
                );
            }
            if (item.isFinished) {
                return (
                    <View style={[styles.statusBadge, styles.finishedBadge]}>
                        <Ionicons name="checkmark-done" size={12} color="#fff" />
                        <Text style={styles.statusBadgeText}>TUGADI</Text>
                    </View>
                );
            }
            if (item.isUpcoming) {
                return (
                    <View style={[styles.statusBadge, styles.upcomingBadge]}>
                        <Ionicons name="time" size={12} color="#fff" />
                        <Text style={styles.statusBadgeText}>KUTILMOQDA</Text>
                    </View>
                );
            }
            return null;
        };

        return (
            <TouchableOpacity
                style={[
                    styles.classCard,
                    {
                        backgroundColor: theme.surface,
                        borderLeftColor: item.isLive ? '#43e97b' : item.color,
                        elevation: item.isLive ? 4 : 1,
                        shadowOpacity: item.isLive ? 0.2 : 0.05,
                        opacity: item.isFinished ? 0.6 : 1,
                    }
                ]}
                onPress={() => {
                    const course = courses.find(c => c.id === item.id);
                    if (course) {
                        navigation.navigate('CourseDetail', { course });
                    }
                }}
                activeOpacity={0.8}
            >
                {/* Status Indicator */}
                <View style={styles.classCardContent}>
                    <View style={styles.classCardMain}>
                        <View style={styles.classHeaderRow}>
                            <View style={[styles.classDot, { backgroundColor: item.isLive ? '#43e97b' : item.color }]} />
                            <Text style={[styles.className, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        </View>

                        <View style={styles.teacherInfoRow}>
                            <Ionicons name="person-outline" size={14} color={theme.textLight} />
                            <Text style={[
                                styles.classTeacherText,
                                {
                                    color: item.teacher === "O'qituvchi tayinlanmagan" ? '#f5576c' : theme.textSecondary,
                                    fontStyle: item.teacher === "O'qituvchi tayinlanmagan" ? 'italic' : 'normal'
                                }
                            ]} numberOfLines={1}>
                                {item.teacher}
                            </Text>
                        </View>

                        <View style={styles.classDetailsRow}>
                            <View style={[styles.detailItem, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name="time-outline" size={14} color={item.color} />
                                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{item.time}</Text>
                            </View>

                            <View style={[styles.detailItem, { backgroundColor: `${COLORS.secondary}15` }]}>
                                <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
                                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{item.room}</Text>
                            </View>

                            <View style={[styles.detailItem, { backgroundColor: `${COLORS.success}15` }]}>
                                <Ionicons name="people-outline" size={14} color={COLORS.success} />
                                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{item.students} ta</Text>
                            </View>
                        </View>
                    </View>

                    {getStatusBadge()}
                </View>

                {item.isLive && (
                    <View style={[styles.liveIndicatorLine, { backgroundColor: '#43e97b' }]} />
                )}
            </TouchableOpacity>
        );
    };

    // Yangi modal dizayni - markazda
    const renderModal = (visible, onClose, title, children, onSave, gradient) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                    {/* Modal Header */}
                    <LinearGradient
                        colors={gradient}
                        style={styles.modalHeaderGradient}
                    >
                        <Text style={styles.modalHeaderTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Modal Content */}
                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {children}
                    </ScrollView>

                    {/* Modal Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton, { borderColor: theme.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Bekor qilish</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.footerButton}
                            onPress={onSave}
                        >
                            <LinearGradient
                                colors={gradient}
                                style={styles.saveButtonGradient}
                            >
                                <Text style={styles.saveButtonText}>Saqlash</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Input komponent
    const InputField = ({ label, value, onChangeText, placeholder, keyboardType, multiline, required }) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
                {label} {required && <Text style={{ color: '#f5576c' }}>*</Text>}
            </Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.textArea,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.textSecondary}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Yuqori Command Bar */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <Text style={[styles.welcomeText, { color: theme.text }]}>
                        Assalomu alaykum, <Text style={styles.userName}>{userInfo?.name || 'Admin'}</Text>
                    </Text>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <View style={styles.topBarRight}>
                    <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Qidirish..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.surface }]}
                        onPress={() => setNotificationsVisible(true)}
                    >
                        <Ionicons name="notifications-outline" size={20} color={theme.text} />
                        {formattedActivities.length > 0 && (
                            <View style={styles.notificationDot} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollViewStyle}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {/* Statistika KPI Cards */}
                <View style={styles.kpiGrid}>
                    {stats.map(stat => (
                        <KPICard key={stat.id} item={stat} />
                    ))}
                </View>

                {/* Asosiy Content Grid */}
                <View style={styles.mainGrid}>
                    {/* Chap: Bugungi Darslar */}
                    <View style={styles.leftColumn}>
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Bugungi Darslar</Text>
                                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                                        {upcomingClasses.length} ta faol dars
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('Schedule')}
                                >
                                    <Text style={styles.viewAllText}>Barchasi</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#667eea" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.classesGrid}>
                                {upcomingClasses.map(cls => (
                                    <ClassCard key={cls.id} item={cls} />
                                ))}
                            </View>
                        </View>

                        {/* Yangi O'quvchilar */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface, marginTop: 24 }]}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Yangi O'quvchilar</Text>
                                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                                        So'nggi 5 ta qo'shilgan
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('Students')}
                                >
                                    <Text style={styles.viewAllText}>Barchasi</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#667eea" />
                                </TouchableOpacity>
                            </View>
                            {students.slice(0, 5).map((student, i) => (
                                <View key={student.id} style={[styles.studentRow, i !== 0 && styles.studentRowBorder]}>
                                    <View style={styles.studentLeft}>
                                        <View style={[styles.studentAvatar, { backgroundColor: `${theme.primary}30` }]}>
                                            <Text style={[styles.studentAvatarText, { color: theme.primary }]}>
                                                {student.name[0]}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                                            <Text style={[styles.studentPhone, { color: theme.textSecondary }]}>{student.phone}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.studentRight}>
                                        <Text style={[styles.studentCourse, { color: theme.textSecondary }]}>
                                            {student.course || 'Guruhsiz'}
                                        </Text>
                                        <Text style={[styles.studentBalance, { color: student.balance < 0 ? '#f5576c' : '#43e97b' }]}>
                                            {student.balance || 0} so'm
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* O'ng: Statistika va Grafiklar */}
                    <View style={styles.rightColumn}>
                        {/* Tezkor Harakatlar */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Tezkor Harakatlar</Text>
                            <View style={styles.quickActionsGrid}>
                                <TouchableOpacity
                                    style={styles.quickActionButton}
                                    onPress={() => setStudentModalVisible(true)}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.quickActionGradient}
                                    >
                                        <Ionicons name="person-add" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.quickActionText, { color: theme.text }]}>O'quvchi Qo'shish</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionButton}
                                    onPress={() => setLeadModalVisible(true)}
                                >
                                    <LinearGradient
                                        colors={['#f093fb', '#f5576c']}
                                        style={styles.quickActionGradient}
                                    >
                                        <Ionicons name="person-add-outline" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.quickActionText, { color: theme.text }]}>Lead Qo'shish</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionButton}
                                    onPress={() => navigation.navigate('Courses')}
                                >
                                    <LinearGradient
                                        colors={['#4facfe', '#00f2fe']}
                                        style={styles.quickActionGradient}
                                    >
                                        <Ionicons name="people" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.quickActionText, { color: theme.text }]}>Guruh Yaratish</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionButton}
                                    onPress={() => navigation.navigate('Finance')}
                                >
                                    <LinearGradient
                                        colors={['#fa709a', '#fee140']}
                                        style={styles.quickActionGradient}
                                    >
                                        <Ionicons name="cash" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.quickActionText, { color: theme.text }]}>To'lov Qabul</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Oxirgi Aktivlik - Real ma'lumotlar */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface, marginTop: 24 }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Oxirgi Aktivlik</Text>
                            {formattedActivities.length > 0 ? (
                                formattedActivities.map((activity, i) => (
                                    <View key={i} style={[styles.activityRow, i !== 0 && { marginTop: 12 }]}>
                                        <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                                            <Ionicons name={activity.icon} size={18} color={activity.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.activityText, { color: theme.text }]}>{activity.text}</Text>
                                            <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{activity.time}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyActivities}>
                                    <Ionicons name="time-outline" size={40} color={theme.textSecondary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Hozircha aktivlik yo'q</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Student Modal */}
            {renderModal(
                studentModalVisible,
                () => setStudentModalVisible(false),
                'Yangi O\'quvchi Qo\'shish',
                <>
                    <InputField
                        label="F.I.SH"
                        value={studentName}
                        onChangeText={setStudentName}
                        placeholder="Masalan: Alisher Navoi"
                        required
                    />
                    <InputField
                        label="Telefon raqami"
                        value={studentPhone}
                        onChangeText={setStudentPhone}
                        placeholder="+998 90 123 45 67"
                        keyboardType="phone-pad"
                        required
                    />
                    <InputField
                        label="Guruhga biriktirish"
                        value={studentCourse}
                        onChangeText={setStudentCourse}
                        placeholder="Guruh nomini kiriting"
                    />
                    <InputField
                        label="To'lov rejasi"
                        value={studentBalance}
                        onChangeText={setStudentBalance}
                        placeholder="Oylik - 500,000 so'm"
                        keyboardType="default"
                    />
                </>,
                handleAddStudent,
                ['#667eea', '#764ba2']
            )}

            {/* Lead Modal */}
            {renderModal(
                leadModalVisible,
                () => setLeadModalVisible(false),
                'Yangi Talaba',
                <>
                    <InputField
                        label="F.I.SH"
                        value={leadName}
                        onChangeText={setLeadName}
                        placeholder="Masalan: Alisher Navoi"
                        required
                    />
                    <InputField
                        label="Telefon raqami"
                        value={leadPhone}
                        onChangeText={setLeadPhone}
                        placeholder="+998 90 123 45 67"
                        keyboardType="phone-pad"
                        required
                    />
                    <InputField
                        label="Guruhga biriktirish"
                        value={leadSource}
                        onChangeText={setLeadSource}
                        placeholder="Grafik design, Web 15, Web 22..."
                    />
                    <InputField
                        label="To'lov rejasi"
                        value={leadNotes}
                        onChangeText={setLeadNotes}
                        placeholder="Oylik, Individual, To'liq..."
                        multiline
                    />
                </>,
                handleAddLead,
                ['#f093fb', '#f5576c']
            )}

            {/* Notifications Modal */}
            <Modal
                visible={notificationsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setNotificationsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.notificationOverlay}
                    activeOpacity={1}
                    onPress={() => setNotificationsVisible(false)}
                >
                    <TouchableOpacity
                        style={[styles.notificationPanel, { backgroundColor: theme.surface }]}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={[styles.notificationHeader, { borderBottomColor: theme.border }]}>
                            <View>
                                <Text style={[styles.notificationTitle, { color: theme.text }]}>Bildirishnomalar</Text>
                                <Text style={[styles.notificationSubtitle, { color: theme.textSecondary }]}>
                                    {formattedActivities.length} ta yangi
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setNotificationsVisible(false)}
                                style={[styles.notificationCloseButton, { backgroundColor: theme.background }]}
                            >
                                <Ionicons name="close" size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Notifications List */}
                        <ScrollView
                            style={styles.notificationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {formattedActivities.length > 0 ? (
                                formattedActivities.map((activity, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.notificationItem, { borderBottomColor: theme.border }]}
                                        onPress={() => {
                                            setNotificationsVisible(false);
                                        }}
                                    >
                                        <View style={[styles.notificationIcon, { backgroundColor: activity.color + '20' }]}>
                                            <Ionicons name={activity.icon} size={20} color={activity.color} />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={[styles.notificationText, { color: theme.text }]} numberOfLines={2}>
                                                {activity.text}
                                            </Text>
                                            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                                                {activity.time}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyNotifications}>
                                    <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                        Bildirishnomalar yo'q
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        {formattedActivities.length > 0 && (
                            <TouchableOpacity
                                style={[styles.notificationFooter, { borderTopColor: theme.border }]}
                                onPress={() => {
                                    setNotificationsVisible(false);
                                }}
                            >
                                <Text style={[styles.notificationViewAll, { color: theme.primary }]}>
                                    Barchasini ko'rish
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    topBar: {
        height: 80,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
    },
    topBarLeft: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    userName: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 13,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 300,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        outlineStyle: 'none',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f5576c',
    },
    scrollViewStyle: {
        flex: 1,
    },
    scrollContent: {
        padding: 32,
        paddingBottom: 80,
    },
    kpiGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 32,
    },
    kpiCard: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 140,
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    kpiIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    kpiValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    kpiLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    kpiGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    mainGrid: {
        flexDirection: 'row',
        gap: 24,
    },
    leftColumn: {
        flex: 2,
    },
    rightColumn: {
        flex: 1,
    },
    sectionCard: {
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    classesGrid: {
        gap: 16,
    },
    classCard: {
        borderRadius: 20,
        padding: 16,
        paddingBottom: 20,
        borderLeftWidth: 6,
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    classCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    classCardMain: {
        flex: 1,
        marginRight: 10,
    },
    classHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    classDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    className: {
        fontSize: 17,
        fontWeight: '700',
    },
    teacherInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        paddingLeft: 2,
    },
    classTeacherText: {
        fontSize: 13,
        fontWeight: '500',
    },
    classDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    liveIndicatorLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveBadge: {
        backgroundColor: '#43e97b20',
        borderWidth: 1,
        borderColor: '#43e97b40',
    },
    finishedBadge: {
        backgroundColor: '#9ca3af15',
    },
    upcomingBadge: {
        backgroundColor: '#667eea15',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#43e97b',
    },
    livePulse: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#43e97b',
        opacity: 0.6,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    studentRowBorder: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    studentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    studentPhone: {
        fontSize: 12,
    },
    studentRight: {
        alignItems: 'flex-end',
    },
    studentCourse: {
        fontSize: 12,
        marginBottom: 2,
    },
    studentBalance: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionButton: {
        width: '48%',
        alignItems: 'center',
    },
    quickActionGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityText: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 11,
    },
    emptyActivities: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
    },
    // Yangi Modal Styles - Markazda
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 600,
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: '90%',
        ...Platform.select({
            web: {
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
            }
        }),
    },
    modalHeaderGradient: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 24,
        maxHeight: 400,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        borderWidth: 1,
        outlineStyle: 'none',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cancelButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Notification Modal Styles
    notificationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 90,
        paddingRight: 32,
    },
    notificationPanel: {
        width: 420,
        maxHeight: '80%',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificationSubtitle: {
        fontSize: 13,
    },
    notificationCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationList: {
        maxHeight: 400,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
    notificationTime: {
        fontSize: 12,
    },
    emptyNotifications: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        marginTop: 12,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        gap: 8,
    },
    notificationViewAll: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DashboardDesktop;
