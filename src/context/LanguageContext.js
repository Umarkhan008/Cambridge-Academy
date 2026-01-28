
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../constants/translations';

// Provide default value to prevent "Property 't' doesn't exist" errors
export const LanguageContext = createContext({
    language: 'en',
    changeLanguage: () => { },
    t: translations.en
});

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // Default to English
    const [t, setT] = useState(translations.en); // Current translations object

    // Load saved language
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem('userLanguage');
                if (savedLanguage) {
                    setLanguage(savedLanguage);
                    setT(translations[savedLanguage]);
                }
            } catch (e) {
                console.log('Failed to load language', e);
            }
        };
        loadLanguage();
    }, []);

    const changeLanguage = async (langCode) => {
        setLanguage(langCode);
        setT(translations[langCode]);
        try {
            await AsyncStorage.setItem('userLanguage', langCode);
        } catch (e) {
            console.log('Failed to save language', e);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
