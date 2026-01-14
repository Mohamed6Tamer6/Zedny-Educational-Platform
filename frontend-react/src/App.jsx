/**
 * =============================================================================
 * Main Application Component
 * =============================================================================
 * This is the root component of the Zedny Educational Platform frontend.
 * It sets up routing and provides global context providers.
 * 
 * Structure:
 * - BrowserRouter: Enables client-side routing
 * - AuthProvider: Manages user authentication state
 * - NotificationProvider: Handles toast notifications
 * - Routes: Defines all application routes
 * 
 * Routes:
 * - /login: User login page
 * - /signup: New user registration
 * - /dashboard: Main dashboard (redirects based on role)
 * - /quizzes: List of user's quizzes
 * - /create-quiz: Quiz creation interface
 * - /quiz/:id: Quiz lobby/room
 * - /game/host/:quizId: Host game view (for teachers)
 * - /play: Player game view (for students)
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Quizzes from './pages/Quizzes';
import CreateQuiz from './pages/CreateQuiz';
import Room from './pages/Room';
import HostGame from './pages/HostGame';
import PlayerGame from './pages/PlayerGame';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MyPerformance from './pages/MyPerformance';
import QuizResults from './pages/QuizResults';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import LessonViewer from './pages/LessonViewer';
import CourseBuilder from './pages/CourseBuilder';
import TeacherCourses from './pages/TeacherCourses';
import TeacherAIAssistant from './pages/TeacherAIAssistant';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

function RoleRedirect() {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (user?.role === 'TEACHER') return <Navigate to="/teacher-dashboard" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student-dashboard" replace />;
    if (user?.role === 'SUPER_ADMIN') return <Navigate to="/admin-dashboard" replace />;

    return <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />

                        {/* Role-Based Dashboards */}
                        <Route element={<PrivateRoute allowedRoles={['TEACHER', 'SUPER_ADMIN']} />}>
                            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                            <Route path="/create-quiz" element={<CreateQuiz />} />
                            <Route path="/edit-quiz/:id" element={<CreateQuiz />} />
                            <Route path="/quizzes" element={<Quizzes />} />
                            <Route path="/game/host/:quizId" element={<HostGame />} />
                            <Route path="/quiz/:id/results" element={<QuizResults />} />
                        </Route>

                        <Route element={<PrivateRoute allowedRoles={['STUDENT', 'TEACHER', 'SUPER_ADMIN']} />}>
                            <Route path="/student-dashboard" element={<StudentDashboard />} />
                            <Route path="/play" element={<PlayerGame />} />
                            <Route path="/my-performance" element={<MyPerformance />} />
                        </Route>

                        <Route element={<PrivateRoute allowedRoles={['SUPER_ADMIN']} />}>
                            <Route path="/admin-dashboard" element={<SuperAdminDashboard />} />
                        </Route>

                        {/* Shared/Common Routes */}
                        <Route element={<PrivateRoute allowedRoles={['TEACHER', 'STUDENT', 'SUPER_ADMIN']} />}>
                            <Route path="/quiz/:id" element={<Room />} />
                            {/* Legacy Dashboard route, now acts as redirector */}
                            <Route path="/dashboard" element={<RoleRedirect />} />
                            {/* LMS Routes */}
                            <Route path="/courses" element={<CourseCatalog />} />
                            <Route path="/courses/:id" element={<CourseDetail />} />
                            <Route path="/courses/:id/lessons/:lessonId" element={<LessonViewer />} />
                            <Route path="/profile" element={<Profile />} />
                        </Route>

                        {/* LMS Teacher Routes */}
                        <Route element={<PrivateRoute allowedRoles={['TEACHER', 'SUPER_ADMIN']} />}>
                            <Route path="/create-course" element={<CourseBuilder />} />
                            <Route path="/edit-course/:id" element={<CourseBuilder />} />
                            <Route path="/teacher-courses" element={<TeacherCourses />} />
                            <Route path="/teacher/ai-assistant" element={<TeacherAIAssistant />} />
                        </Route>

                        {/* Root Redirect */}
                        <Route path="/" element={<PrivateRoute />}>
                            <Route path="" element={<RoleRedirect />} />
                        </Route>

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
