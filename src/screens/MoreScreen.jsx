import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import Header from '../components/Header';

const MenuItem = ({ icon, title, subtitle, onPress, color, iconFamily = 'Ionicons' }) => {
    const { theme } = useContext(ThemeContext);

    const IconComponent = iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
        iconFamily === 'FontAwesome5' ? FontAwesome5 : Ionicons;

    return (
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <IconComponent name={icon} size={24} color={color} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textLight || '#9CA3AF'} />
        </TouchableOpacity>
    );
};

const MoreScreen = () => {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);
    const navigation = useNavigation();

    return (
        <SafeAreaView style={[globalStyles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            <Header title={t.moreTitle} subtitle={t.additionalFeatures} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={globalStyles.screenPadding}>

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.management}</Text>

                    <MenuItem
                        icon="school-outline"
                        title={t.teachers}
                        subtitle={t.teachersSubtitle}
                        color={COLORS.info}
                        onPress={() => navigation.navigate('Teachers')}
                    />

                    <MenuItem
                        icon="magnet-outline"
                        title={t.leads}
                        subtitle={t.leadsSubtitle}
                        color="#F59E0B"
                        onPress={() => navigation.navigate('Leads')}
                    />

                    <MenuItem
                        icon="list-outline"
                        title={t.subjects}
                        subtitle={t.subjectsSubtitle}
                        color="#8B5CF6"
                        onPress={() => navigation.navigate('Subjects')}
                    />

                    <MenuItem
                        icon="cube-outline"
                        title={t.rooms}
                        subtitle={t.roomsSubtitle}
                        color="#10B981"
                        onPress={() => navigation.navigate('Rooms')}
                    />

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>{t.operations}</Text>

                    <MenuItem
                        icon="cash-outline"
                        title={t.payments}
                        subtitle={t.financeSubtitle}
                        color="#10B981"
                        onPress={() => navigation.navigate('Finance')}
                    />

                    <MenuItem
                        icon="settings-outline"
                        title={t.settings}
                        subtitle={t.settingsSubtitle}
                        color={theme.primary}
                        onPress={() => navigation.navigate('Settings')}
                    />

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 100
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 5
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15
    },
    menuContent: {
        flex: 1
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    menuSubtitle: {
        fontSize: 12,
    }
});

export default MoreScreen;
