import React, { useContext } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import WebSidebar from '../components/WebSidebar';
import { ThemeContext } from '../context/ThemeContext';
import { useRoute } from '@react-navigation/native';
import { useUI } from '../context/UIContext';

const AdminLayout = ({ children }) => {
    const { theme } = useContext(ThemeContext);
    const route = useRoute();
    const { width } = useWindowDimensions();
    const { isSidebarCollapsed, toggleSidebar } = useUI();

    // Strict Desktop Breakpoint Check >= 1280px
    const isDesktop = Platform.OS === 'web' && width >= 1280;

    // If not desktop, validly return ONLY children without sidebar wrap.
    if (!isDesktop) {
        return (
            <View style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#F3F4F6' }]}>
            {/* Desktop Sidebar */}
            <WebSidebar
                activeRoute={route.name}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />

            {/* Desktop Content Area - Let each screen handle its own scrolling */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        height: Platform.OS === 'web' ? '100vh' : '100%',
        width: '100%',
        overflow: 'hidden',
    },
    mobileContainer: {
        flex: 1,
        width: '100%',
    },
    content: {
        flex: 1,
        height: '100%',
        width: '100%',
    }
});

export default AdminLayout;
