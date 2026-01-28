import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

const linking = {
    prefixes: [prefix],
    config: {
        screens: {
            Login: 'login',
            ForgotPassword: 'forgot-password',

            // Admin Stack (When user matches AdminMain cond)
            AdminMain: {
                screens: {
                    Dashboard: 'dashboard',
                    Students: 'students',
                    Teachers: 'teachers',
                    Courses: 'courses', // Groups
                    Leads: 'leads',
                    Schedule: 'schedule',
                    Finance: 'finance',
                    Settings: 'settings',
                },
            },

            // Detail Screens (Params handle IDs automatically if passed)
            StudentDetail: 'students/:id',
            TeacherDetail: 'teachers/:id',
            CourseDetail: 'courses/:id',

            // Student Stack (When user matches StudentMain cond)
            StudentMain: {
                screens: {
                    Home: 'home',
                    Classes: 'my-classes',
                    Schedule: 'my-schedule',
                    Payments: 'my-payments',
                    Settings: 'my-settings'
                }
            },

            // Standalone for mobile/global
            Schedule: 'full-schedule',
            Finance: 'full-finance',
            Settings: 'full-settings', // Resolves overlap? Stacks check order.
        },
    },
};

export default linking;
