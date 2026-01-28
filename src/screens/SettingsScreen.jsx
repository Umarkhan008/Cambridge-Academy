import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, Switch, TouchableOpacity, ScrollView, Alert, Image, useWindowDimensions, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { InlineLoader } from '../components/loaders';
import { SchoolContext } from '../context/SchoolContext';
import EditProfileModal from './settings/components/EditProfileModal';
import GoogleSheetsModal from './settings/components/GoogleSheetsModal';

const SectionItem = ({ icon, title, type = 'link', value, onValueChange, color, subtitle }) => {
    const { theme } = useContext(ThemeContext);
    const itemColor = color || theme.text;
    const [loading, setLoading] = useState(false);

    const handleToggle = async (val) => {
        setLoading(true);
        // Simulate network request or wait for async storage
        await onValueChange(val);
        setLoading(false);
    };

    return (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.border }]}
            activeOpacity={(type === 'link' || type === 'danger') ? 0.7 : 1}
            onPress={(type === 'link' || type === 'danger') ? onValueChange : null}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name={icon} size={20} color={itemColor} />
                </View>
                <View>
                    <Text style={[styles.itemTitle, { color: type === 'danger' ? COLORS.danger : theme.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>

            <View style={styles.itemRight}>
                {loading ? (
                    <InlineLoader />
                ) : type === 'toggle' ? (
                    <Switch
                        trackColor={{ false: theme.border, true: theme.primary + '80' }}
                        thumbColor={value ? theme.primary : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleToggle}
                        value={value}
                    />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const SettingsScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isWeb = width > 900;

    const { logout, userInfo, updateProfile } = useContext(AuthContext);
    const { appSettings, updateAppSettings } = useContext(SchoolContext);
    const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { t, changeLanguage, language } = useContext(LanguageContext);

    const [notifications, setNotifications] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [gsModalVisible, setGsModalVisible] = useState(false);

    // Web friendly modals
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const handleLanguagePress = () => {
        if (Platform.OS === 'web') {
            setLangModalVisible(true);
        } else {
            Alert.alert(
                t ? t.selectLanguage : 'Tilni tanlang',
                "",
                [
                    { text: "O'zbekcha", onPress: () => changeLanguage('uz') },
                    { text: "Русский", onPress: () => changeLanguage('ru') },
                    { text: "English", onPress: () => changeLanguage('en') },
                    { text: t ? t.cancel : 'Bekor qilish', style: "cancel" }
                ],
                { cancelable: true }
            );
        }
    };

    const handleLogoutPress = () => {
        if (Platform.OS === 'web') {
            setLogoutModalVisible(true);
        } else {
            Alert.alert(
                t ? t.logOutConfirmTitle : 'Chiqish',
                t ? t.logOutConfirmMsg : 'Haqiqatdan ham tizimdan chiqmoqchimisiz?',
                [
                    { text: t ? t.cancel : 'Bekor qilish', style: 'cancel' },
                    {
                        text: t ? t.logOut : 'Chiqish',
                        style: 'destructive',
                        onPress: () => logout()
                    }
                ]
            );
        }
    };

    const handleProfileUpdate = async (data) => {
        await updateProfile(data);
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.header}>
                {navigation.canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15, padding: 8, backgroundColor: theme.surface, borderRadius: 12 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t ? t.settings : 'Sozlamalar'}</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View style={globalStyles.screenPadding}>

                    {/* Profile Card */}
                    <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.avatarContainer}>
                            {userInfo?.avatar ? (
                                <Image source={{ uri: userInfo.avatar }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.avatarText}>{userInfo?.name ? userInfo.name[0].toUpperCase() : 'U'}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[styles.editIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setEditModalVisible(true)}
                            >
                                <Feather name="edit-2" size={14} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: theme.text }]}>{userInfo?.name || 'Foydalanuvchi'}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: isDarkMode ? (userInfo?.role === 'admin' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(79, 70, 229, 0.2)') : (userInfo?.role === 'admin' ? '#E8F7EE' : '#EEF0FF') }]}>
                                <Text style={[styles.roleText, { color: userInfo?.role === 'admin' ? (isDarkMode ? '#3FB950' : '#27AE60') : (isDarkMode ? '#FF8F75' : '#5865F2') }]}>
                                    {userInfo?.role === 'admin' ? 'Administrator' : (userInfo?.role === 'teacher' ? 'O\'qituvchi' : 'Talaba')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* App Settings */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t ? t.preferences : 'Ilova Sozlamalari'}</Text>
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="notifications-outline"
                            title={t ? t.pushNotifications : 'Bildirishnomalar'}
                            type="toggle"
                            value={notifications}
                            onValueChange={(val) => setNotifications(val)}
                        />
                        <SectionItem
                            icon="moon-outline"
                            title={t ? t.darkMode : 'Tun rejimi'}
                            subtitle={isDarkMode ? 'Yoqilgan' : 'O\'chirilgan'}
                            type="toggle"
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                        />
                        <SectionItem
                            icon="globe-outline"
                            title={t ? t.language : 'Til'}
                            subtitle={language === 'uz' ? 'O\'zbekcha' : (language === 'ru' ? 'Русский' : 'English')}
                            onValueChange={handleLanguagePress}
                        />
                    </View>

                    {/* Admin Settings */}
                    {userInfo?.role === 'admin' && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t ? t.integration : 'Integratsiyalar'}</Text>
                            <View style={[styles.section, { backgroundColor: theme.surface }]}>
                                <SectionItem
                                    icon="grid-outline"
                                    title="Google Sheets"
                                    subtitle={appSettings?.enableGoogleSheets ? 'Yoqilgan' : 'O\'chirilgan'}
                                    onValueChange={() => setGsModalVisible(true)}
                                />
                            </View>
                        </>
                    )}

                    {/* Support */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t ? t.support : 'Yordam'}</Text>
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="help-circle-outline"
                            title={t ? t.helpCenter : 'Yordam markazi'}
                            onValueChange={() => Linking.openURL('https://t.me/support_proteach')}
                        />
                        <SectionItem
                            icon="information-circle-outline"
                            title={t ? t.aboutApp : 'Ilova haqida'}
                            onValueChange={() => Alert.alert('Pro Teach', 'Version 1.0.0\nEducation Management System')}
                        />
                    </View>

                    {/* Account */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t ? t.account : 'Hisob'}</Text>
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SectionItem
                            icon="log-out-outline"
                            title={t ? t.logOut : 'Chiqish'}
                            type="danger"
                            color={COLORS.danger}
                            onValueChange={handleLogoutPress}
                        />
                    </View>

                    <Text style={[styles.version, { color: theme.textLight }]}>Pro Teach v1.0.0 (Build 102)</Text>
                </View>
            </ScrollView>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                userInfo={userInfo}
                onSave={handleProfileUpdate}
            />

            <GoogleSheetsModal
                visible={gsModalVisible}
                onClose={() => setGsModalVisible(false)}
                settings={appSettings}
                onSave={updateAppSettings}
            />

            {/* Custom Web Modals */}
            <Modal
                visible={langModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLangModalVisible(false)}
                >
                    <View style={[styles.customModal, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t ? t.selectLanguage : 'Tilni tanlang'}</Text>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { changeLanguage('uz'); setLangModalVisible(false); }}>
                            <Text style={[styles.modalOptionText, { color: theme.text }]}>O'zbekcha</Text>
                            {language === 'uz' && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { changeLanguage('ru'); setLangModalVisible(false); }}>
                            <Text style={[styles.modalOptionText, { color: theme.text }]}>Русский</Text>
                            {language === 'ru' && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { changeLanguage('en'); setLangModalVisible(false); }}>
                            <Text style={[styles.modalOptionText, { color: theme.text }]}>English</Text>
                            {language === 'en' && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: theme.primary }]} onPress={() => setLangModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>{t ? t.cancel : 'Bekor qilish'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={logoutModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLogoutModalVisible(false)}
                >
                    <View style={[styles.customModal, { backgroundColor: theme.surface }]}>
                        <Ionicons name="log-out-outline" size={48} color={COLORS.danger} style={{ alignSelf: 'center', marginBottom: 15 }} />
                        <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center' }]}>
                            {t ? t.logOutConfirmTitle : 'Chiqish'}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                            {t ? t.logOutConfirmMsg : 'Haqiqatdan ham tizimdan chiqmoqchimisiz?'}
                        </Text>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: theme.background }]} onPress={() => setLogoutModalVisible(false)}>
                                <Text style={[styles.modalActionBtnText, { color: theme.text }]}>{t ? t.cancel : 'Bekor qilish'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: COLORS.danger }]} onPress={() => { logout(); setLogoutModalVisible(false); }}>
                                <Text style={[styles.modalActionBtnText, { color: 'white' }]}>{t ? t.logOut : 'Chiqish'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        marginBottom: 25,
        elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8
    },
    avatarContainer: { position: 'relative', marginRight: 20 },
    avatarImg: { width: 70, height: 70, borderRadius: 35 },
    avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    editIconBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#eee'
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
    roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    roleText: { fontSize: 12, fontWeight: 'bold' },

    sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { borderRadius: 20, paddingHorizontal: 5, marginBottom: 25, overflow: 'hidden' },

    item: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, paddingHorizontal: 15,
        borderBottomWidth: 1
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    itemTitle: { fontSize: 16, fontWeight: '500' },
    itemSubtitle: { fontSize: 12, marginTop: 2 },

    itemRight: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
    version: { textAlign: 'center', fontSize: 12, marginTop: 10 },

    // Custom Web Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    customModal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalSubtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalCloseBtn: {
        marginTop: 25,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalCloseBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalActionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalActionBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
