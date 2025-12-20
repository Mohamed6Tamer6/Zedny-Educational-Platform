import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Trophy, Calendar, CheckCircle, XCircle, ArrowLeft, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const API_URL = '/api/v1';

export default function MyPerformance() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (token) {
            fetchPerformance();
        }
    }, [token]);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/quizzes/my-performance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPerformances(data);
            } else if (res.status === 401) {
                console.warn("Unauthorized performance fetch");
            } else {
                showNotification('Could not load your performance history', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Server connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="performance-page">
                <header className="performance-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1>My <span className="highlight">Performance</span></h1>
                    <p>Track your progress and review your quiz history.</p>
                </header>

                <div className="performance-list">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading your results...</p>
                        </div>
                    ) : performances.length > 0 ? (
                        performances.map((perf) => (
                            <div key={perf.id} className="performance-card glassmorphism">
                                <div className="card-main-info">
                                    <div className="quiz-icon">
                                        <Trophy size={24} color="#f59e0b" />
                                    </div>
                                    <div className="quiz-details">
                                        <h3>{perf.quiz_title}</h3>
                                        <div className="quiz-meta">
                                            <span><Calendar size={14} /> {new Date(perf.completed_at).toLocaleDateString()}</span>
                                            <span><CheckCircle size={14} className="text-green" /> {perf.correct_answers} Correct</span>
                                            <span><XCircle size={14} className="text-red" /> {perf.total_questions - perf.correct_answers} Wrong</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-stats">
                                    <div className="stat-box">
                                        <span className="stat-val">{Math.round((perf.correct_answers / perf.total_questions) * 100)}%</span>
                                        <span className="stat-lbl">Score</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-val rank">{perf.rank || 'N/A'}</span>
                                        <span className="stat-lbl">Rank</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state glassmorphism">
                            <BarChart2 size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <h3>No Quizzes Taken Yet</h3>
                            <p>Once you complete a quiz, your detailed performance will appear here.</p>
                            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 20 }}>
                                Join a Quiz Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .performance-page {
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .performance-header {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .back-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0;
                    cursor: pointer;
                    font-size: 0.9rem;
                    margin-bottom: 10px;
                    width: fit-content;
                }

                .back-btn:hover {
                    color: #fff;
                }

                .performance-header h1 {
                    font-size: 2.5rem;
                    margin: 0;
                }

                .highlight {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .performance-header p {
                    color: rgba(255, 255, 255, 0.5);
                }

                .performance-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .performance-card {
                    padding: 24px 30px;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: 0.3s;
                }

                .performance-card:hover {
                    transform: translateX(5px);
                    border-color: rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.05);
                }

                .card-main-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .quiz-icon {
                    width: 54px;
                    height: 54px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .quiz-details h3 {
                    margin: 0 0 8px 0;
                    font-size: 1.2rem;
                }

                .quiz-meta {
                    display: flex;
                    gap: 20px;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .quiz-meta span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .text-green { color: #22c55e; }
                .text-red { color: #ef4444; }

                .card-stats {
                    display: flex;
                    gap: 40px;
                    text-align: right;
                }

                .stat-box {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-val {
                    font-size: 1.3rem;
                    font-weight: 700;
                }

                .stat-val.rank {
                    color: #a855f7;
                }

                .stat-lbl {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .loading-state, .empty-state {
                    padding: 60px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border-radius: 20px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .performance-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 20px;
                    }
                    .card-stats {
                        width: 100%;
                        justify-content: space-between;
                        text-align: left;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}
