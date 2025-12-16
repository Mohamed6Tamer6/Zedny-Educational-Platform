import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Room.css';

const API_URL = '/api/v1';

export default function Room() {
    const { id } = useParams(); // Quiz ID
    const [code, setCode] = useState(null); // Room Code (from URL or fetch)
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [quizData, setQuizData] = useState(null);

    useEffect(() => {
        // Ideally we fetch the quiz details to get the access code if not provided
        // But typically the room code is part of the quiz object
        async function fetchQuiz() {
            try {
                const res = await fetch(`${API_URL}/quizzes/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizData(data);
                    setCode(data.access_code);
                } else {
                    showNotification('Quiz not found', 'error');
                    navigate('/quizzes');
                }
            } catch (err) {
                console.error(err);
                showNotification('Error loading quiz', 'error');
            }
        }
        fetchQuiz();
    }, [id, token]);

    const copyToClipboard = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        showNotification('Code copied to clipboard!', 'success');
    };

    const handleStartGame = () => {
        // Navigate to the actual game play screen (Host view for now, or solo play)
        navigate(`/game/host/${id}`); // Assuming we have a host route
    };

    if (!quizData) return <div style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>Loading...</div>;

    return (
        <div className="room-page">
            <div className="bg-glow"></div>

            <div className="room-container">
                <div className="success-badge">
                    <i className="fas fa-check"></i>
                </div>

                <h1 className="room-title">Quiz Ready!</h1>
                <p className="room-subtitle">Share this code with participants to join</p>

                <div className="code-card">
                    <div className="code-label">Room Code</div>
                    <div className="code-value">{code || '------'}</div>
                    <button className="btn-copy" onClick={copyToClipboard}>
                        <i className="fas fa-copy"></i> Copy Code
                    </button>
                </div>

                <div className="room-actions">
                    <button className="btn-start" onClick={handleStartGame}>
                        <i className="fas fa-play"></i> Start Game (Host)
                    </button>
                    <Link to="/quizzes" className="btn-back">
                        <i className="fas fa-arrow-left"></i> Back to Quizzes
                    </Link>
                </div>

                <div className="info-row">
                    <div className="info-card">
                        <i className="fas fa-users"></i>
                        <span>Players: <strong>0</strong> (Waiting)</span>
                    </div>
                    <div className="info-card">
                        <i className="fas fa-question-circle"></i>
                        <span>Questions: <strong>{quizData.questions ? quizData.questions.length : 0}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
