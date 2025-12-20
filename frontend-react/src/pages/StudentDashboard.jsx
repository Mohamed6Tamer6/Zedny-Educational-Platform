import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Play, TrendingUp, Clock, Trophy, ArrowRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const API_URL = '/api/v1';

export default function StudentDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [quizCode, setQuizCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [stats, setStats] = useState({
        quizzes_taken: 0,
        avg_score: 0,
        best_rank: 'None',
        performance_history: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchStudentStats();
        }
    }, [token]);

    const fetchStudentStats = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/quizzes/stats/student`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else if (res.status === 401) {
                // Silently wait for re-auth or handled by PrivateRoute
                console.warn("Unauthorized stats fetch");
            } else {
                showNotification('Could not load your latest statistics', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Server connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQuiz = async (e) => {
        e.preventDefault();
        if (!quizCode.trim()) {
            showNotification('Please enter a quiz code', 'warning');
            return;
        }
        setIsJoining(true);
        try {
            const res = await fetch(`${API_URL}/quizzes/by-code/${quizCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const quiz = await res.json();
                showNotification(`Joining ${quiz.title}...`, 'success');
                // Navigate to play page with the pre-validated code
                setTimeout(() => {
                    navigate(`/play?code=${quizCode}`);
                }, 1000);
            } else {
                showNotification('Invalid quiz code. Please check and try again.', 'error');
            }
        } catch (err) {
            showNotification('Connection error', 'error');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="student-dashboard">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Welcome back, <span className="highlight">{user?.full_name?.split(' ')[0] || 'Student'}</span>!</h1>
                        <p>Ready to test your knowledge today?</p>
                    </div>
                    <button
                        className="btn-refresh glassmorphism"
                        onClick={fetchStudentStats}
                        disabled={loading}
                    >
                        <Clock size={16} className={loading ? 'animate-spin' : ''} />
                        <span>{loading ? 'Refreshing...' : 'Refresh Stats'}</span>
                    </button>
                </header>

                <div className="dashboard-grid">
                    {/* Join Quiz Section */}
                    <div className="dashboard-card join-card glassmorphism">
                        <div className="card-header">
                            <div className="icon-wrapper blue">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <h3>Join a Quiz</h3>
                        </div>
                        <p className="card-desc">Enter the access code provided by your teacher to start a live session.</p>

                        <form className="join-form" onSubmit={handleJoinQuiz}>
                            <div className="code-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Enter Code (e.g. AB1234)"
                                    value={quizCode}
                                    onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                                <button type="submit" disabled={isJoining}>
                                    {isJoining ? '...' : <ArrowRight size={20} />}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Stats Summary */}
                    <div className="stats-row">
                        <div className="stat-pill glassmorphism">
                            <Clock size={16} />
                            <span><strong>{stats.quizzes_taken}</strong> Quizzes Taken</span>
                        </div>
                        <div className="stat-pill glassmorphism">
                            <TrendingUp size={16} />
                            <span><strong>{stats.avg_score}%</strong> Avg Score</span>
                        </div>
                        <div className="stat-pill glassmorphism">
                            <Trophy size={16} />
                            <span><strong>{stats.best_rank}</strong> Best Rank</span>
                        </div>
                    </div>

                    {/* Results Dashboard Section */}
                    <div className="dashboard-card results-card glassmorphism full-width">
                        <div className="card-header">
                            <div className="icon-wrapper purple">
                                <TrendingUp size={20} />
                            </div>
                            <h3>Performance History</h3>
                        </div>

                        <div className="results-content">
                            <div className="plot-container">
                                {/* Simple CSS-based Chart */}
                                <div className="chart-y-axis">
                                    <span>100%</span>
                                    <span>50%</span>
                                    <span>0%</span>
                                </div>
                                <div className="chart-bars">
                                    {stats.performance_history.length > 0 ? (
                                        stats.performance_history.slice(0, 5).reverse().map(res => (
                                            <div key={res.id} className="chart-bar-item">
                                                <div className="bar-wrapper">
                                                    <div
                                                        className="bar-fill"
                                                        style={{ height: `${(res.correct_answers / res.total_questions) * 100}%` }}
                                                    >
                                                        <span className="bar-tooltip">{Math.round((res.correct_answers / res.total_questions) * 100)}%</span>
                                                    </div>
                                                </div>
                                                <span className="bar-label">{res.quiz_title}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }}>No history yet</p>
                                    )}
                                </div>
                            </div>

                            <div className="recent-list">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <h4 style={{ margin: 0 }}>Recent Sessions</h4>
                                    <Link to="/my-performance" style={{ fontSize: '0.8rem', color: '#6366f1' }}>View All</Link>
                                </div>
                                {stats.performance_history.length > 0 ? (
                                    stats.performance_history.slice(0, 3).map(res => (
                                        <div key={res.id} className="result-item">
                                            <div className="result-info">
                                                <span className="res-title">{res.quiz_title}</span>
                                                <span className="res-date">{new Date(res.completed_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className={`res-score ${res.correct_answers / res.total_questions >= 0.8 ? 'high' : res.correct_answers / res.total_questions >= 0.6 ? 'mid' : 'low'}`}>
                                                {Math.round((res.correct_answers / res.total_questions) * 100)}%
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ opacity: 0.4, textAlign: 'center', padding: '20px 0' }}>No quizzes completed yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <style jsx>{`
                .student-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    animation: fadeIn 0.5s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dashboard-header h1 {
                    font-size: 2.2rem;
                    margin-bottom: 5px;
                }

                .highlight {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .dashboard-header p {
                    color: rgba(255, 255, 255, 0.5);
                }

                .btn-refresh {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .btn-refresh:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateY(-2px);
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .dashboard-card {
                    padding: 30px;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .full-width {
                    grid-column: span 2;
                }

                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .icon-wrapper {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-wrapper.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
                .icon-wrapper.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }

                .card-desc {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .join-form {
                    margin-top: 10px;
                }

                .code-input-wrapper {
                    display: flex;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px;
                    transition: 0.3s;
                }

                .code-input-wrapper:focus-within {
                    border-color: #6366f1;
                    background: rgba(255, 255, 255, 0.08);
                }

                .code-input-wrapper input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 10px 15px;
                    flex: 1;
                    font-size: 1.1rem;
                    font-weight: 600;
                    letter-spacing: 2px;
                    outline: none;
                }

                .code-input-wrapper button {
                    background: #6366f1;
                    color: #fff;
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                }

                .code-input-wrapper button:hover {
                    background: #4f46e5;
                    transform: scale(1.05);
                }

                .stats-row {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .stat-pill {
                    padding: 18px 25px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.95rem;
                }

                .stat-pill svg { color: #a855f7; }

                .results-content {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 40px;
                    margin-top: 10px;
                }

                .plot-container {
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 20px;
                    height: 250px;
                    display: flex;
                    gap: 20px;
                    align-items: flex-end;
                    position: relative;
                }

                .chart-y-axis {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100%;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 0.75rem;
                    padding-bottom: 30px;
                }

                .chart-bars {
                    flex: 1;
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 100%;
                    padding-bottom: 30px;
                }

                .chart-bar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 40px;
                    gap: 10px;
                }

                .bar-wrapper {
                    width: 12px;
                    height: 180px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    position: relative;
                    display: flex;
                    align-items: flex-end;
                }

                .bar-fill {
                    width: 100%;
                    background: linear-gradient(to top, #6366f1, #a855f7);
                    border-radius: 10px;
                    position: relative;
                    transition: height 1s cubic-bezier(0.17, 0.67, 0.83, 0.67);
                }

                .bar-tooltip {
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.7rem;
                    background: #fff;
                    color: #000;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 700;
                    opacity: 0;
                    transition: 0.2s;
                }

                .chart-bar-item:hover .bar-tooltip { opacity: 1; top: -30px; }

                .bar-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.4);
                    white-space: nowrap;
                    transform: rotate(-15deg);
                    margin-top: 8px;
                }

                .recent-list h4 {
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .result-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }

                .result-info {
                    display: flex;
                    flex-direction: column;
                }

                .res-title { font-size: 0.9rem; font-weight: 500; }
                .res-date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); }

                .res-score {
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                }

                .res-score.high { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .res-score.mid { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .res-score.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                @media (max-width: 900px) {
                    .dashboard-grid { grid-template-columns: 1fr; }
                    .full-width { grid-column: span 1; }
                    .results-content { grid-template-columns: 1fr; }
                }
            `}</style>
        </DashboardLayout>
    );
}
