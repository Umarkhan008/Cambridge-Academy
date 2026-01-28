import React, { useState, useContext, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Linking,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';

const getStudentStatuses = (isDarkMode) => ({
    'Active': { label: 'Faol', color: '#27AE60', bg: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' },
    'Waiting': { label: 'Kutilmoqda', color: '#F2994A', bg: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' },
    'Completed': { label: 'Bitirgan', color: '#5865F2', bg: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' },
    'Inactive': { label: 'Tark etgan', color: isDarkMode ? '#9CA3AF' : '#828282', bg: isDarkMode ? 'rgba(156, 163, 175, 0.15)' : '#F2F2F2' },
});

const StudentDetailScreen = ({ route, navigation }) => {
    const { student: initialStudent } = route.params;
    const { students, courses, finance, attendance, updateStudent, deleteStudent, addTransaction } = useContext(SchoolContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const STUDENT_STATUSES = getStudentStatuses(isDarkMode);
    const { showLoader, hideLoader } = useUI();

    // Use student from context to get latest updates
    const studentId = initialStudent?.id;
    const student = students.find(s => s.id === studentId) || initialStudent;

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [balanceModalVisible, setBalanceModalVisible] = useState(false);
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
    const [transactionType, setTransactionType] = useState('deposit'); // deposit or withdraw
    const [transactionAmount, setTransactionAmount] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State for editing
    const [name, setName] = useState(student.name);
    const [phone, setPhone] = useState(student.phone || '');
    const [email, setEmail] = useState(student.email || '');
    const [login, setLogin] = useState(student.login || '');
    const [password, setPassword] = useState(student.password || '');
    const [selectedCourseId, setSelectedCourseId] = useState(student.assignedCourseId);
    const [paymentPlan, setPaymentPlan] = useState(student.paymentPlan || 'Monthly');

    const status = STUDENT_STATUSES[student.status] || STUDENT_STATUSES['Active'];
    const assignedCourse = courses.find(c => c.id === student.assignedCourseId);
    const isDebtor = (student.balance || 0) < 0;

    // Filter recent payments for this student
    const studentPayments = useMemo(() => {
        return finance.filter(f =>
            f.studentId === student.id ||
            (f.studentName && f.studentName.toLowerCase() === student.name?.toLowerCase())
        ).slice(0, 5); // Show last 5
    }, [finance, student]);

    // Track student attendance history
    const studentAttendance = useMemo(() => {
        if (!attendance) return [];

        // Filter attendance records where this student is included
        const records = attendance.filter(record =>
            record.students && record.students[student.id]
        );

        // Map to a more useful format for display
        return records.map(record => ({
            id: record.id,
            date: record.date,
            courseName: record.courseName,
            status: record.students[student.id].status,
            reason: record.students[student.id].reason,
            note: record.students[student.id].note,
            timestamp: record.timestamp || 0
        })).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
    }, [attendance, student]);

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Xatolik', 'Ismni kiriting');
            return;
        }
        const courseObj = courses.find(c => c.id === selectedCourseId);
        const updatedData = {
            ...student,
            name,
            phone,
            email,
            login,
            password,
            assignedCourseId: selectedCourseId,
            course: courseObj ? courseObj.title : 'Guruhsiz',
            paymentPlan,
            status: selectedCourseId ? 'Active' : 'Waiting'
        };

        try {
            showLoader('Saqlanmoqda...');
            await updateStudent(student.id, updatedData);
            setEditModalVisible(false);
        } catch (error) {
            Alert.alert('Xatolik', 'Saqlashda xatolik yuz berdi');
        } finally {
            hideLoader();
        }
    };

    const handleTransaction = async () => {
        const amount = parseFloat(transactionAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Xatolik', 'To\'g\'ri summani kiriting');
            return;
        }

        const newBalance = transactionType === 'deposit'
            ? (student.balance || 0) + amount
            : (student.balance || 0) - amount;

        try {
            showLoader('Bajarilmoqda...');

            // Update student balance
            await updateStudent(student.id, { ...student, balance: newBalance });

            // Add to finance history
            await addTransaction({
                title: transactionType === 'deposit' ? 'To\'lov (Kirim)' : 'To\'lov (Chiqim)',
                amount: `${transactionType === 'deposit' ? '+' : '-'}${amount.toLocaleString()} UZS`,
                type: transactionType === 'deposit' ? 'Income' : 'Expense',
                studentId: student.id,
                studentName: student.name,
                category: 'Tuition'
            });

            setTransactionAmount('');
            setBalanceModalVisible(false);
        } finally {
            hideLoader();
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            'O\'chirish',
            'Haqiqatdan ham bu o\'quvchini o\'chirmoqchimisiz?',
            [
                { text: 'Yo\'q' },
                {
                    text: 'Ha', style: 'destructive', onPress: async () => {
                        try {
                            showLoader('O\'chirilmoqda...');
                            await deleteStudent(student.id);
                            navigation.goBack();
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const InfoRow = ({ icon, label, value, isPassword }) => (
        <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FE' }]}>
                <Ionicons name={icon} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                    {isPassword && !showPassword ? '••••••••' : (value || 'Kiritilmagan')}
                </Text>
            </View>
            {isPassword && (
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={theme.textLight} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8F9FE' }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Talaba Profili</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(true)} style={[styles.editBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="pencil-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
                    <View style={[styles.avatarLarge, { backgroundColor: status.color + '15' }]}>
                        <Text style={[styles.avatarLargeText, { color: status.color }]}>
                            {student.name ? student.name[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Balance & Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statValue, { color: isDebtor ? theme.error : theme.success }]}>
                            {Math.abs(student.balance || 0).toLocaleString()}
                            <Text style={[styles.statCurrency, { color: theme.textLight }]}> UZS</Text>
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{isDebtor ? 'Qarzdorlik' : 'Balans'}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {student.attendanceRate || 0}%
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Davomat</Text>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => Linking.openURL(`tel:${student.phone}`)}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE' }]}>
                            <Ionicons name="call" size={24} color="#27AE60" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Qo'ng'iroq</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => { setTransactionType('deposit'); setBalanceModalVisible(true); }}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(242, 153, 74, 0.15)' : '#FFF4E8' }]}>
                            <Ionicons name="wallet" size={24} color="#F2994A" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>To'lov</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => setAttendanceModalVisible(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(88, 101, 242, 0.15)' : '#EEF0FF' }]}>
                            <Ionicons name="clipboard-outline" size={24} color="#5865F2" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Davomat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={confirmDelete}>
                        <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFF0F0' }]}>
                            <Ionicons name="trash" size={24} color={theme.error} />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>O'chirish</Text>
                    </TouchableOpacity>
                </View>

                {/* Group Details Card */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Guruh Ma'lumotlari</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {assignedCourse ? (
                        <View style={styles.courseContent}>
                            <View style={[styles.courseIcon, { backgroundColor: (assignedCourse.color || theme.primary) + '15' }]}>
                                <Ionicons name="book" size={24} color={assignedCourse.color || theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.courseTitle, { color: theme.text }]}>{assignedCourse.title}</Text>
                                <Text style={[styles.courseSubtitle, { color: theme.textSecondary }]}>{assignedCourse.instructor || 'O\'qituvchi noma\'lum'}</Text>
                                <View style={styles.courseMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={theme.textLight} />
                                        <Text style={[styles.metaText, { color: theme.textLight }]}>{assignedCourse.time}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.textLight} />
                                        <Text style={[styles.metaText, { color: theme.textLight }]}>{assignedCourse.days}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noGroup}>
                            <Text style={[styles.noGroupText, { color: theme.textLight }]}>Hech qanday guruhga biriktirilmagan</Text>
                            <TouchableOpacity style={styles.assignLink} onPress={() => setEditModalVisible(true)}>
                                <Text style={[styles.assignLinkText, { color: theme.primary }]}>Guruhga qo'shish +</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Finance Info Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>To'lov Ma'lumotlari</Text>
                </View>
                <View style={[styles.financeCard, { backgroundColor: theme.surface }]}>
                    {assignedCourse ? (
                        <>
                            <View style={styles.financeRow}>
                                <View style={styles.financeItem}>
                                    <Text style={[styles.financeLabel, { color: theme.textSecondary }]}>Oylik to'lov</Text>
                                    <View style={styles.financeValueRow}>
                                        <Ionicons name="card-outline" size={18} color={theme.primary} />
                                        <Text style={[styles.financeValue, { color: theme.text }]}>
                                            {(() => {
                                                const p = assignedCourse.price;
                                                const num = typeof p === 'string' ? parseFloat(p.replace(/[^\d]/g, '')) : p;
                                                return isNaN(num) ? 'Kiritilmagan' : num.toLocaleString() + ' UZS';
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.financeDivider, { backgroundColor: theme.border }]} />
                                <View style={styles.financeItem}>
                                    <Text style={[styles.financeLabel, { color: theme.textSecondary }]}>Kunlik yechim</Text>
                                    <View style={styles.financeValueRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#27AE60" />
                                        <Text style={[styles.financeValue, { color: theme.text }]}>
                                            {(() => {
                                                const p = assignedCourse.price;
                                                const num = typeof p === 'string' ? parseFloat(p.replace(/[^\d]/g, '')) : p;
                                                if (isNaN(num)) return '0 UZS';
                                                // Assuming 12 lessons per month for standard courses
                                                return Math.round(num / 12).toLocaleString() + ' UZS';
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.debtStatusBox, { backgroundColor: isDebtor ? (isDarkMode ? 'rgba(239,68,68,0.15)' : '#FFF0F0') : (isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE') }]}>
                                <Ionicons
                                    name={isDebtor ? "alert-circle" : "checkmark-circle"}
                                    size={20}
                                    color={isDebtor ? theme.error : '#27AE60'}
                                />
                                <Text style={[styles.debtStatusText, { color: isDebtor ? theme.error : '#27AE60' }]}>
                                    {isDebtor
                                        ? `Diqqat! ${Math.abs(student.balance || 0).toLocaleString()} UZS qarzdorlik bor`
                                        : "Talaba balansi ijobiy holatda"
                                    }
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.noGroupFinance}>
                            <Ionicons name="information-circle-outline" size={32} color="#BDBDBD" />
                            <Text style={styles.noGroupText}>To'lov ma'lumotlari uchun guruhga qo'shing</Text>
                        </View>
                    )}
                </View>

                {/* Credentials & Contact Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ma'lumotlar va Kirish</Text>
                </View>
                <View style={styles.infoList}>
                    <InfoRow icon="call-outline" label="Telefon" value={student.phone} />
                    <InfoRow icon="mail-outline" label="Email" value={student.email} />
                    <InfoRow icon="person-outline" label="Login" value={student.login} />
                    <InfoRow icon="lock-closed-outline" label="Parol" value={student.password} isPassword={true} />
                    <InfoRow icon="card-outline" label="To'lov rejasi" value={student.paymentPlan === 'Full' ? 'To\'liq' : (student.paymentPlan === 'Monthly' ? 'Oylik' : 'Individual')} />
                    <InfoRow icon="time-outline" label="Qo'shilgan sana" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Noma\'lum'} />
                </View>

                {/* Recent Payments Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Oxirgi To'lovlar</Text>
                </View>
                <View style={styles.paymentList}>
                    {studentPayments.length > 0 ? (
                        studentPayments.map((payment, index) => (
                            <View key={payment.id || index} style={[styles.paymentCard, { backgroundColor: theme.surface }]}>
                                <View style={[styles.paymentIcon, { backgroundColor: payment.type === 'Income' ? (isDarkMode ? 'rgba(39, 174, 96, 0.15)' : '#E8F7EE') : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFF0F0') }]}>
                                    <Ionicons
                                        name={payment.type === 'Income' ? "arrow-down" : "arrow-up"}
                                        size={20}
                                        color={payment.type === 'Income' ? "#27AE60" : theme.error}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.paymentTitle, { color: theme.text }]}>{payment.title}</Text>
                                    <Text style={[styles.paymentDate, { color: theme.textSecondary }]}>{payment.date}</Text>
                                </View>
                                <Text style={[styles.paymentAmount, { color: payment.type === 'Income' ? "#27AE60" : theme.error }]}>
                                    {payment.amount}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyPayments}>
                            <Text style={[styles.emptyPaymentsText, { color: theme.textLight }]}>Hali to'lovlar mavjud emas</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modals */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Profilni Tahrirlash</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>F.I.SH *</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Telefon raqami</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />

                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            <View style={styles.rowBetween}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Login</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        value={login}
                                        onChangeText={setLogin}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Parol</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Guruhni tanlang</Text>
                            <View style={styles.chipRow}>
                                {courses.map(course => (
                                    <TouchableOpacity
                                        key={course.id}
                                        style={[styles.courseChip, selectedCourseId === course.id && styles.activeCourseChip]}
                                        onPress={() => setSelectedCourseId(course.id)}
                                    >
                                        <Text style={[styles.courseChipText, selectedCourseId === course.id && styles.activeCourseChipText]}>
                                            {course.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                                <Text style={styles.saveBtnText}>O'zgarishlarni Saqlash</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Balance Modal */}
            <Modal
                visible={balanceModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setBalanceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredModal}>
                        <View style={[styles.balanceModal, { backgroundColor: theme.surface }]}>
                            <Text style={styles.balanceModalTitle}>
                                {transactionType === 'deposit' ? 'Balansni to\'ldirish' : 'Qarzdorlikni yopish'}
                            </Text>
                            <TextInput
                                style={styles.balanceInput}
                                placeholder="Summani kiriting (UZS)"
                                keyboardType="numeric"
                                autoFocus
                                value={transactionAmount}
                                onChangeText={setTransactionAmount}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBalanceModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: COLORS.primary }]} onPress={handleTransaction}>
                                    <Text style={styles.confirmBtnText}>Tasdiqlash</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            {/* Attendance Modal */}
            <Modal
                visible={attendanceModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAttendanceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background, height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Davomat Tarixi</Text>
                                <Text style={styles.modalSubTitle}>{student.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                            {studentAttendance.length > 0 ? (
                                studentAttendance.map((record, index) => (
                                    <View key={record.id || index} style={[styles.attendanceCard, { backgroundColor: theme.surface }]}>
                                        <View style={[styles.attendanceStatusDot, { backgroundColor: record.status === 'Present' ? '#27AE60' : '#EB5757' }]} />
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.rowBetween}>
                                                <Text style={[styles.attendanceDate, { color: theme.text }]}>{record.date}</Text>
                                                <Text style={[styles.attendanceStatusText, { color: record.status === 'Present' ? '#27AE60' : '#EB5757' }]}>
                                                    {record.status === 'Present' ? 'Kelgan' : 'Kelmagan'}
                                                </Text>
                                            </View>
                                            <Text style={styles.attendanceCourse}>{record.courseName}</Text>
                                            {(record.reason || record.note) && (
                                                <View style={styles.attendanceDetailBox}>
                                                    <Text style={styles.attendanceDetailText}>
                                                        {record.reason ? `${t[record.reason] || record.reason}` : ''}
                                                        {record.reason && record.note ? ' • ' : ''}
                                                        {record.note}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
                                    <Text style={styles.emptyText}>Davomat ma'lumotlari topilmadi</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        justifyContent: 'space-between',
        backgroundColor: 'white'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    // Simplified BackBtn
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FE' },
    editBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },

    // ... all old styles kept ...

    // Add missing or needed styles for safety inside StyleSheet
    scrollContent: { paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 20, backgroundColor: 'white', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    avatarLargeText: { fontSize: 40, fontWeight: 'bold' },
    studentName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 15 },
    statBox: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statCurrency: { fontSize: 12, color: '#828282' },
    statLabel: { fontSize: 12, color: '#828282', fontWeight: '500' },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25 },
    actionItem: { alignItems: 'center', gap: 10 },
    actionIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12, color: '#828282', fontWeight: '500' },
    sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    card: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    courseContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    courseIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    courseTitle: { fontSize: 18, fontWeight: 'bold' },
    courseSubtitle: { fontSize: 13, color: '#828282', marginVertical: 2 },
    courseMeta: { flexDirection: 'row', gap: 15, marginTop: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#828282' },
    noGroup: { alignItems: 'center', paddingVertical: 10 },
    noGroupText: { color: '#828282', fontSize: 14 },
    assignLink: { marginTop: 10 },
    assignLinkText: { color: COLORS.primary, fontWeight: 'bold' },
    infoList: { marginHorizontal: 20, gap: 12 },
    infoItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, gap: 15 },
    infoIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8F9FE', alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 12, color: '#828282', marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },
    paymentList: { marginHorizontal: 20, gap: 12 },
    paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 15 },
    paymentIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    paymentTitle: { fontSize: 15, fontWeight: 'bold' },
    paymentDate: { fontSize: 12, color: '#828282', marginTop: 2 },
    paymentAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyPayments: { alignItems: 'center', padding: 30 },
    emptyPaymentsText: { color: '#828282', fontSize: 14 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    // Finance Card Styles
    financeCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    financeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    financeItem: { flex: 1 },
    financeLabel: { fontSize: 13, color: '#828282', marginBottom: 8, fontWeight: '500' },
    financeValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    financeValue: { fontSize: 16, fontWeight: '700' },
    financeDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0', mx: 15 },
    debtStatusBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, gap: 10 },
    debtStatusText: { fontSize: 13, fontWeight: '600' },
    noGroupFinance: { alignItems: 'center', paddingVertical: 10, gap: 10 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#828282', marginBottom: 8, marginTop: 15 },
    modalInput: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 20 },
    courseChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F2' },
    activeCourseChip: { backgroundColor: COLORS.primary },
    courseChipText: { color: '#828282', fontSize: 13 },
    activeCourseChipText: { color: 'white', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#1F2022', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    // Balance Modal styles
    centeredModal: { flex: 1, justifyContent: 'center', padding: 20 },
    balanceModal: { padding: 24, borderRadius: 32, alignItems: 'center' },
    balanceModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    balanceInput: { width: '100%', height: 60, fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.primary, marginBottom: 30 },
    modalActions: { flexDirection: 'row', gap: 15 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F2' },
    cancelBtnText: { fontWeight: 'bold', color: '#828282' },
    confirmBtn: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { fontWeight: 'bold', color: 'white' },
    // Attendance Modal Specific Styles
    modalSubTitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    attendanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    attendanceStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
    attendanceDate: { fontSize: 16, fontWeight: '700' },
    attendanceStatusText: { fontSize: 14, fontWeight: '600' },
    attendanceCourse: { fontSize: 12, color: '#828282', marginTop: 2 },
    attendanceDetailBox: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F2',
    },
    attendanceDetailText: { fontSize: 12, color: '#5865F2', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, opacity: 0.5 }
});

export default StudentDetailScreen;
