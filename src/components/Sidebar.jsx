import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Sidebar = ({ activeRoute = 'Dashboard' }) => {
    const navigation = useNavigation();
    const { theme } = useContext(ThemeContext);
    const { userInfo, logout } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);

    // Sidebar items configuration
    const menuItems = [
        { name: 'Dashboard', icon: 'grid-outline', route: 'Dashboard' },
        { name: 'O\'quvchilar', icon: 'people-outline', route: 'Students' },
        { name: 'Guruhlar', icon: 'people-circle-outline', route: 'Courses' },
        { name: 'Jadval', icon: 'calendar-outline', route: 'Schedule' },
        { name: 'Lidlar', icon: 'magnet-outline', route: 'Leads' },
        { name: 'O\'qituvchilar', icon: 'school-outline', route: 'Teachers' },
        { name: 'Xonalar', icon: 'business-outline', route: 'Rooms' },
        { name: 'Moliya', icon: 'wallet-outline', route: 'Finance' },
        { name: 'Sozlamalar', icon: 'settings-outline', route: 'Settings' },
    ];

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <View style={[styles.container, {
            width: collapsed ? 80 : 280,
            backgroundColor: theme.surface,
            borderColor: theme.border
        }]}>
            {/* Header / Logo */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                {!collapsed && (
                    <Text style={[styles.appName, { color: COLORS.primary }]}>ProTeach</Text>
                )}
                <TouchableOpacity onPress={toggleCollapse} style={styles.collapseBtn}>
                    <Ionicons
                        name={collapsed ? "chevron-forward" : "chevron-back"}
                        size={20}
                        color={theme.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* User Profile Summary */}
            <View style={[styles.profileSection, { borderBottomColor: theme.border }]}>
                <Image
                    source={userInfo?.avatar ? { uri: userInfo.avatar } : { uri: 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                    style={styles.avatar}
                />
                {!collapsed && (
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                            {userInfo?.name || 'User'}
                        </Text>
                        <Text style={[styles.userRole, { color: theme.textSecondary }]}>
                            {userInfo?.role === 'admin' ? 'Administrator' : 'Teacher'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Navigation Menu */}
            <View style={styles.menuContainer}>
                {menuItems.map((item) => {
                    const isActive = activeRoute === item.route;
                    return (
                        <TouchableOpacity
                            key={item.route}
                            style={[
                                styles.menuItem,
                                isActive && styles.menuItemActive,
                                { backgroundColor: isActive ? COLORS.primary + '15' : 'transparent' }
                            ]}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={isActive ? COLORS.primary : theme.textSecondary}
                            />
                            {!collapsed && (
                                <Text style={[
                                    styles.menuText,
                                    { color: isActive ? COLORS.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }
                                ]}>
                                    {item.name}
                                </Text>
                            )}
                            {isActive && !collapsed && (
                                <View style={styles.activeIndicator} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Footer / Logout */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                    {!collapsed && (
                        <Text style={[styles.menuText, { color: COLORS.danger }]}>Chiqish</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        borderRightWidth: 1,
        flexDirection: 'column',
    },
    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centered for collapsed state logic
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
    },
    collapseBtn: {
        padding: 5,
        borderRadius: 5,
        backgroundColor: '#F5F5F5',
    },
    profileSection: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        gap: 12,
        justifyContent: 'center', // aligns avatar when collapsed
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
    },
    userRole: {
        fontSize: 12,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 12, // Reduced padding for tighter desktop feel
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemActive: {
        // bg handled inline
    },
    menuText: {
        marginLeft: 12,
        fontSize: 14,
    },
    activeIndicator: {
        position: 'absolute',
        right: 12,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    footer: {
        padding: 20,
        paddingBottom: 30, // Extra padding for bottom
    }
});

export default Sidebar;
