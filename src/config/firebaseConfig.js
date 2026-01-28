import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCzZ1EJZKnHMcI8Qk47Omxoy46-WxyGios",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "pro-teach-app.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "pro-teach-app",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "pro-teach-app.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "915656557990",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:915656557990:web:dfb7317a8937cab517fb67",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0J00SF151M"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
// Fix: persistence only on web for now to avoid IndexedDB errors on Native
let db;
try {
    if (Platform.OS === 'web') {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
    } else {
        // Native (Android/iOS)
        db = getFirestore(app);
    }
} catch (e) {
    console.warn("Firestore init error, falling back to default", e);
    db = getFirestore(app);
}

// Initialize Auth
let auth;
const setupAuth = () => {
    const persistence = Platform.OS === 'web'
        ? browserLocalPersistence
        : getReactNativePersistence(AsyncStorage);

    // If we've already initialized, getAuth(app) will return the instance.
    // However, initializeAuth should only be called once.
    try {
        const existingAuth = getAuth(app);
        if (existingAuth) return existingAuth;
    } catch (e) {
        // Not initialized yet
    }

    return initializeAuth(app, { persistence });
};

auth = setupAuth();

export { db, auth };
