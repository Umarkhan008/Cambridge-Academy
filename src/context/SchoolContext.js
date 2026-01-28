import React, { createContext, useState, useEffect } from 'react';
import { mockData } from '../data/mockData';
import { db } from '../config/firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
    where,
    writeBatch,
    setDoc
} from 'firebase/firestore';
import { SETTINGS } from '../config/settings';

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [finance, setFinance] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [leads, setLeads] = useState([]);
    const [subjects, setSubjects] = useState([]); // Course Templates
    const [attendance, setAttendance] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [appSettings, setAppSettings] = useState({
        googleSheetsUrl: SETTINGS.GOOGLE_SHEETS_URL,
        enableGoogleSheets: SETTINGS.ENABLE_GOOGLE_SHEETS,
        attendanceFormat: 'default' // Add format setting as requested
    });

    // Helper to unsubscribe from listeners on unmount
    useEffect(() => {
        const qStudents = query(collection(db, 'students'), orderBy('name'));
        const unsubStudents = onSnapshot(qStudents, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qTeachers = query(collection(db, 'teachers'), orderBy('name'));
        const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
            setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qCourses = query(collection(db, 'courses'), orderBy('title'));
        const unsubCourses = onSnapshot(qCourses, (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qFinance = query(collection(db, 'finance'), orderBy('date', 'desc'));
        const unsubFinance = onSnapshot(qFinance, (snapshot) => {
            setFinance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qSchedule = query(collection(db, 'schedule'), orderBy('startTime'));
        const unsubSchedule = onSnapshot(qSchedule, (snapshot) => {
            setSchedule(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qActivities = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
        const unsubActivities = onSnapshot(qActivities, (snapshot) => {
            setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const unsubLeads = onSnapshot(qLeads, (snapshot) => {
            setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qSubjects = query(collection(db, 'subjects'), orderBy('title'));
        const unsubSubjects = onSnapshot(qSubjects, (snapshot) => {
            setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qAttendance = query(collection(db, 'attendance'), orderBy('date', 'desc'));
        const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
            setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubSettings = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
            if (docSnap.exists()) {
                setAppSettings(docSnap.data());
            }
        });

        return () => {
            unsubStudents();
            unsubTeachers();
            unsubCourses();
            unsubFinance();
            unsubSchedule();
            unsubActivities();
            unsubLeads();
            unsubSubjects();
            unsubAttendance();
            unsubSettings();
        };
    }, []);

    // --- Activities ---
    const addActivity = async (action, target) => {
        try {
            await addDoc(collection(db, 'activities'), {
                name: 'Admin', // In a real app, use auth user
                action: 'Action',
                target: action,
                time: new Date().toLocaleTimeString(), // Simple time string for now
                createdAt: serverTimestamp(),
                icon: 'notifications-outline'
            });
        } catch (e) {
            console.error("Error adding activity: ", e);
        }
    };

    // --- Students CRUD ---
    const addStudent = async (student) => {
        try {
            await addDoc(collection(db, 'students'), student);
            addActivity(`Added new student: ${student.name}`, 'System');
        } catch (e) {
            console.error("Error adding student: ", e);
        }
    };

    const updateStudent = async (id, updatedData) => {
        try {
            const studentRef = doc(db, 'students', id);
            await updateDoc(studentRef, updatedData);
        } catch (e) {
            console.error("Error updating student: ", e);
        }
    };

    const deleteStudent = async (id) => {
        try {
            await deleteDoc(doc(db, 'students', id));
        } catch (e) {
            console.error("Error deleting student: ", e);
        }
    };

    // --- Teachers CRUD ---
    const addTeacher = async (teacher) => {
        try {
            await addDoc(collection(db, 'teachers'), teacher);
            addActivity(`Added new teacher: ${teacher.name}`, 'System');
        } catch (e) {
            console.error("Error adding teacher: ", e);
        }
    };

    const deleteTeacher = async (id) => {
        try {
            await deleteDoc(doc(db, 'teachers', id));
        } catch (e) {
            console.error("Error deleting teacher: ", e);
        }
    };

    const updateTeacher = async (id, updatedData) => {
        try {
            const teacherRef = doc(db, 'teachers', id);
            await updateDoc(teacherRef, updatedData);
            addActivity(`Updated teacher: ${updatedData.name}`, 'System');
        } catch (e) {
            console.error("Error updating teacher: ", e);
        }
    };

    // --- Courses CRUD ---
    const addCourse = async (course) => {
        try {
            await addDoc(collection(db, 'courses'), course);
            addActivity(`Created new course: ${course.title}`, 'System');
        } catch (e) {
            console.error("Error adding course: ", e);
        }
    };

    const updateCourse = async (id, updatedData) => {
        try {
            const courseRef = doc(db, 'courses', id);
            await updateDoc(courseRef, updatedData);

            // If title changed, update all students
            if (updatedData.title) {
                const q = query(collection(db, 'students'), where('assignedCourseId', '==', id));
                const querySnapshot = await getDocs(q);

                const batch = writeBatch(db);
                querySnapshot.forEach((docSnap) => {
                    batch.update(doc(db, 'students', docSnap.id), {
                        course: updatedData.title
                    });
                });
                if (!querySnapshot.empty) {
                    await batch.commit();
                }
            }

            addActivity(`Updated course: ${updatedData.title}`, 'System');
        } catch (e) {
            console.error("Error updating course: ", e);
        }
    };

    const deleteCourse = async (id) => {
        try {
            // 1. Find all students enrolled in this course
            const q = query(collection(db, 'students'), where('assignedCourseId', '==', id));
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(db);

            // 2. Remove course assignment from these students
            querySnapshot.forEach((docSnap) => {
                const studentRef = doc(db, 'students', docSnap.id);
                batch.update(studentRef, {
                    assignedCourseId: null,
                    course: 'Not Assigned',
                    status: 'Pending'
                });
            });

            // 3. Delete the course itself
            const courseRef = doc(db, 'courses', id);
            batch.delete(courseRef);

            // 4. Commit all changes atomically
            await batch.commit();

            addActivity(`Deleted course and unassigned ${querySnapshot.size} students`, 'System');

        } catch (e) {
            console.error("Error deleting course: ", e);
            Alert.alert("Error", "Failed to delete course and update students.");
        }
    };

    // --- Schedule CRUD ---
    const addClass = async (classItem) => {
        try {
            await addDoc(collection(db, 'schedule'), classItem);
            addActivity(`Added class: ${classItem.title}`, 'System');
        } catch (e) {
            console.error("Error adding class: ", e);
        }
    };

    const deleteClass = async (id) => {
        try {
            await deleteDoc(doc(db, 'schedule', id));
        } catch (e) {
            console.error("Error deleting class: ", e);
        }
    };

    // --- Finance ---
    const addTransaction = async (transaction) => {
        try {
            await addDoc(collection(db, 'finance'), {
                ...transaction,
                date: new Date().toLocaleDateString()
            });
            addActivity(`Added transaction: ${transaction.title}`, 'System');
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'finance', id));
        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    };

    // --- Leads CRUD ---
    const addLead = async (lead) => {
        try {
            await addDoc(collection(db, 'leads'), {
                ...lead,
                createdAt: serverTimestamp(),
                status: 'New' // New, Contacted, Enrolled, Lost
            });
            addActivity(`Added new lead: ${lead.name}`, 'System');
        } catch (e) {
            console.error("Error adding lead: ", e);
        }
    };

    const updateLead = async (id, updatedData) => {
        try {
            const leadRef = doc(db, 'leads', id);
            await updateDoc(leadRef, updatedData);
            // If status changed to enrolled, maybe auto-add to students? (Can be done in UI)
        } catch (e) {
            console.error("Error updating lead: ", e);
        }
    };

    const deleteLead = async (id) => {
        try {
            await deleteDoc(doc(db, 'leads', id));
        } catch (e) {
            console.error("Error deleting lead: ", e);
        }
    };

    // --- Subjects (Templates) CRUD ---
    const addSubject = async (subject) => {
        try {
            await addDoc(collection(db, 'subjects'), subject);
            addActivity(`Created course template: ${subject.title}`, 'System');
        } catch (e) {
            console.error("Error adding subject: ", e);
        }
    };

    const updateSubject = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'subjects', id), updatedData);
        } catch (e) {
            console.error("Error updating subject: ", e);
        }
    };

    const deleteSubject = async (id) => {
        try {
            await deleteDoc(doc(db, 'subjects', id));
        } catch (e) {
            console.error("Error deleting subject: ", e);
        }
    };

    const updateAppSettings = async (newSettings) => {
        try {
            const settingsRef = doc(db, 'settings', 'app');
            await setDoc(settingsRef, newSettings, { merge: true });
            addActivity('Updated Google Sheets settings', 'System');
        } catch (e) {
            console.error("Error updating settings: ", e);
        }
    };

    const syncWithGoogleSheets = async (attendanceData) => {
        if (!appSettings.enableGoogleSheets || !appSettings.googleSheetsUrl) return;

        try {
            console.log("Preparing sync with Google Sheets...");

            // Get student names carefully
            const studentsWithNames = Object.entries(attendanceData.students || {}).map(([id, data]) => {
                const student = students.find(s => String(s.id) === String(id));
                return {
                    id: id, // Include stable ID
                    name: student ? student.name : (data.name || 'Unknown Student'),
                    status: data.status,
                    reason: data.reason || '',
                    note: data.note || '',
                    homework: data.homework || '0'
                };
            });

            const formattedData = {
                courseName: attendanceData.courseName,
                courseTime: attendanceData.courseTime || '',
                courseDays: attendanceData.courseDays || '',
                date: attendanceData.date,
                timestamp: new Date().toISOString(),
                format: appSettings.attendanceFormat || 'default',
                attendance: appSettings.attendanceFormat === 'simple'
                    ? {
                        present: studentsWithNames.filter(s => s.status === 'present').length,
                        absent: studentsWithNames.filter(s => s.status === 'absent').length,
                        total: studentsWithNames.length
                    }
                    : studentsWithNames
            };

            console.log("Syncing Data:", JSON.stringify(formattedData));

            const response = await fetch(appSettings.googleSheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(formattedData)
            });

            console.log("Google Sheets sync triggered. Response type:", response.type);
        } catch (error) {
            console.error("Google Sheets Sync Error:", error);
        }
    };

    // --- Automatic Financial Deduction Engine ---
    const processDailyDeductions = async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const dayOfWeek = now.getDay();

        // Helper to check if course is scheduled for today (simplified for context)
        const isToday = (course) => {
            if (!course || !course.days) return false;
            const courseDaysStr = (course.days || '').toString().toUpperCase();
            if (courseDaysStr.includes('DCHJ') && [1, 3, 5].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('SPSH') && [2, 4, 6].includes(dayOfWeek)) return true;
            if (courseDaysStr.includes('HAR KUNI')) return true;
            return false;
        };

        try {
            for (const course of courses) {
                // 1. Check if course is scheduled for today and has a time
                if (isToday(course) && course.time) {
                    const timeStr = course.time.replace(/\s/g, '');
                    const startMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);

                    if (startMatch) {
                        const startH = parseInt(startMatch[1]);
                        const startM = parseInt(startMatch[2]);
                        const startFloat = startH + startM / 60;

                        // 2. If current time is past start time, try to deduct
                        if (currentHour >= startFloat) {
                            const deductionId = `${course.id}_${todayStr}`;

                            // 3. Check if deduction already processed for this course today
                            const deductionRef = doc(db, 'dailyDeductions', deductionId);
                            const deductionSnap = await getDocs(query(collection(db, 'dailyDeductions'), where('__name__', '==', deductionId)));

                            if (deductionSnap.empty) {
                                console.log(`Processing auto-deduction for: ${course.title}`);
                                const batch = writeBatch(db);

                                const monthlyPrice = typeof course.price === 'string'
                                    ? parseFloat(course.price.replace(/[^\d]/g, ''))
                                    : course.price;
                                const dailyFee = Math.round(monthlyPrice / 12);

                                if (!isNaN(dailyFee) && dailyFee > 0) {
                                    const courseStudents = students.filter(s => s.assignedCourseId === course.id);

                                    courseStudents.forEach(student => {
                                        // Update balance
                                        const newBalance = (student.balance || 0) - dailyFee;
                                        batch.update(doc(db, 'students', student.id), { balance: newBalance });

                                        // Finance record
                                        const financeRef = doc(collection(db, 'finance'));
                                        batch.set(financeRef, {
                                            title: `${course.title} - Avtomatik dars to'lovi`,
                                            amount: `-${dailyFee}`,
                                            type: 'Expense',
                                            category: 'Avtomatik yechim',
                                            date: new Date().toLocaleDateString(),
                                            studentId: student.id,
                                            studentName: student.name,
                                            courseId: course.id,
                                            createdAt: serverTimestamp()
                                        });
                                    });

                                    // Mark as processed
                                    batch.set(deductionRef, {
                                        courseId: course.id,
                                        date: todayStr,
                                        processedAt: serverTimestamp()
                                    });

                                    await batch.commit();
                                    addActivity(`Avtomatik yechim: ${course.title} guruhidan barcha o'quvchilardan yechildi`, 'System');
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Auto-deduction error:", e);
        }
    };

    // --- Attendance CRUD ---
    const saveAttendance = async (attendanceData) => {
        try {
            // Simply save attendance, financial deduction is now automated based on time
            await addDoc(collection(db, 'attendance'), {
                ...attendanceData,
                createdAt: serverTimestamp()
            });

            addActivity(`Davomat olindi: ${attendanceData.courseName} (${attendanceData.date})`, 'System');
            syncWithGoogleSheets(attendanceData);
            return true;
        } catch (e) {
            console.error("Error saving attendance: ", e);
            return false;
        }
    };

    const updateAttendance = async (id, updatedData) => {
        try {
            await updateDoc(doc(db, 'attendance', id), updatedData);
            console.log("Attendance updated in Firestore successfully");

            // Sync with Google Sheets on update as well
            syncWithGoogleSheets(updatedData);
            return true;
        } catch (e) {
            console.error("Error updating attendance: ", e);
            return false;
        }
    };

    // --- Dashboard Stats Computation ---
    const getDashboardStats = () => {
        // Safe access to mockData.stats to avoid crashes if it's structured differently
        const colors = mockData.stats || [{ color: '#000' }, { color: '#000' }, { color: '#000' }, { color: '#000' }];

        // Calculate total revenue from finance state
        const totalRev = finance.reduce((acc, item) => {
            const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(amount) ? 0 : amount);
        }, 0);

        return [
            {
                id: 1,
                title: 'Total Students',
                value: students.length.toString(),
                icon: 'people',
                color: colors[0]?.color,
                trend: 'up',
                trendValue: '+0%', // Dynamic calculation would ideally go here
            },
            {
                id: 2,
                title: 'Total Teachers',
                value: teachers.length.toString(),
                icon: 'school',
                color: colors[1]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
            {
                id: 3,
                title: 'Active Courses',
                value: courses.length.toString(),
                icon: 'book',
                color: colors[2]?.color,
                trend: 'down',
                trendValue: '0%',
            },
            {
                id: 4,
                title: 'Revenue',
                value: `$${totalRev.toLocaleString()}`,
                icon: 'wallet',
                color: colors[3]?.color,
                trend: 'up',
                trendValue: '+0%',
            },
        ];
    };

    const getTotalRevenue = () => {
        const total = finance.reduce((acc, item) => {
            const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(amount) ? 0 : amount);
        }, 0);
        return `$${total.toLocaleString()}`;
    };

    return (
        <SchoolContext.Provider value={{
            students, addStudent, updateStudent, deleteStudent,
            teachers, addTeacher, updateTeacher, deleteTeacher,
            courses, addCourse, updateCourse, deleteCourse,
            finance, addTransaction, deleteTransaction,
            schedule, setSchedule, addClass, deleteClass,
            leads, addLead, updateLead, deleteLead,
            subjects, addSubject, updateSubject, deleteSubject,
            attendance, saveAttendance, updateAttendance,
            recentActivities,
            appSettings, updateAppSettings,
            processDailyDeductions,
            getDashboardStats,
            getTotalRevenue,
            revenueData: mockData.revenueData // Static for now
        }}>
            {children}
        </SchoolContext.Provider>
    );
};
