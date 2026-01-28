import React, { useContext } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES } from './src/constants/theme';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';
import { LanguageContext, LanguageProvider } from './src/context/LanguageContext';
import { SchoolProvider } from './src/context/SchoolContext';
import { UIProvider } from './src/context/UIContext';
import Loader from './src/components/Loader';
import AdminLayout from './src/layouts/AdminLayout';
import linking from './src/config/linking';

// Import Screens (Admin)
import DashboardScreen from './src/screens/DashboardScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import TeachersScreen from './src/screens/TeachersScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import TeacherDetailScreen from './src/screens/TeacherDetailScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import MoreScreen from './src/screens/MoreScreen';
import CustomTabBar from './src/components/navigation/CustomTabBar';

// Import Screens (Student)
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';
import MyCoursesScreen from './src/screens/student/MyCoursesScreen';
import MyScheduleScreen from './src/screens/student/MyScheduleScreen';
import MyPaymentsScreen from './src/screens/student/MyPaymentsScreen';

// Import Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const FullWebScreen = (Component) => (props) => (
    <AdminLayout>
        <Component {...props} />
    </AdminLayout>
);

// Admin Web Navigator (Desktop Sidebar Layout)
const AdminWebNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
            <Stack.Screen name="Dashboard" component={FullWebScreen(DashboardScreen)} />
            <Stack.Screen name="Students" component={FullWebScreen(StudentsScreen)} />
            <Stack.Screen name="Teachers" component={FullWebScreen(TeachersScreen)} />
            <Stack.Screen name="Courses" component={FullWebScreen(CoursesScreen)} />
            <Stack.Screen name="Rooms" component={FullWebScreen(RoomsScreen)} />
            <Stack.Screen name="Subjects" component={FullWebScreen(SubjectsScreen)} />
            <Stack.Screen name="Leads" component={FullWebScreen(LeadsScreen)} />
            <Stack.Screen name="Schedule" component={FullWebScreen(ScheduleScreen)} />
            <Stack.Screen name="Finance" component={FullWebScreen(FinanceScreen)} />
            <Stack.Screen name="Settings" component={FullWebScreen(SettingsScreen)} />
        </Stack.Navigator>
    );
};

// Stack for More tab screens to prevent navigation errors
const MoreStack = createStackNavigator();
const AdminMoreStack = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    return (
        <MoreStack.Navigator screenOptions={{ headerShown: false }}>
            <MoreStack.Screen name="MoreMain" component={MoreScreen} />
            <MoreStack.Screen name="Teachers" component={TeachersScreen} />
            <MoreStack.Screen name="Leads" component={LeadsScreen} />
            <MoreStack.Screen name="Subjects" component={SubjectsScreen} />
            <MoreStack.Screen name="Rooms" component={RoomsScreen} />
            <MoreStack.Screen name="Finance" component={FinanceScreen} />
            <MoreStack.Screen name="Settings" component={SettingsScreen} />
        </MoreStack.Navigator>
    );
};

// Admin Mobile Tab Navigator
const AdminTabNavigator = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    // tabBarStyle removed as it is handled by CustomTabBar

    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t.dashboard }} />
            <Tab.Screen name="Students" component={StudentsScreen} options={{ tabBarLabel: t.students }} />
            <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarLabel: t.groups || 'Guruhlar' }} />
            <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: t.schedule }} />
            <Tab.Screen name="More" component={AdminMoreStack} options={{ tabBarLabel: t.more }} />
        </Tab.Navigator>
    );
};

// Student Tab Navigator
const StudentTabNavigator = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useContext(LanguageContext);

    // tabBarStyle removed, using CustomTabBar

    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Home" component={StudentHomeScreen} options={{ tabBarLabel: t.home }} />
            <Tab.Screen name="MyCourses" component={MyCoursesScreen} options={{ tabBarLabel: t.classes }} />
            <Tab.Screen name="Schedule" component={MyScheduleScreen} options={{ tabBarLabel: t.schedule }} />
            <Tab.Screen name="Payments" component={MyPaymentsScreen} options={{ tabBarLabel: t.payments }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t.settings }} />
        </Tab.Navigator>
    );
};

// Student Web Navigator
// Student Web Navigator
const StudentWebNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
            <Stack.Screen name="Home" component={FullWebScreen(StudentHomeScreen)} />
            <Stack.Screen name="MyCourses" component={FullWebScreen(MyCoursesScreen)} />
            <Stack.Screen name="Schedule" component={FullWebScreen(MyScheduleScreen)} />
            <Stack.Screen name="Payments" component={FullWebScreen(MyPaymentsScreen)} />
            <Stack.Screen name="Settings" component={FullWebScreen(SettingsScreen)} />
        </Stack.Navigator>
    );
};

const RootNavigator = () => {
    const { userToken, userInfo, isLoading } = useContext(AuthContext);
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { width } = useWindowDimensions();

    const isDesktop = Platform.OS === 'web' && width >= 1280;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            </View>
        );
    }

    const navigationTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: theme.background,
            card: theme.surface,
            text: theme.text,
            border: theme.border,
        },
    };

    return (
        <NavigationContainer theme={navigationTheme} linking={linking}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={theme.background}
            />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken === null ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : userInfo?.role === 'admin' ? (
                    <>
                        <Stack.Screen
                            name="AdminMain"
                            component={isDesktop ? AdminWebNavigator : AdminTabNavigator}
                        />
                        <Stack.Screen
                            name="StudentDetail"
                            component={isDesktop ? FullWebScreen(StudentDetailScreen) : StudentDetailScreen}
                        />
                        <Stack.Screen
                            name="TeacherDetail"
                            component={isDesktop ? FullWebScreen(TeacherDetailScreen) : TeacherDetailScreen}
                        />
                        <Stack.Screen
                            name="CourseDetail"
                            component={isDesktop ? FullWebScreen(CourseDetailScreen) : CourseDetailScreen}
                        />
                        <Stack.Screen
                            name="Attendance"
                            component={isDesktop ? FullWebScreen(AttendanceScreen) : AttendanceScreen}
                        />
                    </>
                ) : userInfo?.role === 'teacher' ? (
                    <>
                        <Stack.Screen
                            name="TeacherMain"
                            component={isDesktop ? AdminWebNavigator : AdminTabNavigator}
                        />
                        {!isDesktop && (
                            <>
                                <Stack.Screen name="Schedule" component={ScheduleScreen} />
                                <Stack.Screen name="Finance" component={FinanceScreen} />
                                <Stack.Screen name="TeacherSettings" component={SettingsScreen} />
                            </>
                        )}
                        <Stack.Screen
                            name="StudentDetail"
                            component={isDesktop ? FullWebScreen(StudentDetailScreen) : StudentDetailScreen}
                        />
                        <Stack.Screen
                            name="TeacherDetail"
                            component={isDesktop ? FullWebScreen(TeacherDetailScreen) : TeacherDetailScreen}
                        />
                        <Stack.Screen
                            name="CourseDetail"
                            component={isDesktop ? FullWebScreen(CourseDetailScreen) : CourseDetailScreen}
                        />
                        <Stack.Screen
                            name="Attendance"
                            component={isDesktop ? FullWebScreen(AttendanceScreen) : AttendanceScreen}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="StudentMain"
                            component={isDesktop ? StudentWebNavigator : StudentTabNavigator}
                        />
                        {!isDesktop && (
                            <Stack.Screen name="StudentSettings" component={SettingsScreen} />
                        )}
                        <Stack.Screen
                            name="CourseDetail"
                            component={isDesktop ? FullWebScreen(CourseDetailScreen) : CourseDetailScreen}
                        />
                    </>
                )}
            </Stack.Navigator>
            <Loader />
        </NavigationContainer>
    );
};


export default function App() {
    // Fix body overflow for web scrolling
    React.useEffect(() => {
        if (Platform.OS === 'web') {
            // Allow scrolling on web by overriding expo-reset
            document.body.style.overflow = 'visible';
        }
    }, []);

    return (
        <SafeAreaProvider>
            <UIProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <LanguageProvider>
                            <SchoolProvider>
                                <RootNavigator />
                            </SchoolProvider>
                        </LanguageProvider>
                    </ThemeProvider>
                </AuthProvider>
            </UIProvider>
        </SafeAreaProvider>
    );
}
