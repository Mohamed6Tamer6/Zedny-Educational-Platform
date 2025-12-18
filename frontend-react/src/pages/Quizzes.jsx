import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Dashboard.css'; // Reusing navbar styles
import '../styles/Quizzes.css';

const API_URL = '/api/v1';

export default function Quizzes() {
    const { user, logout, token } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, [token]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_URL}/quizzes/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setQuizzes(data);
        } catch (err) {
            console.error(err);
            setError('Error loading quizzes');
            showNotification('Error loading quizzes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteQuiz = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/quizzes/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                showNotification('Quiz deleted successfully', 'success');
                setQuizzes(prev => prev.filter(q => q.id !== id));
            } else {
                const err = await res.json();
                showNotification(err.detail || 'Failed to delete quiz', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Error connecting to server', 'error');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="quizzes-page">
            {/* Navbar (Reused from Dashboard but could be a component) */}
            <nav className="navbar">
                <Link to="/dashboard" className="logo">Zedny<span className="dot">.</span></Link>
                <div className="nav-links" style={{ display: 'flex', gap: 24, marginLeft: 40 }}>
                    <Link to="/dashboard" className="nav-link" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Dashboard</Link>
                    <Link to="/quizzes" className="nav-link active" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>My Quizzes</Link>
                </div>
                <div className="nav-right" style={{ marginLeft: 'auto' }}>
                    <span className="user-name">{user?.full_name || user?.email || 'User'}</span>
                    <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <main className="quizzes-main">
                <div className="page-header">
                    <h1 className="page-title">My Quizzes</h1>
                    <Link to="/create-quiz" className="btn-create">
                        <i className="fas fa-plus"></i> Create New Quiz
                    </Link>
                </div>

                <div className="quiz-grid">
                    {loading && (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: 10 }}></i>
                            <p>Loading quizzes...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="error-state">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button className="btn-retry" onClick={fetchQuizzes}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && quizzes.length === 0 && (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <h3>No quizzes yet</h3>
                            <p>Create your first quiz to get started!</p>
                        </div>
                    )}

                    {!loading && !error && quizzes.map(q => (
                        <div key={q.id} className="quiz-card" onClick={() => navigate(`/quiz/${q.id}`)}>
                            <button className="btn-delete-quiz" onClick={(e) => deleteQuiz(q.id, e)} title="Delete Quiz">
                                <i className="fas fa-times"></i>
                            </button>
                            <div className="quiz-card-img"></div>
                            <div className="quiz-card-content">
                                <h3 className="quiz-card-title">{q.title || 'Untitled Quiz'}</h3>
                                <div className="quiz-card-meta">
                                    <span className="questions">
                                        <i className="fas fa-circle" style={{ fontSize: 6 }}></i>
                                        {q.questions ? q.questions.length : 0} Questions
                                    </span>
                                    <span className="code">
                                        <i className="fas fa-key"></i>
                                        {q.access_code || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
