import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Modal, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { ThemeContext } from '../context/ThemeContext';
import { SchoolContext } from '../context/SchoolContext';

const Header = ({ title, subtitle, showBack, onBack, rightIcon, onRightPress }) => {
    const navigation = useNavigation();
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { recentActivities } = useContext(SchoolContext);
    const route = useRoute();
    const insets = useSafeAreaInsets();

    const [notificationsVisible, setNotificationsVisible] = useState(false);

    // Calculate proper top padding based on safe area insets
    const topPadding = Platform.select({
        ios: insets.top,
        android: insets.top || Constants.statusBarHeight || 24,
        web: 20,
        default: 20
    });

    // Only show full header features on Admin Dashboard for this demo
    const isDashboard = route.name === 'Dashboard';

    // We can also check if we are on Web to determine layout density
    const isWeb = Platform.OS === 'web';

    // Format activities for notifications
    const notifications = useMemo(() => {
        return recentActivities?.slice(0, 10).map((activity, index) => {
            let icon = 'notifications-outline';
            let color = '#667eea';
            let text = activity.target || 'Yangi hodisa';

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

            return { id: activity.id || index, icon, text, time: timeText, color };
        }) || [];
    }, [recentActivities]);

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, paddingTop: isWeb ? 20 : topPadding + 12 }]}>
            <View style={styles.leftRow}>
                {/* Back Button (if not on main tabs) */}
                {(showBack || (navigation.canGoBack() && route.name !== 'Dashboard')) && (
                    <TouchableOpacity onPress={onBack || (() => navigation.goBack())} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                )}

                <View>
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    {isDashboard && (
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Welcome back, Admin!</Text>
                    )}
                    {subtitle && !isDashboard && (
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
                    )}
                </View>
            </View>

            {/* Desktop Search & Actions */}
            {isWeb && (
                <View style={styles.rightRow}>
                    {/* Search Bar - Visual Only for now */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                        <Ionicons name="search" size={20} color={theme.textLight} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search here..."
                            placeholderTextColor={theme.textLight}
                        />
                    </View>

                    {/* Notification Bell */}
                    <TouchableOpacity
                        style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}
                        onPress={() => setNotificationsVisible(true)}
                    >
                        <Ionicons name="notifications" size={22} color={theme.primary} />
                        {notifications.length > 0 && (
                            <View style={[styles.badge, { borderColor: theme.surface }]} />
                        )}
                    </TouchableOpacity>

                    {/* Right Action (e.g. Add Button) from props */}
                    {rightIcon && (
                        <TouchableOpacity style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]} onPress={onRightPress}>
                            <Ionicons name={rightIcon} size={22} color={theme.primary} />
                        </TouchableOpacity>
                    )}

                    {/* Settings Button */}
                    <TouchableOpacity
                        style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={22} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Mobile Right Icon */}
            {!isWeb && rightIcon && (
                <TouchableOpacity style={[styles.rightButton, { backgroundColor: theme.background }]} onPress={onRightPress}>
                    <Ionicons name={rightIcon} size={22} color={theme.primary} />
                </TouchableOpacity>
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
                                    {notifications.length} ta yangi
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setNotificationsVisible(false)}
                                style={[styles.closeButton, { backgroundColor: theme.background }]}
                            >
                                <Ionicons name="close" size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Notifications List */}
                        <ScrollView
                            style={styles.notificationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[styles.notificationItem, { borderBottomColor: theme.border }]}
                                        onPress={() => {
                                            // Handle notification click
                                            setNotificationsVisible(false);
                                        }}
                                    >
                                        <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
                                            <Ionicons name={notification.icon} size={20} color={notification.color} />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={[styles.notificationText, { color: theme.text }]} numberOfLines={2}>
                                                {notification.text}
                                            </Text>
                                            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                                                {notification.time}
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
                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={[styles.notificationFooter, { borderTopColor: theme.border }]}
                                onPress={() => {
                                    setNotificationsVisible(false);
                                    // Navigate to full notifications screen if exists
                                }}
                            >
                                <Text style={[styles.viewAllText, { color: theme.primary }]}>
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

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 15,
        // Floating Style for Web
        ...Platform.select({
            web: {
                margin: 20,
                borderRadius: 20,
                shadowColor: '#a0a0a0',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                zIndex: 100
            },
            default: {
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 3
            }
        })
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    title: {
        ...FONTS.h2,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2
    },
    iconBtn: {
        padding: 8,
        marginRight: 10,
        borderRadius: 12,
    },
    // W3CRM Style Elements
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        width: 300,
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontFamily: 'System',
        outlineStyle: 'none'
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        borderWidth: 1.5,
    },
    rightButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Notification Modal Styles
    notificationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'web' ? 90 : 80,
        paddingRight: Platform.OS === 'web' ? 20 : 10,
    },
    notificationPanel: {
        width: Platform.OS === 'web' ? 400 : 320,
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
    closeButton: {
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
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Header;
