import React, { useContext, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { ThemeContext } from '../../context/ThemeContext';
import { useUI } from '../../context/UIContext';
import { SchoolContext } from '../../context/SchoolContext';

const { width } = Dimensions.get('window');

const TabButton = ({
    item,
    onPress,
    accessibilityState,
    theme,
    badge,
    indicator, // e.g. "LIVE"
    index,
    totalTabs
}) => {
    const focused = accessibilityState.selected;
    const viewRef = useRef(null);
    const circleAnim = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (focused) {
            Animated.parallel([
                Animated.spring(circleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                }),
                Animated.timing(textAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(circleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(textAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [focused]);

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={1}
            style={styles.tabBtn}
        >
            <View style={styles.iconContainer}>
                {focused && (
                    <Animated.View
                        style={[
                            styles.activeCircle,
                            {
                                opacity: circleAnim,
                                transform: [{ scale: circleAnim }]
                            }
                        ]}
                    />
                )}

                <Ionicons
                    name={focused ? item.activeIcon : item.inactiveIcon}
                    size={24}
                    color={focused ? theme.primary : theme.textSecondary}
                />

                {/* LIVE Indicator */}
                {indicator === 'LIVE' && (
                    <View style={styles.liveIndicator}>
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}

                {/* Badge/Dot Indicator */}
                {badge && !indicator && (
                    <View style={[styles.badge, { backgroundColor: badge === 'update' ? theme.secondary : COLORS.danger, borderColor: theme.surface }]}>
                        <View style={styles.badgeDot} />
                    </View>
                )}
            </View>

            <Animated.Text
                style={[
                    styles.label,
                    {
                        color: focused ? theme.primary : theme.textSecondary,
                        opacity: textAnim,
                        transform: [{
                            translateY: textAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0]
                            })
                        }]
                    }
                ]}
            >
                {item.label}
            </Animated.Text>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { schedule, courses, attendance } = useContext(SchoolContext);

    // Badge Logic
    const getTabMeta = (routeName) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = now.getHours() + (now.getMinutes() / 60);

        if (routeName === 'Students') {
            // Check if attendance pending for any group today
            // For now, let's just check if there are less attendance records than groups today
            const todaySchedule = schedule.filter(s => s.date === todayStr);
            const todayAttendance = attendance.filter(a => a.date === todayStr);
            if (todaySchedule.length > todayAttendance.length) return { badge: true };
        }

        if (routeName === 'Courses') {
            // LIVE indicator if a class is happening now
            const isLive = schedule.some(s => {
                if (s.date !== todayStr) return false;
                const start = parseFloat(s.startTime?.replace(':', '.') || 0);
                const end = parseFloat(s.endTime?.replace(':', '.') || 0);
                return currentTime >= start && currentTime < end;
            });
            if (isLive) return { indicator: 'LIVE' };
        }

        if (routeName === 'Schedule') {
            // Dot if lesson today
            const hasLesson = schedule.some(s => s.date === todayStr);
            if (hasLesson) return { badge: true };
        }

        if (routeName === 'More') {
            return { badge: 'update' }; // Mock update/notification
        }

        return {};
    };

    return (
        <View style={styles.container}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 80 : 100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.blurContainer,
                    {
                        backgroundColor: isDarkMode ? 'rgba(22, 27, 34, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        borderColor: theme.border
                    }
                ]}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    // Define icons based on route name
                    let activeIcon = 'grid';
                    let inactiveIcon = 'grid-outline';

                    if (route.name === 'Dashboard') { activeIcon = 'grid'; inactiveIcon = 'grid-outline'; }
                    else if (route.name === 'Students') { activeIcon = 'people'; inactiveIcon = 'people-outline'; }
                    else if (route.name === 'Courses') { activeIcon = 'layers'; inactiveIcon = 'layers-outline'; }
                    else if (route.name === 'Schedule') { activeIcon = 'calendar'; inactiveIcon = 'calendar-outline'; }
                    else if (route.name === 'More') { activeIcon = 'ellipsis-horizontal-circle'; inactiveIcon = 'ellipsis-horizontal-circle-outline'; }
                    // Student routes
                    else if (route.name === 'Home') { activeIcon = 'home'; inactiveIcon = 'home-outline'; }
                    else if (route.name === 'MyCourses') { activeIcon = 'library'; inactiveIcon = 'library-outline'; }
                    else if (route.name === 'Payments') { activeIcon = 'wallet'; inactiveIcon = 'wallet-outline'; }

                    const isFocused = state.index === index;
                    const meta = getTabMeta(route.name);

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TabButton
                            key={index}
                            item={{ name: route.name, label, activeIcon, inactiveIcon }}
                            onPress={onPress}
                            accessibilityState={{ selected: isFocused }}
                            theme={theme}
                            badge={meta.badge}
                            indicator={meta.indicator}
                            index={index}
                            totalTabs={state.routes.length}
                        />
                    );
                })}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20
    },
    blurContainer: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 500, // Limit width on tablets
        height: 70,
        borderRadius: 35,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1, // subtle border
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    tabBtn: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeCircle: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(79, 70, 229, 0.15)', // Dynamic enough
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
    },
    liveIndicator: {
        position: 'absolute',
        top: 0,
        right: -8,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    liveText: {
        color: 'white',
        fontSize: 7,
        fontWeight: 'bold',
    }
});

export default CustomTabBar;
