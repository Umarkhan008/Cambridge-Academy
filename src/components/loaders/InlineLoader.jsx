import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../constants/theme';

const InlineLoader = ({ color = COLORS.primary, size = 8 }) => {
    const scale1 = useRef(new Animated.Value(1)).current;
    const scale2 = useRef(new Animated.Value(1)).current;
    const scale3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const createAnimation = (anim, delay) => {
            return Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 0.5,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.delay(200), // pause
                    ])
                )
            ]);
        };

        const anim1 = createAnimation(scale1, 0);
        const anim2 = createAnimation(scale2, 200);
        const anim3 = createAnimation(scale3, 400);

        Animated.parallel([anim1, anim2, anim3]).start();
    }, []);

    const dotStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        marginHorizontal: size / 3,
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[dotStyle, { transform: [{ scale: scale1 }], opacity: scale1 }]} />
            <Animated.View style={[dotStyle, { transform: [{ scale: scale2 }], opacity: scale2 }]} />
            <Animated.View style={[dotStyle, { transform: [{ scale: scale3 }], opacity: scale3 }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default InlineLoader;
