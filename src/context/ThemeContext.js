
import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [theme, setTheme] = useState(COLORS);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('userTheme');
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme === 'dark');
                } else {
                    // Default to system preference
                    setIsDarkMode(systemScheme === 'dark');
                }
            } catch (e) {
                console.log('Failed to load theme', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, []);

    // Update theme object when mode changes
    useEffect(() => {
        if (isDarkMode) {
            setTheme({ ...COLORS, ...COLORS.dark });
        } else {
            setTheme(COLORS);
        }
    }, [isDarkMode]);

    const toggleTheme = async (value) => {
        setIsDarkMode(value);
        try {
            await AsyncStorage.setItem('userTheme', value ? 'dark' : 'light');
        } catch (e) {
            console.log('Failed to save theme', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};
