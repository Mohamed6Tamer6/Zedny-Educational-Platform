import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Trophy, Calendar, CheckCircle, XCircle, ArrowLeft, BarChart2, Award, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const API_Base_URL = '/api/v1';

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
            const res = await fetch(`${API_Base_URL}/quizzes/my-performance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPerformances(data);
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

    const calculateOverallScore = () => {
        if (performances.length === 0) return 0;
        const total = performances.reduce((acc, curr) => acc + (curr.correct_answers / curr.total_questions), 0);
        return Math.round((total / performances.length) * 100);
    };

    return (
        <DashboardLayout>
            <div className="perf-container-premium">
                <header className="perf-hero-premium">
                    <button className="btn-back-glow" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={18} />
                        <span>Return to Dashboard</span>
                    </button>
                    <h1>My <span className="gradient-text-blue">Achievements</span></h1>
                    <p>Quantitative analysis of your academic progression and quiz performance.</p>
                </header>

                {/* Performance Summary Grid */}
                {!loading && performances.length > 0 && (
                    <div className="perf-stats-row">
                        <div className="perf-stat-card glassmorphism-blue">
                            <div className="p-icon blue"><Award size={24} /></div>
                            <div className="p-data">
                                <span className="p-val">{calculateOverallScore()}%</span>
                                <span className="p-lbl">Cumulative Accuracy</span>
                            </div>
                        </div>
                        <div className="perf-stat-card glassmorphism-blue">
                            <div className="p-icon purple"><Zap size={24} /></div>
                            <div className="p-data">
                                <span className="p-val">{performances.length}</span>
                                <span className="p-lbl">Quizzes Conquered</span>
                            </div>
                        </div>
                        <div className="perf-stat-card glassmorphism-blue">
                            <div className="p-icon gold"><Target size={24} /></div>
                            <div className="p-data">
                                <span className="p-val">{performances.filter(p => (p.correct_answers / p.total_questions) >= 0.8).length}</span>
                                <span className="p-lbl">Elite Performances</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="results-explorer-premium">
                    <div className="explorer-header-r">
                        <h2>Performance History</h2>
                        <div className="filter-badge">{performances.length} sessions recorded</div>
                    </div>

                    <div className="results-list-premium">
                        {loading ? (
                            <div className="perf-loading-grid">
                                {[1, 2, 3].map(n => <div key={n} className="perf-skeleton glassmorphism-blue"></div>)}
                            </div>
                        ) : performances.length > 0 ? (
                            performances.map((perf) => {
                                const score = Math.round((perf.correct_answers / perf.total_questions) * 100);
                                return (
                                    <div key={perf.id} className="perf-item-row glassmorphism-blue">
                                        <div className="perf-main-r">
                                            <div className={`score-ring-r ${score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low'}`}>
                                                {score}%
                                            </div>
                                            <div className="perf-details-r">
                                                <h3>{perf.quiz_title}</h3>
                                                <div className="perf-meta-r">
                                                    <span><Calendar size={14} /> {new Date(perf.completed_at).toLocaleDateString()}</span>
                                                    <span className="success-t"><CheckCircle size={14} /> {perf.correct_answers} Correct</span>
                                                    <span className="fail-t"><XCircle size={14} /> {perf.total_questions - perf.correct_answers} Missed</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="perf-side-r">
                                            <div className="side-stat-r">
                                                <span className="s-val-r">#{perf.rank || 'N/A'}</span>
                                                <span className="s-lbl-r">Global Rank</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-perf-state glassmorphism-blue">
                                <BarChart2 size={64} className="opacity-10" />
                                <h3>No Academic Data Found</h3>
                                <p>Initiate your first quiz to generate performance analytics.</p>
                                <button className="btn-begin-glow" onClick={() => navigate('/dashboard')}>Discover Quizzes</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .perf-container-premium { display: flex; flex-direction: column; gap: 40px; animation: slideUp 0.8s ease; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .perf-hero-premium { display: flex; flex-direction: column; gap: 15px; }
                .btn-back-glow { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 14px; width: fit-content; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; font-weight: 600; }
                .btn-back-glow:hover { background: #fff; color: #000; box-shadow: 0 0 20px rgba(255,255,255,0.2); }

                .perf-hero-premium h1 { font-size: 3rem; font-weight: 900; margin: 0; letter-spacing: -1.5px; }
                .gradient-text-blue { background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .perf-hero-premium p { color: rgba(255,255,255,0.4); font-size: 1.1rem; max-width: 600px; }

                .perf-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .perf-stat-card { padding: 30px; border-radius: 24px; display: flex; align-items: center; gap: 24px; }
                .p-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .p-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .p-icon.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .p-icon.gold { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .p-val { font-size: 1.8rem; font-weight: 900; display: block; }
                .p-lbl { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }

                .explorer-header-r { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .filter-badge { background: rgba(255,255,255,0.05); padding: 6px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.5); }

                .results-list-premium { display: flex; flex-direction: column; gap: 16px; }
                .perf-item-row { padding: 24px 32px; border-radius: 24px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
                .perf-item-row:hover { background: rgba(255,255,255,0.05); transform: translateX(10px); }

                .perf-main-r { display: flex; align-items: center; gap: 25px; }
                .score-ring-r { width: 64px; height: 64px; border-radius: 50%; border: 4px solid; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }
                .score-ring-r.high { border-color: #22c55e; color: #22c55e; }
                .score-ring-r.mid { border-color: #f59e0b; color: #f59e0b; }
                .score-ring-r.low { border-color: #ef4444; color: #ef4444; }

                .perf-details-r h3 { font-size: 1.25rem; margin-bottom: 8px; }
                .perf-meta-r { display: flex; gap: 20px; font-size: 0.85rem; color: rgba(255,255,255,0.4); }
                .perf-meta-r span { display: flex; align-items: center; gap: 6px; }
                .success-t { color: #22c55e; }
                .fail-t { color: #f87171; }

                .side-stat-r { text-align: right; }
                .s-val-r { font-size: 1.5rem; font-weight: 900; color: #a855f7; display: block; }
                .s-lbl-r { font-size: 0.75rem; color: rgba(255,255,255,0.3); text-transform: uppercase; font-weight: 700; }

                .empty-perf-state { padding: 80px; text-align: center; border-radius: 32px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .btn-begin-glow { background: #6366f1; color: #fff; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); }
                .btn-begin-glow:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3); }

                .glassmorphism-blue { background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
                .perf-skeleton { height: 100px; border-radius: 24px; animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
            `}</style>
        </DashboardLayout>
    );
}
