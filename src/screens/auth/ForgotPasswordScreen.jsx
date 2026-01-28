import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import globalStyles from '../../styles/globalStyles';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { useUI } from '../../context/UIContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendEmailVerification } from '../../utils/emailService';

const ForgotPasswordScreen = ({ navigation }) => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const { showLoader, hideLoader } = useUI();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [step, setStep] = useState(1); // 1: Input Phone, 2: Choose Method, 3: Input Code, 4: New Password
    const [method, setMethod] = useState('email');
    const [verificationCode, setVerificationCode] = useState('');
    const [sentCode, setSentCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [foundUser, setFoundUser] = useState(null);

    const handleSearchUser = async () => {
        if (!phoneNumber || phoneNumber.length < 9) {
            Alert.alert("Xatolik", "Iltimos, telefon raqamingizni to'g'ri kiriting");
            return;
        }

        showLoader();
        try {
            let user = null;
            let collectionName = '';

            const tQuery = query(collection(db, 'teachers'), where('phone', '==', phoneNumber));
            const tSnap = await getDocs(tQuery);

            if (!tSnap.empty) {
                user = { id: tSnap.docs[0].id, ...tSnap.docs[0].data() };
                collectionName = 'teachers';
            } else {
                const sQuery = query(collection(db, 'students'), where('phone', '==', phoneNumber));
                const sSnap = await getDocs(sQuery);
                if (!sSnap.empty) {
                    user = { id: sSnap.docs[0].id, ...sSnap.docs[0].data() };
                    collectionName = 'students';
                }
            }

            if (user) {
                if (!user.email) {
                    Alert.alert("Xatolik", "Profilingizda email topilmadi. Parolni tiklash uchun administratorga murojaat qiling.");
                    hideLoader();
                    return;
                }
                setFoundUser({ ...user, collectionName });

                // Directly send code
                const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                setSentCode(randomCode);

                const success = await sendEmailVerification(user.email, user.name, randomCode);
                if (success) {
                    Alert.alert("Email Yuborildi", "Tasdiqlash kodi pochtangizga yuborildi.", [{ text: "OK", onPress: () => setStep(3) }]);
                } else {
                    Alert.alert("Xatolik", "Email yuborishda xatolik yuz berdi.");
                }
            } else {
                Alert.alert("Xatolik", "Bu telefon raqami tizimda topilmadi");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Xatolik", "Texnik xatolik yuz berdi");
        } finally {
            hideLoader();
        }
    };

    const handleResendCode = async () => {
        showLoader('Qayta yuborilmoqda...');
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(randomCode);

        const success = await sendEmailVerification(foundUser.email, foundUser.name, randomCode);
        if (success) {
            Alert.alert("Qayta yuborildi", "Yangi kod pochtangizga yuborildi.");
        } else {
            Alert.alert("Xatolik", "Email yuborishda xatolik.");
        }
        hideLoader();
    };

    const handleVerifyCode = () => {
        if (verificationCode === sentCode) {
            setStep(4);
        } else {
            Alert.alert("Xatolik", "Tasdiqlash kodi noto'g'ri");
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert("Xatolik", "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Xatolik", "Parollar mos kelmadi");
            return;
        }

        showLoader();
        try {
            const userRef = doc(db, foundUser.collectionName, foundUser.id);
            await updateDoc(userRef, {
                password: newPassword
            });

            Alert.alert(
                "Muvaffaqiyatli",
                "Parolingiz muvaffaqiyatli yangilandi",
                [{ text: "Kirish", onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Xatolik", "Parolni yangilashda xatolik yuz berdi");
        } finally {
            hideLoader();
        }
    };

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Parolni tiklash</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={step === 1 ? "phone-portrait-outline" : step === 3 ? "mail-open-outline" : "lock-open-outline"}
                        size={80}
                        color={COLORS.primary}
                    />
                </View>

                {step === 1 && (
                    <View>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Tizimga bog'langan telefon raqamingizni kiriting.
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Ionicons name="call-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="+998 90 123 45 67"
                                placeholderTextColor={theme.textLight}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <TouchableOpacity
                            style={[globalStyles.button, { marginTop: 20 }]}
                            onPress={handleSearchUser}
                        >
                            <Text style={globalStyles.buttonText}>Davom etish</Text>
                        </TouchableOpacity>
                    </View>
                )}


                {step === 3 && (
                    <View>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Yuborilgan 6 xonali tasdiqlash kodini kiriting.
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text, letterSpacing: 5, fontSize: 20 }]}
                                placeholder="000000"
                                placeholderTextColor={theme.textLight}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                        <TouchableOpacity style={[globalStyles.button, { marginTop: 20 }]} onPress={handleVerifyCode}>
                            <Text style={globalStyles.buttonText}>Tasdiqlash</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleResendCode}>
                            <Text style={{ color: COLORS.primary, textAlign: 'center' }}>Kodni qayta yuborish</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 4 && (
                    <View>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Yangi parolingizni belgilang.
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface, marginBottom: 15 }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Yangi parol"
                                placeholderTextColor={theme.textLight}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>
                        <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.textLight} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Parolni tasdiqlang"
                                placeholderTextColor={theme.textLight}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>
                        <TouchableOpacity style={[globalStyles.button, { marginTop: 20 }]} onPress={handleResetPassword}>
                            <Text style={globalStyles.buttonText}>Saqlash</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    title: {
        ...FONTS.h2,
        fontWeight: 'bold',
    },
    content: {
        padding: SIZES.padding,
        alignItems: 'center',
    },
    iconContainer: {
        marginVertical: 40,
        backgroundColor: COLORS.primary + '10',
        padding: 30,
        borderRadius: 100,
    },
    subtitle: {
        ...FONTS.body3,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 15,
        width: SIZES.width - 40,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        ...FONTS.body3,
    },
    methodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        width: SIZES.width - 40,
    },
    activeMethod: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    methodText: {
        ...FONTS.h3,
        marginLeft: 15,
        fontWeight: '600',
    }
});

export default ForgotPasswordScreen;
