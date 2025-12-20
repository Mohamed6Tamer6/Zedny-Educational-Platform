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
 * - /dashboard: Main dashboard for authenticated users
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
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Quizzes from './pages/Quizzes';
import CreateQuiz from './pages/CreateQuiz';
import Room from './pages/Room';
import HostGame from './pages/HostGame';
import PlayerGame from './pages/PlayerGame';

// Protected Route wrapper could be added here, 
// but for simplicity we handle redirection inside pages or rely on AuthContext state.

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/quizzes" element={<Quizzes />} />
                        <Route path="/create-quiz" element={<CreateQuiz />} />

                        {/* Room (Lobby) */}
                        <Route path="/quiz/:id" element={<Room />} />

                        {/* Host Game View */}
                        <Route path="/game/host/:quizId" element={<HostGame />} />

                        {/* Player Join & Play */}
                        <Route path="/play" element={<PlayerGame />} />

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

