import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebSidebar from '../components/WebSidebar';
import { ThemeContext } from '../context/ThemeContext';
import { useRoute } from '@react-navigation/native';

const WebLayout = ({ children }) => {
    const { theme } = useContext(ThemeContext);
    const route = useRoute();

    // We need to determine the 'active' route name. 
    // Usually, the direct child of WebLayout is the screen, so we can pass the route name.
    // However, since this wraps the screen content, we can get the route name from useRoute() if this component is rendered INSIDE a screen.
    // BUT! I'm planning to use this as a wrapper inside screens.

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <WebSidebar activeRoute={route.name} />
            <View style={[styles.content, { backgroundColor: theme.background }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        // Desktop height fix
        ...Platform.select({
            web: {
                height: '100vh',
                overflow: 'hidden',
            },
            default: {
                height: '100%',
            }
        }),
        width: '100%'
    },
    content: {
        flex: 1,
        // Ensure child screens don't overflow horizontally
        width: '100%',
        minHeight: '100%', // Take at least the full height
        ...Platform.select({
            web: {
                overflowY: 'auto',
                overflowX: 'hidden',
                height: '100vh', // Constraint to viewport for independent scroll if needed, but we'll use auto
            },
            default: {
                height: '100%',
                overflow: 'hidden',
            }
        })
    }
});

export default WebLayout;
