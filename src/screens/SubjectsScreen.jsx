import React, { useState, useContext } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';
import ScreenHeader from '../components/ScreenHeader';

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Advanced'];
const CATEGORIES = ['Dasturlash', 'Dizayn', 'Tillar', 'Fanlar', 'Boshqa'];

const SubjectsScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1280;

    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { subjects, addSubject, updateSubject, deleteSubject, addCourse } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State (Step based)
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: '',
        category: 'Dasturlash',
        level: 'Beginner',
        durationMonth: '',
        lessonsPerWeek: '',
        price: '',
        description: ''
    });

    const filteredSubjects = subjects.filter(sub =>
        sub.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        setStep(1);
        setIsEditing(false);
        setEditingId(null);
        setForm({
            title: '',
            category: 'Dasturlash',
            level: 'Beginner',
            durationMonth: '',
            lessonsPerWeek: '',
            price: '',
            description: ''
        });
        setModalVisible(true);
    };

    const handleOpenEdit = (item) => {
        setStep(1);
        setIsEditing(true);
        setEditingId(item.id);
        setForm({
            title: item.title,
            category: item.category || 'Boshqa',
            level: item.level || 'Beginner',
            durationMonth: item.durationMonth ? String(item.durationMonth) : '',
            lessonsPerWeek: item.lessonsPerWeek ? String(item.lessonsPerWeek) : '',
            price: item.price ? String(item.price).replace(/[^0-9]/g, '') : '',
            description: item.description || ''
        });
        setModalVisible(true);
    };

    const handleSaveTemplate = async () => {
        if (!form.title || !form.price) {
            Alert.alert('Xatolik', 'Nom va narx kiritilishi shart');
            return;
        }

        const templateData = {
            title: form.title,
            category: form.category,
            level: form.level,
            durationMonth: parseInt(form.durationMonth) || 0,
            lessonsPerWeek: parseInt(form.lessonsPerWeek) || 0,
            price: `${parseInt(form.price).toLocaleString()} UZS`,
            description: form.description,
            icon: 'book', // Default icon
            // Metadata to mark as template
            isTemplate: true
        };

        try {
            showLoader('Saqlanmoqda...');
            if (isEditing) {
                await updateSubject(editingId, templateData);
            } else {
                await addSubject(templateData);
            }
            setModalVisible(false);
        } catch (e) {
            Alert.alert('Xatolik', 'Saqlashda xatolik');
        } finally {
            hideLoader();
        }
    };

    const handleCreateGroup = (template) => {
        // Navigate to Create Group flow with pre-filled data
        // For now, we simulate this by calling a function or navigating
        // Since Create Group is on CoursesScreen (GroupsScreen), we might navigate there with params
        // Or simply show an alert for demo
        Alert.alert(
            'Guruh yaratish',
            `"${template.title}" shabloni asosida yangi guruh yaratilsinmi?`,
            [
                { text: 'Bekor qilish' },
                {
                    text: 'Yaratish', onPress: async () => {
                        try {
                            showLoader('Guruh yaratilmoqda...');
                            // Create a dummy group based on template
                            const groupData = {
                                title: `${template.title} - Group 1`,
                                instructor: 'Admin', // Default
                                price: template.price,
                                days: 'DCHJ', // Default
                                time: '14:00 - 16:00',
                                startDate: new Date().toISOString(),
                                status: 'Upcoming',
                                students: 0,
                                color: COLORS.primary
                            };
                            await addCourse(groupData);
                            Alert.alert('Muvaffaqiyatli', 'Yangi guruh yaratildi');
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (id) => {
        Alert.alert(
            "O'chirish",
            "Bu shablonni o'chirib yubormoqchimisiz?",
            [
                { text: "Yo'q", style: "cancel" },
                {
                    text: "Ha", style: "destructive", onPress: async () => {
                        try {
                            showLoader("O'chirilmoqda...");
                            await deleteSubject(id);
                        } finally {
                            hideLoader();
                        }
                    }
                }
            ]
        );
    };

    const TemplateCard = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <Feather name="layers" size={20} color={COLORS.primary} />
                </View>
                <View style={[styles.badge, { backgroundColor: theme.background }]}>
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>TEMPLATE</Text>
                </View>
                <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.editBtn}>
                    <Feather name="more-horizontal" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={styles.cardCategory}>{item.category} • {item.level}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Feather name="clock" size={14} color="#828282" />
                        <Text style={styles.metaText}>{item.durationMonth || 0} oy</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Feather name="repeat" size={14} color="#828282" />
                        <Text style={styles.metaText}>{item.lessonsPerWeek || 0} ta dars/hafta</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                <Text style={[styles.price, { color: theme.text }]}>{item.price}</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.iconAction} onPress={() => handleCreateGroup(item)}>
                        <Feather name="plus-circle" size={20} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(item.id)}>
                        <Feather name="trash-2" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Kurs Nomi *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                placeholder="Masalan: Frontend Development"
                                placeholderTextColor={theme.textLight}
                                value={form.title}
                                onChangeText={t => setForm({ ...form, title: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Kategoriya</Text>
                            <View style={styles.chipGrid}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, form.category === cat && styles.activeChip]}
                                        onPress={() => setForm({ ...form, category: cat })}
                                    >
                                        <Text style={[styles.chipText, form.category === cat && styles.activeChipText]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Daraja</Text>
                            <View style={styles.chipGrid}>
                                {LEVELS.map(lvl => (
                                    <TouchableOpacity
                                        key={lvl}
                                        style={[styles.chip, form.level === lvl && styles.activeChip]}
                                        onPress={() => setForm({ ...form, level: lvl })}
                                    >
                                        <Text style={[styles.chipText, form.level === lvl && styles.activeChipText]}>{lvl}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, !form.title && styles.disabledBtn]} disabled={!form.title} onPress={() => setStep(2)}>
                            <Text style={styles.submitBtnText}>Davom etish</Text>
                        </TouchableOpacity>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                );
            case 2:
                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.stepTitle}>Davomiylik va Narx</Text>

                        <View style={styles.rowBetween}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Davomiylik (oy)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="6"
                                        placeholderTextColor={theme.textLight}
                                        keyboardType="numeric"
                                        value={form.durationMonth}
                                        onChangeText={t => setForm({ ...form, durationMonth: t })}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Darslar soni</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="3"
                                        placeholderTextColor={theme.textLight}
                                        keyboardType="numeric"
                                        value={form.lessonsPerWeek}
                                        onChangeText={t => setForm({ ...form, lessonsPerWeek: t })}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Standart Narx (oyiga)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                placeholder="500,000"
                                placeholderTextColor={theme.textLight}
                                keyboardType="numeric"
                                value={form.price}
                                onChangeText={t => setForm({ ...form, price: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Qisqacha Ta'rif</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, height: 100, textAlignVertical: 'top', paddingTop: 10, borderColor: theme.border }]}
                                placeholder="Kurs haqida..."
                                placeholderTextColor={theme.textLight}
                                multiline
                                value={form.description}
                                onChangeText={t => setForm({ ...form, description: t })}
                            />
                        </View>

                        <View style={styles.rowBetween}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                <Text style={styles.backBtnText}>Orqaga</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginLeft: 15, marginTop: 0 }]} onPress={handleSaveTemplate}>
                                <Text style={styles.submitBtnText}>{isEditing ? 'Saqlash' : 'Yaratish'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                );
        }
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? theme.background : 'white'} />
            {/* Header */}
            <ScreenHeader
                title="Kurslar (Shablon)"
                subtitle="Course Templates"
                showBack={true}
                rightAction={
                    isDesktop ? (
                        <TouchableOpacity
                            style={styles.desktopAddButton}
                            onPress={handleOpenAdd}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.desktopAddButtonGradient}
                            >
                                <Ionicons name="add" size={22} color="#fff" />
                                <Text style={styles.desktopAddButtonText}>Yangi Kurs Shabloni</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: isDarkMode ? theme.surface : 'white' }]}
                            onPress={() => { }}
                        >
                            <Ionicons name="filter" size={20} color={theme.text} />
                        </TouchableOpacity>
                    )
                }
            />

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#BDBDBD" />
                    <TextInput
                        placeholder="Shablon nomini qidirish..."
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredSubjects}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <TemplateCard item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="book-open" size={48} color="#E0E0E0" />
                        <Text style={styles.emptyText}>Shablonlar mavjud emas</Text>
                    </View>
                }
            />

            {!isDesktop && (
                <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>
            )}

            {/* Create/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType={isDesktop ? "fade" : "slide"}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
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
                                    <View>
                                        <Text style={styles.modalHeaderTitle}>
                                            {isEditing ? 'Shablonni Tahrirlash' : 'Yangi Kurs Shabloni'}
                                        </Text>
                                        <Text style={styles.modalHeaderSubtitle}>Barcha guruhlar uchun asosiy parametrlar</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                                        <Ionicons name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </LinearGradient>
                            ) : (
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                                        {isEditing ? 'Shablonni Tahrirlash' : 'Yangi Shablon'} ({step}/2)
                                    </Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={24} color={theme.text} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <ScrollView showsVerticalScrollIndicator={false} style={isDesktop && styles.modalBodyDesktop}>
                                {isDesktop ? (
                                    <>
                                        <View style={styles.desktopRow}>
                                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Kurs Nomi *</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="Masalan: Frontend Development"
                                                    placeholderTextColor={theme.textLight}
                                                    value={form.title}
                                                    onChangeText={t => setForm({ ...form, title: t })}
                                                />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Standart Narx (oyiga)</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="500,000"
                                                    placeholderTextColor={theme.textLight}
                                                    keyboardType="numeric"
                                                    value={form.price}
                                                    onChangeText={t => setForm({ ...form, price: t })}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.desktopRow}>
                                            <View style={styles.inputGroup}>
                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Davomiylik (oy)</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="6"
                                                    placeholderTextColor={theme.textLight}
                                                    keyboardType="numeric"
                                                    value={form.durationMonth}
                                                    onChangeText={t => setForm({ ...form, durationMonth: t })}
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Darslar soni (hafta)</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                                    placeholder="3"
                                                    placeholderTextColor={theme.textLight}
                                                    keyboardType="numeric"
                                                    value={form.lessonsPerWeek}
                                                    onChangeText={t => setForm({ ...form, lessonsPerWeek: t })}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Kategoriya</Text>
                                            <View style={styles.chipGrid}>
                                                {CATEGORIES.map(cat => (
                                                    <TouchableOpacity
                                                        key={cat}
                                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, form.category === cat && styles.activeChip]}
                                                        onPress={() => setForm({ ...form, category: cat })}
                                                    >
                                                        <Text style={[styles.chipText, form.category === cat && styles.activeChipText]}>{cat}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Daraja</Text>
                                            <View style={styles.chipGrid}>
                                                {LEVELS.map(lvl => (
                                                    <TouchableOpacity
                                                        key={lvl}
                                                        style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, form.level === lvl && styles.activeChip]}
                                                        onPress={() => setForm({ ...form, level: lvl })}
                                                    >
                                                        <Text style={[styles.chipText, form.level === lvl && styles.activeChipText]}>{lvl}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Qisqacha Ta'rif</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, height: 100, textAlignVertical: 'top', paddingTop: 12, borderColor: theme.border }]}
                                                placeholder="Kurs haqida batafsil..."
                                                placeholderTextColor={theme.textLight}
                                                multiline
                                                value={form.description}
                                                onChangeText={t => setForm({ ...form, description: t })}
                                            />
                                        </View>

                                        <View style={styles.desktopFooter}>
                                            <TouchableOpacity
                                                style={[styles.footerButton, styles.cancelButton, { borderColor: theme.border }]}
                                                onPress={() => setModalVisible(false)}
                                            >
                                                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Bekor qilish</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.footerButton} onPress={handleSaveTemplate}>
                                                <LinearGradient
                                                    colors={['#667eea', '#764ba2']}
                                                    style={styles.saveButtonGradient}
                                                >
                                                    <Text style={styles.saveButtonText}>
                                                        {isEditing ? 'O\'zgarishlarni Saqlash' : 'Shablonni Yaratish'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    renderStepContent()
                                )}
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', marginRight: 15, borderWidth: 1, borderColor: '#E0E0E0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2022' },
    subtitle: { fontSize: 13, color: '#828282', marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0' },

    searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

    listContent: { paddingHorizontal: 20, paddingBottom: 130 },
    // Card Styles
    card: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F2F2F2' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8F9FE', alignItems: 'center', justifyContent: 'center' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E0E0E0' },
    badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    editBtn: { padding: 5 },

    cardBody: { marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    cardCategory: { fontSize: 12, color: '#828282', fontWeight: '600' },
    metaRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#4F4F4F', fontWeight: '500' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
    price: { fontSize: 16, fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', gap: 15 },
    iconAction: { padding: 5 },

    emptyState: { alignItems: 'center', marginTop: 80, gap: 15 },
    emptyText: { color: '#BDBDBD', fontSize: 16 },

    fab: { position: 'absolute', bottom: 110, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },

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
    disabledBtn: { backgroundColor: '#E0E0E0' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F2', marginBottom: 5 },
    activeChip: { backgroundColor: '#1F2022' },
    chipText: { color: '#828282', fontWeight: '500' },
    activeChipText: { color: 'white', fontWeight: 'bold' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 0 },
    stepTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#1F2022' },
    backBtn: { width: 80, height: 58, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: '#828282', fontWeight: '600' },
    // Desktop Modal Styles
    modalOverlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalDesktopContainer: {
        width: '100%',
        maxWidth: 750,
    },
    modalContentDesktop: {
        borderRadius: 24,
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeaderGradient: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalHeaderSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBodyDesktop: {
        padding: 24,
    },
    desktopRow: {
        flexDirection: 'row',
        gap: 20,
    },
    desktopFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    footerButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cancelButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 17,
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

export default SubjectsScreen;
