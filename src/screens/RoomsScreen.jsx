import React, { useState, useContext } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/Header';
import Input from '../components/Input';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { SchoolContext } from '../context/SchoolContext';
import { useUI } from '../context/UIContext';

const RoomCard = ({ item, onPress, onMenuPress, isWeb, t }) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: item.color }, isWeb && { height: 180 }]}
        onPress={onPress}
    >
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="business" size={isWeb ? 24 : 20} color={COLORS.surface} />
            </View>
            <TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
                <Ionicons name="ellipsis-vertical" size={20} color={COLORS.surface} />
            </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
            <Text style={[styles.courseTitle, isWeb && { fontSize: 18 }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.instructor, isWeb && { fontSize: 12 }]}>{item.capacity} {t.students.toLowerCase()} {t.capacity.toLowerCase()}</Text>

            <View style={[styles.metaRow, isWeb && { marginTop: 8 }]}>
                <View style={styles.metaItem}>
                    <Ionicons name="grid" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{item.type || 'Standard'}</Text>
                </View>
            </View>
        </View>

        <View style={styles.cardFooter}>
            <View style={styles.enrollBtn}>
                <Text style={styles.enrollText}>{t.viewSchedule}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const RoomsScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    // TODO: Need addRoom, updateRoom, deleteRoom in context
    // For now we will mock or use placeholders
    // const { rooms, addRoom, updateRoom, deleteRoom } = useContext(SchoolContext);
    const { showLoader, hideLoader } = useUI();

    // Mock Data for now until context updated
    const [rooms, setRooms] = useState([
        { id: '1', name: '1-xona', capacity: 20, type: 'Standard', color: '#4F46E5' },
        { id: '2', name: '2-xona', capacity: 15, type: 'Lab', color: '#10B981' },
        { id: '3', name: '3-xona', capacity: 30, type: 'Lecture', color: '#F59E0B' },
    ]);

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [type, setType] = useState('Standard');

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSaveRoom = () => {
        if (!name || !capacity) {
            Alert.alert(t.error, 'Please fill in all required fields');
            return;
        }

        const predefinedColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.info, COLORS.warning];
        const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];

        const roomData = {
            id: isEditing ? editingId : Math.random().toString(),
            name,
            capacity: parseInt(capacity),
            type,
            color: isEditing ? (rooms.find(r => r.id === editingId)?.color || randomColor) : randomColor,
        };

        showLoader(t.saving || 'Saqlanmoqda...');
        try {
            if (isEditing) {
                setRooms(rooms.map(r => r.id === editingId ? roomData : r));
            } else {
                setRooms([...rooms, roomData]);
            }
            closeModal();
            if (!isWeb) Alert.alert(t.active, t.davomatSaqlangan);
        } finally {
            hideLoader();
        }
    };

    const handleEditRoom = (room) => {
        setIsEditing(true);
        setEditingId(room.id);
        setName(room.name);
        setCapacity(room.capacity.toString());
        setType(room.type);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingId(null);
        setName('');
        setCapacity('');
        setType('Standard');
    };

    const handleDelete = (id) => {
        const confirmDelete = () => {
            showLoader(t.deleting || 'O\'chirilmoqda...');
            // deleteRoom(id)
            setRooms(rooms.filter(r => r.id !== id));
            hideLoader();
        };

        if (Platform.OS === 'web') {
            if (confirm(t.deleteStudentConfirm)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                t.deleteStudent,
                t.deleteStudentConfirm,
                [
                    { text: t.cancel, style: "cancel" },
                    { text: t.delete, style: "destructive", onPress: confirmDelete }
                ]
            );
        }
    };

    // Responsive Col Config
    // Mobile: 50% (2 cols)
    // Tablet/Desktop: 25% (4 cols) or 33% (3 cols)
    const getColWidth = () => {
        if (width > 1200) return '25%'; // 4 cols
        if (width > 768) return '33.33%'; // 3 cols
        return '100%'; // 1 col mobile
    };

    const stylesWeb = isWeb ? {
        container: {
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
        },
        gridItem: {
            width: getColWidth(),
            padding: 10
        }
    } : {};

    const ScrollComponent = isWeb ? View : ScrollView;
    const scrollProps = !isWeb ? {
        contentContainerStyle: {
            flexGrow: 1,
            paddingBottom: 140,
        },
        showsVerticalScrollIndicator: false
    } : {};

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>

            {!isWeb && <Header title={t.infrastructure} subtitle={t.manageRooms} showBack={true} />}

            {isWeb && (
                <View style={[styles.webHeader, { borderColor: theme.border }]}>
                    <View>
                        <Text style={[styles.webTitle, { color: theme.text }]}>{t.roomsTitle}</Text>
                        <Text style={[styles.webSubtitle, { color: theme.textSecondary }]}>{t.manageRooms}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.webSearch, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Ionicons name="search" size={20} color={theme.textLight} />
                            <TextInput
                                placeholder={t.searchRooms}
                                placeholderTextColor={theme.textLight}
                                style={{ flex: 1, marginLeft: 8, color: theme.text, outlineStyle: 'none' }}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        <TouchableOpacity
                            style={[globalStyles.button, { marginLeft: 16 }]}
                            onPress={() => {
                                closeModal(); // clear state
                                setModalVisible(true);
                            }}
                        >
                            <Text style={globalStyles.buttonText}>+ {t.newRoom}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={{ flex: 1 }}>
                <ScrollComponent
                    {...scrollProps}
                    style={isWeb ? { width: '100%', paddingBottom: 50 } : { flex: 1 }}
                >
                    <View style={[globalStyles.screenPadding, isWeb && stylesWeb.container]}>
                        {!isWeb && (
                            <Input
                                icon="search-outline"
                                placeholder={t.searchRooms}
                                value={search}
                                onChangeText={setSearch}
                            />
                        )}

                        <View style={styles.grid}>
                            {filteredRooms.map((item) => (
                                <View key={item.id} style={[styles.gridItem, isWeb && stylesWeb.gridItem]}>
                                    <RoomCard
                                        item={item}
                                        onPress={() => handleEditRoom(item)}
                                        onMenuPress={() => {
                                            if (Platform.OS === 'web') {
                                                handleEditRoom(item);
                                            } else {
                                                Alert.alert(
                                                    t.options || "Options",
                                                    t.chooseAction || "Choose an action",
                                                    [
                                                        { text: t.cancel || "Cancel", style: "cancel" },
                                                        { text: t.delete || "Delete", style: 'destructive', onPress: () => handleDelete(item.id) },
                                                        { text: t.edit || "Edit", onPress: () => handleEditRoom(item) }
                                                    ]
                                                );
                                            }
                                        }}
                                        isWeb={isWeb}
                                        t={t}
                                    />
                                </View>
                            ))}
                        </View>

                        {filteredRooms.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={64} color={theme.textLight} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t.noResults || "Hech qanday xona topilmadi"}</Text>
                            </View>
                        )}
                    </View>
                </ScrollComponent>
            </View>

            {!isWeb && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity
                        style={[styles.extendedFab, globalStyles.shadow, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={24} color={COLORS.white} />
                        <Text style={styles.fabText}>{t.addRoom}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add Room Modal */}
            <Modal
                animationType={isWeb ? "fade" : "slide"}
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalOverlay, isWeb && styles.webModalOverlay]}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }, isWeb && styles.webModalView]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{isEditing ? t.editRoom : t.newRoom}</Text>
                            <TouchableOpacity onPress={closeModal} style={[styles.closeBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t.rooms} {t.fullName}</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder={t.roomNamePlaceholder}
                                    placeholderTextColor={theme.textLight}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t.students} {t.capacity}</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder={t.capacityPlaceholder}
                                    placeholderTextColor={theme.textLight}
                                    value={capacity}
                                    onChangeText={setCapacity}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t.roomType}</Text>
                                <View style={[globalStyles.row, { flexWrap: 'wrap', gap: 8 }]}>
                                    {['Standard', 'Lab', 'Lecture', 'Meeting'].map((tName) => (
                                        <TouchableOpacity
                                            key={tName}
                                            style={[
                                                styles.typeOption,
                                                type === tName ? { backgroundColor: theme.text } : { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }
                                            ]}
                                            onPress={() => setType(tName)}
                                        >
                                            <Text style={{ color: type === tName ? theme.background : theme.textSecondary, fontSize: 13, fontWeight: '600' }}>{tName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleSaveRoom}>
                                <Text style={styles.submitBtnText}>{isEditing ? t.saveChanges : t.signUp}</Text>
                            </TouchableOpacity>

                            {isEditing && (
                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: theme.error, marginTop: 12, shadowColor: theme.error }]}
                                    onPress={() => {
                                        closeModal();
                                        handleDelete(editingId);
                                    }}
                                >
                                    <Text style={styles.submitBtnText}>{t.delete}</Text>
                                </TouchableOpacity>
                            )}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    webHeader: {
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderBottomWidth: 1,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    webTitle: {
        ...FONTS.h2,
        fontSize: 24,
        fontWeight: 'bold'
    },
    webSubtitle: {
        ...FONTS.body4,
        marginTop: 5
    },
    webSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        width: 300
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    gridItem: {
        width: '50%',
        padding: 8,
    },
    card: {
        borderRadius: SIZES.radius,
        padding: 12,
        height: 180,
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseTitle: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    instructor: {
        ...FONTS.small,
        color: COLORS.surface,
        opacity: 0.9,
        fontSize: 10,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    metaText: {
        fontSize: 10,
        color: COLORS.surface,
        marginLeft: 2,
        opacity: 0.9,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        ...FONTS.h4,
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    enrollBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    enrollText: {
        fontSize: 10,
        color: COLORS.surface,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        width: '100%'
    },
    emptyText: {
        marginTop: 10,
    },
    // Unified Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    webModalOverlay: { justifyContent: 'center', alignItems: 'center' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, paddingBottom: 20, maxHeight: '90%' },
    webModalView: { borderRadius: 30, width: 550, maxHeight: 700 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#828282', marginBottom: 8, marginLeft: 4 },
    input: { height: 58, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, borderWidth: 1.5 },
    submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    typeOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    formScroll: { paddingBottom: 20 },
    fabContainer: {
        position: 'absolute',
        bottom: 110,
        right: 20,
    },
    extendedFab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 6,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    fabText: {
        color: COLORS.white,
        ...FONTS.h4,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    teacherChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    teacherChipText: {
        fontSize: 14,
        fontWeight: '500',
    }
});

export default RoomsScreen;
