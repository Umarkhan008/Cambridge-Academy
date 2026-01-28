import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Premium Screen Header Component
 * Automatically handles safe area insets and status bar spacing
 * 
 * @param {string} title - Main title text
 * @param {string} subtitle - Optional subtitle text
 * @param {boolean} showBack - Show back button (default: false)
 * @param {React.ReactNode} rightAction - Optional right side action component
 * @param {string} rightIcon - Icon name for right action button
 * @param {function} onRightPress - Handler for right action button
 * @param {object} style - Additional container styles
 */
const ScreenHeader = ({
    title,
    subtitle,
    showBack = false,
    rightAction,
    rightIcon,
    onRightPress,
    style,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = React.useContext(ThemeContext);

    // Calculate top padding: use safe area inset or fallback to status bar height
    const topPadding = Platform.select({
        ios: insets.top,
        android: insets.top || Constants.statusBarHeight || 24,
        default: 0
    });

    return (
        <View style={[styles.container, { paddingTop: topPadding + 12, backgroundColor: theme.background }, style]}>
            <View style={styles.content}>
                {/* Left side - Back button or spacer */}
                {showBack ? (
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.surface }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.spacer} />
                )}

                {/* Center - Title and subtitle */}
                <View style={[styles.titleContainer, showBack && styles.titleContainerWithBack]}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
                    )}
                </View>

                {/* Right side - Custom action or icon button */}
                {rightAction ? (
                    rightAction
                ) : rightIcon ? (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.surface }]}
                        onPress={onRightPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={rightIcon} size={22} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.spacer} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FE',
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    spacer: {
        width: 44,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 0,
    },
    titleContainerWithBack: {
        marginLeft: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1D29',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: '#6B7280',
        marginTop: 2,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
});

export default ScreenHeader;
