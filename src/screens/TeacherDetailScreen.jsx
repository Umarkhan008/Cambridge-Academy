import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { SchoolContext } from '../context/SchoolContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';

const TEACHER_STATUSES = {
    'Active': { label: 'Faol', color: '#27AE60', bg: '#E8F7EE' },
    'On Leave': { label: 'Ta’til', color: '#F2994A', bg: '#FFF4E8' },
    'Inactive': { label: 'Faol emas', color: '#EB5757', bg: '#FFF0F0' },
};

const TeacherDetailScreen = ({ route, navigation }) => {
    const { teacher: initialTeacher } = route.params;
    const { teachers, courses, updateTeacher } = useContext(SchoolContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { showLoader, hideLoader } = useUI();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    // Get latest teacher data
    const teacher = teachers.find(t => t.id === initialTeacher.id) || initialTeacher;

    const [showPassword, setShowPassword] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    // Edit Form State
    const [name, setName] = useState(teacher.name);
    const [specialty, setSpecialty] = useState(teacher.subject || '');
    const [phone, setPhone] = useState(teacher.phone || '');
    const [email, setEmail] = useState(teacher.email || '');
    const [login, setLogin] = useState(teacher.login || '');
    const [password, setPassword] = useState(teacher.password || '');
    const [salaryType, setSalaryType] = useState(teacher.salaryType || 'Fixed');
    const [bio, setBio] = useState(teacher.bio || '');

    useEffect(() => {
        // Sync local state if teacher changes (e.g. after update)
        setName(teacher.name);
        setSpecialty(teacher.subject || '');
        setPhone(teacher.phone || '');
        setEmail(teacher.email || '');
        setLogin(teacher.login || '');
        setPassword(teacher.password || '');
        setSalaryType(teacher.salaryType || 'Fixed');
        setBio(teacher.bio || '');
    }, [teacher]);

    const assignedCourses = useMemo(() => {
        return courses.filter(course => teacher.assignedCourses?.includes(course.id));
    }, [courses, teacher]);

    const status = TEACHER_STATUSES[teacher.status] || TEACHER_STATUSES['Active'];

    const copyToClipboard = async (text, label) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Nusxalandi', `${label} buferga olindi`);
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Xatolik', 'Ismni kiriting');
            return;
        }

        const updatedData = {
            ...teacher,
            name,
            subject: specialty,
            phone,
            email,
            login,
            password,
            salaryType,
            bio
        };

        showLoader('Saqlanmoqda...');
        await updateTeacher(teacher.id, updatedData);
        setEditModalVisible(false);
        hideLoader();
    };


    const InfoCard = ({ icon, label, value, color = COLORS.primary }) => (
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{value || 'Kiritilmagan'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? theme.background : 'white'} />
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : 'white' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>O'qituvchi Profili</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
                    <Ionicons name="pencil-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarLarge, { backgroundColor: COLORS.primary + '10' }]}>
                            {teacher.avatar ? (
                                <Image source={{ uri: teacher.avatar }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarLetter}>{teacher.name[0]}</Text>
                            )}
                        </View>
                        <View style={[styles.statusPoint, { backgroundColor: status.color }]} />
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>{teacher.name}</Text>
                    <Text style={styles.specialty}>{teacher.subject || 'Instruktor'}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Primary Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.primary }]}>{assignedCourses.length}</Text>
                        <Text style={styles.statLab}>Guruhlar</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.success }]}>96%</Text>
                        <Text style={styles.statLab}>Davomat</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.statVal, { color: COLORS.warning }]}>4.9/5</Text>
                        <Text style={styles.statLab}>Reyting</Text>
                    </View>
                </View>

                {/* Salary Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ish haqi va Shartnoma</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.salaryRow}>
                        <View style={styles.salaryInfo}>
                            <Text style={styles.salaryLabel}>To'lov turi</Text>
                            <Text style={[styles.salaryVal, { color: theme.text }]}>
                                {teacher.salaryType === 'Percentage' ? 'Foizli (50%)' : 'Fiksirlangan'}
                            </Text>
                        </View>
                        <View style={styles.salaryDivider} />
                        <View style={styles.salaryInfo}>
                            <Text style={styles.salaryLabel}>Kutilmoqda (Yanvar)</Text>
                            <Text style={[styles.salaryVal, { color: COLORS.success }]}>4,200,000 UZS</Text>
                        </View>
                    </View>
                </View>

                {/* Credentials */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tizimga kirish</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity style={styles.credentialRow} onPress={() => copyToClipboard(teacher.login, 'Login')}>
                        <View style={styles.credLeft}>
                            <Feather name="user" size={18} color="#828282" />
                            <Text style={[styles.credVal, { color: theme.text }]}>{teacher.login || 'belgilanmagan'}</Text>
                        </View>
                        <Feather name="copy" size={16} color="#BDBDBD" />
                    </TouchableOpacity>
                    <View style={styles.hDivider} />
                    <View style={styles.credentialRow}>
                        <TouchableOpacity style={styles.credLeft} onPress={() => copyToClipboard(teacher.password, 'Parol')}>
                            <Feather name="lock" size={18} color="#828282" />
                            <Text style={[styles.credVal, { color: theme.text }]}>
                                {showPassword ? teacher.password : '••••••••'}
                            </Text>
                            <Feather name="copy" size={16} color="#BDBDBD" style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#828282" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Groups & Schedule */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Guruhlar va Jadval</Text>
                </View>
                <View style={styles.groupsList}>
                    {assignedCourses.length > 0 ? (
                        assignedCourses.map(course => (
                            <TouchableOpacity
                                key={course.id}
                                style={[styles.groupCard, { backgroundColor: theme.surface }]}
                                onPress={() => navigation.navigate('CourseDetail', { course: course })}
                            >
                                <View style={[styles.groupIcon, { backgroundColor: (course.color || COLORS.primary) + '15' }]}>
                                    <Ionicons name="book" size={24} color={course.color || COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.groupName, { color: theme.text }]}>{course.title}</Text>
                                    <View style={styles.groupMetaRow}>
                                        <View style={styles.metaCol}>
                                            <Feather name="calendar" size={12} color="#828282" />
                                            <Text style={styles.metaText}>{course.days}</Text>
                                        </View>
                                        <View style={styles.metaCol}>
                                            <Feather name="clock" size={12} color="#828282" />
                                            <Text style={styles.metaText}>{course.time}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.groupAction}>
                                    <Feather name="chevron-right" size={20} color="#BDBDBD" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                            <Text style={styles.emptyText}>Hozircha guruhlar yo'q</Text>
                        </View>
                    )}
                </View>

                {/* Contact Info */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bog'lanish</Text>
                </View>
                <View style={styles.contactList}>
                    <InfoCard icon="call-outline" label="Telefon" value={teacher.phone} color="#27AE60" />
                    <InfoCard icon="mail-outline" label="Email" value={teacher.email || 'Kiritilmagan'} color="#5865F2" />
                </View>

                {/* Tags & Notes */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Eshlatmalar</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={styles.notesText}>
                        {teacher.bio || 'O‘qituvchi haqida qo‘shimcha ma’lumotlar kiritilmagan.'}
                    </Text>
                    <View style={styles.tagsRow}>
                        {['Senior', 'IELTS 8.5', 'Expert'].map(tag => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Profilni Tahrirlash</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>F.I.SH *</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.inputLabel}>Mutaxassislik *</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                value={specialty}
                                onChangeText={setSpecialty}
                            />

                            <Text style={styles.inputLabel}>Telefon raqami</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />

                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            <View style={styles.rowBetween}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>Login</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                        value={login}
                                        onChangeText={setLogin}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Parol</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: theme.surface }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>To'lov turi</Text>
                            <View style={styles.radioGroup}>
                                {['Fixed', 'Percentage'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.radioBtn, salaryType === type && styles.activeRadio]}
                                        onPress={() => setSalaryType(type)}
                                    >
                                        <Text style={[styles.radioText, salaryType === type && styles.activeRadioText]}>
                                            {type === 'Fixed' ? 'Fiksirlangan' : 'Foizli'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Bio / Eshlatma</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.surface, height: 100, textAlignVertical: 'top', paddingTop: 15 }]}
                                multiline
                                numberOfLines={4}
                                value={bio}
                                onChangeText={setBio}
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                                <Text style={styles.saveBtnText}>O'zgarishlarni Saqlash</Text>
                            </TouchableOpacity>
                            <View style={{ height: 50 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'space-between', backgroundColor: 'white' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FE' },
    editBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },
    scrollContent: { paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'white', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatarLarge: { width: 110, height: 110, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarLetter: { fontSize: 44, fontWeight: 'bold', color: COLORS.primary },
    statusPoint: { position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: 'white' },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
    specialty: { fontSize: 15, color: '#828282', marginBottom: 15 },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, gap: 12 },
    statItem: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statVal: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statLab: { fontSize: 11, color: '#828282', fontWeight: '500' },
    sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2022' },
    card: { marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    salaryRow: { flexDirection: 'row', alignItems: 'center' },
    salaryInfo: { flex: 1, alignItems: 'center' },
    salaryDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
    salaryLabel: { fontSize: 11, color: '#828282', marginBottom: 5 },
    salaryVal: { fontSize: 15, fontWeight: 'bold' },
    credentialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    credLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    credVal: { fontSize: 15, fontWeight: '500' },
    hDivider: { height: 1, backgroundColor: '#F2F2F2', marginVertical: 12 },
    groupsList: { marginHorizontal: 20, gap: 12 },
    groupCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 15 },
    groupIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    groupName: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    groupMetaRow: { flexDirection: 'row', gap: 15 },
    metaCol: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 12, color: '#828282' },
    groupAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    emptyCard: { padding: 20, borderRadius: 20, alignItems: 'center' },
    emptyText: { color: '#BDBDBD', fontStyle: 'italic' },
    contactList: { marginHorizontal: 20, gap: 12 },
    infoCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, gap: 18 },
    infoIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 12, color: '#828282', marginBottom: 3 },
    infoValue: { fontSize: 16, fontWeight: '600' },
    notesText: { fontSize: 14, color: '#4F4F4F', lineHeight: 22, marginBottom: 20 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F2F2F2' },
    tagText: { fontSize: 12, color: '#828282', fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#828282', marginBottom: 8, marginTop: 15 },
    modalInput: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
    activeRadio: { backgroundColor: '#1F2022' },
    radioText: { color: '#828282', fontWeight: '600' },
    activeRadioText: { color: 'white' },
    saveBtn: { backgroundColor: '#1F2022', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

});

export default TeacherDetailScreen;
