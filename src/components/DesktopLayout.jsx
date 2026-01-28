import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Sidebar from './Sidebar';

const DesktopLayout = ({ children, activeRoute = 'Dashboard' }) => {
    const { theme } = useContext(ThemeContext);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Left Sidebar */}
            <Sidebar activeRoute={activeRoute} />

            {/* Main Content Area */}
            <View style={styles.contentArea}>
                {/* We assume children will handle their own scrolling if needed, or we can make this a ScrollView */}
                {/* But for full flexibility (like fixed headers), View is safer. The Dashboard will use ScrollView. */}
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        height: '100vh', // Ensure full height on web
        overflow: 'hidden', // Prevent double scrolls
    },
    contentArea: {
        flex: 1,
        flexDirection: 'column',
    }
});

export default DesktopLayout;
