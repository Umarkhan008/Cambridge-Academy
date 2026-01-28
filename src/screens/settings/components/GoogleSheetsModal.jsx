import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { LoadingButton } from '../../../components/loaders';
import { ThemeContext } from '../../../context/ThemeContext';

const GoogleSheetsModal = ({ visible, onClose, settings, onSave }) => {
    const { theme } = useContext(ThemeContext);

    const [enabled, setEnabled] = useState(settings?.enableGoogleSheets || false);
    const [url, setUrl] = useState(settings?.googleSheetsUrl || '');
    const [format, setFormat] = useState(settings?.attendanceFormat || 'default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setEnabled(settings?.enableGoogleSheets || false);
            setUrl(settings?.googleSheetsUrl || '');
            setFormat(settings?.attendanceFormat || 'default');
        }
    }, [visible, settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({
                enableGoogleSheets: enabled,
                googleSheetsUrl: url,
                attendanceFormat: format
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const FormatOption = ({ id, label, description }) => (
        <TouchableOpacity
            style={[
                styles.formatOption,
                {
                    backgroundColor: format === id ? COLORS.primaryLight : theme.surface,
                    borderColor: format === id ? COLORS.primary : theme.border
                }
            ]}
            onPress={() => setFormat(id)}
        >
            <View style={styles.formatHeader}>
                <Text style={[styles.formatLabel, { color: format === id ? COLORS.primary : theme.text }]}>{label}</Text>
                {format === id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
            </View>
            <Text style={[styles.formatDesc, { color: theme.textSecondary }]}>{description}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Google Sheets Sozlamalari</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView showsVerticalScrollIndicator={false}>

                            <View style={[styles.section, { backgroundColor: theme.surface, padding: 15, borderRadius: 16, marginBottom: 20 }]}>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sinxronizatsiyani yoqish</Text>
                                        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                                            Davomat ma'lumotlarini avtomatik yuborish
                                        </Text>
                                    </View>
                                    <Switch
                                        value={enabled}
                                        onValueChange={setEnabled}
                                        trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                                        thumbColor={enabled ? COLORS.primary : '#f4f3f4'}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Google Apps Script Web App URL</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                                    value={url}
                                    onChangeText={setUrl}
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    placeholderTextColor={theme.textLight}
                                    multiline
                                    numberOfLines={2}
                                />
                                <Text style={styles.hintText}>
                                    Apps Script loyihasini "Web App" sifatida deploy qiling va havolani bu yerga joylashtiring.
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Ma'lumotlar tartibi (Format)</Text>

                                <FormatOption
                                    id="default"
                                    label="Standart (Barchasi)"
                                    description="Kurs nomi, sana, va barcha o'quvchilar ro'yxati (status, uy ishi, eslatma bilan)."
                                />

                                <FormatOption
                                    id="simple"
                                    label="Soddalashtirilgan"
                                    description="Faqat kelganlar va kelmaganlar soni, batafsil ro'yxatsiz."
                                />

                                <FormatOption
                                    id="compact"
                                    label="Ixcham (CSV bitta qator)"
                                    description="Har bir davomat uchun bitta qator, o'quvchilar vergul bilan ajratilgan."
                                />
                            </View>

                            <View style={{ height: 20 }} />

                            <LoadingButton
                                title="Sozlamalarni Saqlash"
                                onPress={handleSave}
                                isLoading={loading}
                                style={{ marginBottom: 30 }}
                            />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 20, fontWeight: 'bold' },

    section: { marginBottom: 15 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    sectionDesc: { fontSize: 13 },

    inputGroup: { marginBottom: 20 },
    label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
    input: { minHeight: 60, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top' },
    hintText: { fontSize: 12, color: COLORS.primary, marginTop: 6, fontWeight: '500' },

    formatOption: {
        padding: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 10
    },
    formatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    formatLabel: { fontSize: 15, fontWeight: 'bold' },
    formatDesc: { fontSize: 12, lineHeight: 18 },

    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, color: 'white', fontWeight: 'bold' },
});

export default GoogleSheetsModal;
