import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import InlineLoader from './InlineLoader';

const LoadingButton = ({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    style,
    textStyle,
    color = COLORS.primary,
    loaderColor = 'white'
}) => {
    // Animations
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const loaderOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLoading) {
            // Loading State
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(loaderOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 0.98,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // Normal State
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(loaderOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isLoading]);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
            style={[
                styles.button,
                { backgroundColor: disabled ? '#E0E0E0' : color },
                style
            ]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={[styles.contentContainer, { opacity: contentOpacity }]}>
                    <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>{title}</Text>
                </Animated.View>

                <Animated.View style={[styles.loaderContainer, { opacity: loaderOpacity }]}>
                    <InlineLoader color={loaderColor} size={8} />
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        ...FONTS.h3,
        color: 'white',
        fontWeight: 'bold',
    },
    disabledText: {
        color: '#A0A0A0'
    }
});

export default LoadingButton;
