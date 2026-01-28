import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { LoadingButton } from '../../../components/loaders';
import { ThemeContext } from '../../../context/ThemeContext';

const EditProfileModal = ({ visible, onClose, userInfo, onSave }) => {
    const { theme } = useContext(ThemeContext);
    const [name, setName] = useState(userInfo?.name || '');
    const [phone, setPhone] = useState(userInfo?.phone || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [avatar, setAvatar] = useState(userInfo?.avatar || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ name, phone, email, avatar });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Profilni Tahrirlash</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.avatarContainer}>
                                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                                    {avatar && (!Platform.OS === 'web' || !avatar.startsWith('file://')) ? (
                                        <Image source={{ uri: avatar }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
                                            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
                                        </View>
                                    )}
                                    <View style={styles.cameraIcon}>
                                        <Ionicons name="camera" size={16} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Ism Familigangiz</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Ismingizni kiriting"
                                    placeholderTextColor={theme.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Telefon Raqam</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="+998 90 123 45 67"
                                    placeholderTextColor={theme.textLight}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    placeholder="example@mail.com"
                                    placeholderTextColor={theme.textLight}
                                />
                            </View>

                            <LoadingButton
                                title="Saqlash"
                                onPress={handleSave}
                                isLoading={loading}
                                style={{ marginTop: 20 }}
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
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 20, fontWeight: 'bold' },
    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, color: 'white', fontWeight: 'bold' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary,
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white'
    },
    inputGroup: { marginBottom: 15 },
    label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
    input: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16 }
});

export default EditProfileModal;
