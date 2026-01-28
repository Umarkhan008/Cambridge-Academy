import React, { useState, useContext, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Text,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import ScreenHeader from '../components/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

const TEACHER_STATUSES = {
    'Active': { label: 'Faol', color: '#27AE60', bg: '#E8F7EE' },
    'On Leave': { label: 'Ta’til', color: '#F2994A', bg: '#FFF4E8' },
    'Inactive': { label: 'Faol emas', color: '#EB5757', bg: '#FFF0F0' },
    'No Groups': { label: 'Guruhsiz', color: '#828282', bg: '#F2F2F2' }
};

const TeachersScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { teachers, courses, addTeacher, updateTeacher, deleteTeacher } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();
    const isDesktop = width >= 1280;

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Active, NoGroups, OnLeave, Inactive
    const [modalVisible, setModalVisible] = useState(false);

    // Step-based Add Flow State
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [phone, setPhone] = useState('');
    const [salaryType, setSalaryType] = useState('Fixed'); // Fixed, Percentage
    const [hoursPerWeek, setHoursPerWeek] = useState('20');

    const filteredTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            const matchesSearch = teacher.name.toLowerCase().includes(search.toLowerCase()) ||
                (teacher.subject || '').toLowerCase().includes(search.toLowerCase());

            let matchesFilter = true;
            if (activeFilter === 'NoGroups') {
                matchesFilter = !(teacher.assignedCourses && teacher.assignedCourses.length > 0);
            } else if (activeFilter !== 'All') {
                // Map filter to status keys
                const filterMap = { 'Active': 'Active', 'OnLeave': 'On Leave', 'Inactive': 'Inactive' };
                matchesFilter = teacher.status === filterMap[activeFilter];
            }
            return matchesSearch && matchesFilter;
        });
    }, [teachers, search, activeFilter]);

    const handleAddTeacher = async () => {
        if (!name || !specialty) {
            Alert.alert('Xatolik', 'Iltimos, ism va mutaxassislikni kiriting');
            return;
        }

        const teacherData = {
            name,
            subject: specialty,
            phone,
            salaryType,
            weeklyHours: parseInt(hoursPerWeek),
            status: 'Active',
            assignedCourses: [],
            students: 0,
            createdAt: new Date().toISOString()
        };

        showLoader('Qo‘shilmoqda...');
        await addTeacher(teacherData);
        hideLoader();
        closeModal();
    };

    const closeModal = () => {
        setModalVisible(false);
        setStep(1);
        setName('');
        setSpecialty('');
        setPhone('');
        setSalaryType('Fixed');
        setHoursPerWeek('20');
    };

    const TeacherRow = ({ item }) => {
        const status = TEACHER_STATUSES[item.status] || TEACHER_STATUSES['Active'];
        const groupsCount = item.assignedCourses?.length || 0;
        const studentsCount = item.students || 0;
        const weeklyHours = item.weeklyHours || 0;
        const isOverloaded = weeklyHours > 40;

        return (
            <TouchableOpacity
                style={[styles.teacherRow, { backgroundColor: theme.surface }]}
                onPress={() => navigation.navigate('TeacherDetail', { teacher: item })}
            >
                <View style={[styles.avatarBox, { backgroundColor: COLORS.primary + '10' }]}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                    )}
                </View>

                <View style={styles.infoCol}>
                    <Text style={[styles.teacherName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={styles.teacherSub}>{item.subject || 'Instruktor'}</Text>

                    <View style={styles.statsMiniRow}>
                        <View style={styles.statMini}>
                            <Feather name="layers" size={12} color="#828282" />
                            <Text style={styles.statMiniText}>{groupsCount} guruh</Text>
                        </View>
                        <View style={styles.statMini}>
                            <Feather name="users" size={12} color="#828282" />
                            <Text style={styles.statMiniText}>{studentsCount} talaba</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>

                    <View style={styles.workloadBox}>
                        <Text style={[styles.hoursText, isOverloaded && { color: COLORS.error }]}>
                            {weeklyHours} s/hafta
                        </Text>
                        {isOverloaded && <Feather name="alert-triangle" size={12} color={COLORS.error} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <View style={styles.container}>
                {/* Premium Header with safe area */}
                <ScreenHeader
                    title="O'qituvchi"
                    subtitle="Instruktorlarni boshqarish"
                    showBack={true}
                    rightAction={
                        isDesktop ? (
                            <TouchableOpacity
                                style={styles.desktopAddButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.desktopAddButtonGradient}
                                >
                                    <Ionicons name="add" size={22} color="#fff" />
                                    <Text style={styles.desktopAddButtonText}>Yangi O'qituvchi</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.headerBtn, { backgroundColor: theme.surface }]}
                                onPress={() => {/* filter logic if any */ }}
                            >
                                <Ionicons name="filter-outline" size={22} color={theme.text} />
                            </TouchableOpacity>
                        )
                    }
                />

                {/* Search */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color="#BDBDBD" />
                        <TextInput
                            placeholder="Qidirish..."
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {[
                            { id: 'All', label: 'Barchasi' },
                            { id: 'Active', label: 'Faol' },
                            { id: 'NoGroups', label: 'Guruhsiz' },
                            { id: 'OnLeave', label: 'Ta’til' },
                            { id: 'Inactive', label: 'Faol emas' }
                        ].map(f => (
                            <TouchableOpacity
                                key={f.id}
                                style={[styles.filterChip, activeFilter === f.id && styles.activeFilterChip]}
                                onPress={() => setActiveFilter(f.id)}
                            >
                                <Text style={[styles.filterText, activeFilter === f.id && styles.activeFilterText]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                <FlatList
                    data={filteredTeachers}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <TeacherRow item={item} />}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Feather name="user-x" size={48} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Ma'lumot topilmadi</Text>
                        </View>
                    }
                />

                {/* FAB */}
                {!isDesktop && (
                    <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                )}

                {/* Add Teacher Modal */}
                <Modal visible={modalVisible} animationType={isDesktop ? "fade" : "slide"} transparent={true} onRequestClose={closeModal}>
                    <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayCentered]}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={isDesktop ? styles.modalDesktopContainer : { width: '100%' }}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.background }, isDesktop && styles.modalContentDesktop]}>
                                {isDesktop ? (
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.modalHeaderGradient}
                                    >
                                        <Text style={styles.modalHeaderTitle}>Yangi O'qituvchi Qo'shish</Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                                            <Ionicons name="close" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.modalHeader}>
                                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                                            Yangi o'qituvchi ({step}/2)
                                        </Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                            <Ionicons name="close" size={24} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <ScrollView showsVerticalScrollIndicator={false} style={isDesktop && styles.modalBodyDesktop}>
                                    <View style={isDesktop ? styles.desktopRow : null}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.text }]}>F.I.SH *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                placeholder="Masalan: Ali Valiyev"
                                                placeholderTextColor={theme.textLight}
                                                value={name}
                                                onChangeText={setName}
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.text }]}>Mutaxassislik *</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                placeholder="Masalan: Senior Frontend"
                                                placeholderTextColor={theme.textLight}
                                                value={specialty}
                                                onChangeText={setSpecialty}
                                            />
                                        </View>
                                    </View>

                                    <View style={isDesktop ? styles.desktopRow : null}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.text }]}>Telefon raqami</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                placeholder="+998 90 123 45 67"
                                                placeholderTextColor={theme.textLight}
                                                keyboardType="phone-pad"
                                                value={phone}
                                                onChangeText={setPhone}
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.text }]}>Haftalik dars soati</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                keyboardType="numeric"
                                                value={hoursPerWeek}
                                                onChangeText={setHoursPerWeek}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>To'lov turi</Text>
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
                                    </View>

                                    {!isDesktop && step === 1 && (
                                        <TouchableOpacity style={styles.submitBtn} onPress={() => setStep(2)}>
                                            <Text style={styles.submitBtnText}>Keyingisi</Text>
                                        </TouchableOpacity>
                                    )}

                                    {(isDesktop || step === 2) && (
                                        <View style={styles.modalFooter}>
                                            {!isDesktop && (
                                                <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
                                                    <Text style={styles.backLinkText}>Orqaga</Text>
                                                </TouchableOpacity>
                                            )}
                                            {isDesktop ? (
                                                <View style={styles.desktopFooter}>
                                                    <TouchableOpacity
                                                        style={[styles.footerButton, styles.cancelButton, { borderColor: theme.border }]}
                                                        onPress={closeModal}
                                                    >
                                                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Bekor qilish</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.footerButton} onPress={handleAddTeacher}>
                                                        <LinearGradient
                                                            colors={['#667eea', '#764ba2']}
                                                            style={styles.saveButtonGradient}
                                                        >
                                                            <Text style={styles.saveButtonText}>Saqlash</Text>
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={handleAddTeacher}>
                                                    <Text style={styles.submitBtnText}>Saqlash</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                    <View style={{ height: 20 }} />
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
    backBtn: { marginRight: 15, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'white' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2022' },
    subtitle: { fontSize: 14, color: '#828282', marginTop: 4 },
    headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    searchSection: { paddingHorizontal: 20, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: 'white' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1F2022' },
    filterSection: { marginBottom: 20 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
    activeFilterChip: { backgroundColor: '#1F2022', borderColor: '#1F2022' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#828282' },
    activeFilterText: { color: 'white' },
    listPadding: { paddingHorizontal: 20, paddingBottom: 130 },
    teacherRow: { flexDirection: 'row', padding: 16, borderRadius: 24, marginBottom: 15, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    avatarBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    infoCol: { flex: 1, marginLeft: 15 },
    teacherName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    teacherSub: { fontSize: 13, color: '#828282', marginBottom: 8 },
    statsMiniRow: { flexDirection: 'row', gap: 12 },
    statMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statMiniText: { fontSize: 11, color: '#828282' },
    rightCol: { alignItems: 'flex-end', gap: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    workloadBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    hoursText: { fontSize: 11, color: '#828282', fontWeight: '500' },
    fab: { position: 'absolute', bottom: 110, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    empty: { alignItems: 'center', marginTop: 100, gap: 15 },
    emptyText: { color: '#BDBDBD', fontSize: 16 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    radioGroup: { flexDirection: 'row', gap: 12 },
    radioBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
    activeRadio: { backgroundColor: '#1F2022' },
    radioText: { color: '#828282', fontWeight: '600' },
    activeRadioText: { color: 'white' },
    modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 15 },
    backLink: { padding: 15 },
    backLinkText: { color: '#828282', fontWeight: '600' },
    // Desktop Modal Styles
    modalOverlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalDesktopContainer: {
        width: '100%',
        maxWidth: 700,
    },
    modalContentDesktop: {
        borderRadius: 20,
        overflow: 'hidden',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
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
    modalBodyDesktop: {
        padding: 24,
    },
    desktopRow: {
        flexDirection: 'row',
        gap: 16,
    },
    desktopFooter: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    footerButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    desktopAddButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    desktopAddButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 44,
        gap: 8,
    },
    desktopAddButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default TeachersScreen;
