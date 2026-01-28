import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS } from '../constants/theme';
import { useUI } from '../context/UIContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Loader = () => {
    const { isLoading, loadingText } = useUI();
    const [isVisible, setIsVisible] = useState(isLoading);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Custom Brand Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLoading) {
            setIsVisible(true);
            // Appear Instantly (<20ms)
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 10,
                useNativeDriver: true,
            }).start();

            // Reset animations
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);

            // Start Loops
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ).start();

            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();

        } else {
            // Disappear Fast but Smooth
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setIsVisible(false);
            });
        }
    }, [isLoading]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            statusBarTranslucent={true}
        >
            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                    }
                ]}
            >
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[styles.backgroundOverlay, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />

                <View style={styles.content}>
                    {/* Brand Logo / Custom Spinner */}
                    <View style={styles.iconWrapper}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <View style={styles.brandCircle}>
                                <Ionicons name="school" size={32} color={COLORS.primary} />
                            </View>
                        </Animated.View>

                        {/* Orbiting Dot */}
                        <Animated.View style={[styles.orbitContainer, { transform: [{ rotate: spin }] }]}>
                            <View style={styles.orbitDot} />
                        </Animated.View>
                    </View>

                    {loadingText ? (
                        <Text style={styles.text}>{loadingText}</Text>
                    ) : (
                        <Text style={styles.text}>Ma'lumotlar yuklanmoqda...</Text>
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    orbitContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orbitDot: {
        position: 'absolute',
        top: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.secondary,
    },
    text: {
        ...FONTS.h4,
        color: COLORS.primary,
        fontWeight: '600',
        letterSpacing: 0.5,
    }
});

export default Loader;
