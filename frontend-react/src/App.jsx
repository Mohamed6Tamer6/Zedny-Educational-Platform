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

