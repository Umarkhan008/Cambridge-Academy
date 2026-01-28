import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { useUI } from './UIContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const { showLoader, hideLoader } = useUI();

    const login = async (loginVal, password, role) => {
        showLoader('Tizimga kirish...');

        try {
            let user = null;

            if (role === 'admin') {
                // Hardcoded admin for now, or you can use a separate 'admins' collection
                if (loginVal === 'admin@pro.uz' && password === 'admin123') {
                    user = {
                        id: 'admin-1',
                        name: 'Admin User',
                        email: loginVal,
                        role: 'admin',
                        avatar: null
                    };
                } else {
                    Alert.alert('Xatolik', 'Admin logini yoki paroli noto\'g\'ri');
                    hideLoader();
                    return;
                }
            } else if (role === 'teacher') {
                // Teacher login via Firestore
                const teachersRef = collection(db, 'teachers');
                const q = query(teachersRef, where('login', '==', loginVal), where('password', '==', password));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const teacherDoc = querySnapshot.docs[0];
                    const teacherData = teacherDoc.data();
                    user = {
                        id: teacherDoc.id,
                        name: teacherData.name,
                        login: teacherData.login,
                        role: 'teacher',
                        teacherId: teacherDoc.id,
                        avatar: teacherData.avatar || null,
                        ...teacherData
                    };
                } else {
                    Alert.alert('Xatolik', 'Login yoki parol noto\'g\'ri');
                    hideLoader();
                    return;
                }
            } else {
                // Student login via Firestore
                const studentsRef = collection(db, 'students');
                const q = query(studentsRef, where('login', '==', loginVal), where('password', '==', password));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const studentDoc = querySnapshot.docs[0];
                    const studentData = studentDoc.data();
                    user = {
                        id: studentDoc.id,
                        name: studentData.name,
                        login: studentData.login,
                        role: 'student',
                        studentId: studentDoc.id,
                        avatar: studentData.avatar || null,
                        ...studentData
                    };
                } else {
                    Alert.alert('Xatolik', 'Login yoki parol noto\'g\'ri');
                    hideLoader();
                    return;
                }
            }

            if (user) {
                setUserInfo(user);
                setUserToken('dummy-auth-token-' + user.id);
                await AsyncStorage.setItem('userToken', 'dummy-auth-token-' + user.id);
                await AsyncStorage.setItem('userInfo', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Xatolik', 'Tizimga kirishda xatolik yuz berdi');
        } finally {
            hideLoader();
        }
    };

    const updateProfile = async (updatedData) => {
        showLoader('Profil yangilanmoqda...');
        try {
            const newUserInfo = { ...userInfo, ...updatedData };

            // Persist to Firestore if not hardcoded admin
            if (userInfo.role !== 'admin') {
                const collectionName = userInfo.role === 'teacher' ? 'teachers' : 'students';
                const docRef = doc(db, collectionName, userInfo.id);
                // Filter out non-firestore fields if necessary, but for now spread is okay
                // user.id might be the doc id.

                // We should only update specific fields to avoid overwriting critical auth data if not intended
                const { name, phone, email, avatar } = updatedData;
                const updatePayload = {};
                if (name) updatePayload.name = name;
                if (phone) updatePayload.phone = phone;
                if (email) updatePayload.email = email;
                if (avatar) updatePayload.avatar = avatar;

                if (Object.keys(updatePayload).length > 0) {
                    await updateDoc(docRef, updatePayload);
                }
            }

            // Update State
            setUserInfo(newUserInfo);
            await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Xatolik', 'Profilni yangilashda xatolik yuz berdi');
            return { success: false, error };
        } finally {
            hideLoader();
        }
    };

    const logout = () => {
        showLoader('Chiqilmoqda...');
        setUserToken(null);
        setUserInfo(null);
        AsyncStorage.removeItem('userToken');
        AsyncStorage.removeItem('userInfo');
        hideLoader();
    };

    const isLoggedIn = async () => {
        try {
            showLoader();
            let userToken = await AsyncStorage.getItem('userToken');
            let userInfo = await AsyncStorage.getItem('userInfo');

            if (userToken) {
                setUserToken(userToken);
                setUserInfo(JSON.parse(userInfo));
            }
            hideLoader();
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            hideLoader();
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, updateProfile, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
