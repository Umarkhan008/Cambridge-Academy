import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const SIDEBAR_BG = '#1e1b4b'; // Deep Indigo
const SIDEBAR_ACTIVE = '#312e81'; // Lighter Indigo
const TEXT_COLOR = '#C7D2FE'; // Light Indigo Text
const TEXT_ACTIVE = '#FFFFFF';

const WebSidebar = ({ activeRoute }) => {
    const navigation = useNavigation();
    const { t } = useContext(LanguageContext);
    const { logout, userInfo } = useContext(AuthContext);
    const { isSidebarCollapsed, toggleSidebar } = useUI();

    const MENU_STRUCTURE = [
        {
            section: 'MAIN',
            items: [
                { name: 'Dashboard', icon: 'grid-outline', label: t.dashboard, route: 'Dashboard' },
                { name: 'Schedule', icon: 'calendar-outline', label: 'Jadval', route: 'Schedule' },
            ]
        },
        {
            section: 'MANAGEMENT',
            items: [
                { name: 'Students', icon: 'people-outline', label: t.students, route: 'Students' },
                { name: 'Courses', icon: 'layers-outline', label: 'Guruhlar', route: 'Courses' },
                { name: 'Teachers', icon: 'school-outline', label: t.teachers, route: 'Teachers', role: 'admin' },
                { name: 'Leads', icon: 'magnet-outline', label: t.leads, route: 'Leads' },
            ]
        },
        {
            section: 'RESOURCES',
            items: [
                { name: 'Subjects', icon: 'book-outline', label: 'Kurslar', route: 'Subjects' },
                { name: 'Rooms', icon: 'business-outline', label: 'Xonalar', route: 'Rooms' },
            ]
        },
        {
            section: 'FINANCE',
            items: [
                { name: 'Finance', icon: 'wallet-outline', label: t.finance || 'Finance', route: 'Finance', role: 'admin' },
            ]
        }
    ];

    const getMenuItems = () => {
        const userRole = userInfo?.role || 'student';
        return MENU_STRUCTURE.map(section => {
            const filteredItems = section.items.filter(item => !item.role || item.role === userRole);
            if (filteredItems.length === 0) return null;
            return { ...section, items: filteredItems };
        }).filter(Boolean);
    };

    const sections = getMenuItems();

    // Helper for generating initials
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <View style={[
            styles.container,
            { width: isSidebarCollapsed ? 80 : 260 }
        ]}>
            {/* Brand / Logo Area */}
            <View style={[styles.header, isSidebarCollapsed && styles.headerCollapsed]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Dashboard')}
                    activeOpacity={0.8}
                    style={styles.logoRow}
                >
                    <View style={styles.logoBox}>
                        <Ionicons name="school" size={22} color="white" />
                    </View>
                    {!isSidebarCollapsed && (
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.brandText}>{process.env.EXPO_PUBLIC_APP_NAME || "Pro Teach"}</Text>
                            <Text style={styles.brandSubText}>LMS Platform</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Navigation */}
            <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
                {sections.map((section, index) => (
                    <View key={index} style={styles.sectionContainer}>
                        {!isSidebarCollapsed && <Text style={styles.sectionTitle}>{section.section}</Text>}
                        {section.items.map((item) => {
                            const isActive = activeRoute === item.route;
                            return (
                                <TouchableOpacity
                                    key={item.name}
                                    style={[
                                        styles.navItem,
                                        isSidebarCollapsed && styles.navItemCollapsed,
                                        isActive && styles.navItemActive
                                    ]}
                                    onPress={() => navigation.navigate(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={isActive && item.icon.includes('-outline') ? item.icon.replace('-outline', '') : item.icon}
                                        size={20}
                                        color={isActive ? TEXT_ACTIVE : TEXT_COLOR}
                                    />
                                    {!isSidebarCollapsed && (
                                        <Text style={[
                                            styles.navText,
                                            isActive && styles.navTextActive
                                        ]}>
                                            {item.label}
                                        </Text>
                                    )}
                                    {isActive && !isSidebarCollapsed && (
                                        <View style={styles.activeIndicator} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            {/* User Profile & Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.userCard, isSidebarCollapsed && { paddingHorizontal: 0, justifyContent: 'center' }]}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(userInfo?.name)}</Text>
                    </View>
                    {!isSidebarCollapsed && (
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.userName} numberOfLines={1}>{userInfo?.name || 'User'}</Text>
                            <Text style={styles.userRole}>{userInfo?.role || 'Student'}</Text>
                        </View>
                    )}
                    {!isSidebarCollapsed && <Ionicons name="settings-outline" size={16} color={TEXT_COLOR} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.footerItem, isSidebarCollapsed && styles.footerItemCollapsed]}
                    onPress={toggleSidebar}
                >
                    <Ionicons
                        name={isSidebarCollapsed ? "chevron-forward-outline" : "chevron-back-outline"}
                        size={20}
                        color={TEXT_COLOR}
                    />
                    {!isSidebarCollapsed && <Text style={styles.footerText}>Collapse</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        backgroundColor: SIDEBAR_BG,
        flexDirection: 'column',
        borderRightWidth: 1,
        borderRightColor: '#2e2a5b',
    },
    header: {
        height: 80,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2e2a5b',
    },
    headerCollapsed: {
        paddingHorizontal: 0,
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#4338ca', // Indigo-700
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        letterSpacing: -0.5,
    },
    brandSubText: {
        fontSize: 12,
        color: TEXT_COLOR,
        marginTop: -2,
    },
    navScroll: {
        flex: 1,
        paddingVertical: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6366f1', // Indigo-500
        paddingHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 4,
    },
    navItemCollapsed: {
        marginHorizontal: 12,
        paddingHorizontal: 0,
        justifyContent: 'center',
    },
    navItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    navText: {
        marginLeft: 12,
        fontSize: 14,
        color: TEXT_COLOR,
        fontWeight: '500',
    },
    navTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        height: 20,
        width: 3,
        backgroundColor: '#6366f1',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#2e2a5b',
        backgroundColor: '#17153b', // Slightly darker
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#4338ca',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    userRole: {
        color: TEXT_COLOR,
        fontSize: 11,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        paddingHorizontal: 10,
        borderRadius: 8,
        justifyContent: 'center',
    },
    footerItemCollapsed: {
        paddingHorizontal: 0,
    },
    footerText: {
        marginLeft: 10,
        fontSize: 13,
        color: TEXT_COLOR,
        fontWeight: '500',
    }
});

export default WebSidebar;
