import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Play, TrendingUp, Clock, Trophy, ArrowRight, BookOpen, Star, Sparkles, Flame } from 'lucide-react';
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
                {/* Hero Welcome Section */}
                <header className="hero-section">
                    <div className="hero-content">
                        <div className="welcome-badge">
                            <Sparkles size={14} className="text-blue-400" />
                            <span>Level Up Your Learning</span>
                        </div>
                        <h1>
                            Welcome back, <span className="premium-text">{user?.full_name?.split(' ')[0] || 'Explorer'}</span>
                            {user?.streak_count > 0 && <span className="streak-fire"> 🔥</span>}!
                        </h1>
                        <p>Your journey to excellence continues today. You've been active for <b>{user?.streak_count || 0}</b> days in a row!</p>
                    </div>
                    <div className="hero-actions">
                        <button
                            className="btn-refresh-premium"
                            onClick={fetchStudentStats}
                            disabled={loading}
                        >
                            <Clock size={16} className={loading ? 'animate-spin' : ''} />
                            <span>{loading ? 'Updating...' : 'Refresh Stats'}</span>
                        </button>
                    </div>
                </header>

                <div className="dashboard-main-grid">
                    {/* Join Quiz Card - Premium Interaction */}
                    <div className="premium-card join-box">
                        <div className="card-visual">
                            <div className="circle-glow"></div>
                            <Play size={32} fill="currentColor" className="play-icon" />
                        </div>
                        <div className="card-body">
                            <h3>Live Session</h3>
                            <p>Enter the 6-digit code from your teacher to join a live quiz room.</p>

                            <form className="join-form-premium" onSubmit={handleJoinQuiz}>
                                <div className="premium-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="CODE: AB1234"
                                        value={quizCode}
                                        onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                    />
                                    <button type="submit" disabled={isJoining} className="btn-join-action">
                                        {isJoining ? <div className="spinner-mini"></div> : 'Join Room'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="stats-subgrid">
                        <div className="stat-box-premium">
                            <div className="stat-icon-wrap blue"><BookOpen size={20} /></div>
                            <div className="stat-content">
                                <span className="val">{stats.quizzes_taken}</span>
                                <span className="lbl">Quizzes Taken</span>
                            </div>
                        </div>
                        <div className="stat-box-premium">
                            <div className="stat-icon-wrap purple"><TrendingUp size={20} /></div>
                            <div className="stat-content">
                                <span className="val">{stats.avg_score}%</span>
                                <span className="lbl">Average Score</span>
                            </div>
                        </div>
                        <div className="stat-box-premium streak-box">
                            <div className="stat-icon-wrap orange"><Flame size={20} /></div>
                            <div className="stat-content">
                                <span className="val streak-val">{user?.streak_count || 0}</span>
                                <span className="lbl">Day Streak</span>
                            </div>
                            {user?.streak_count > 0 && <div className="streak-glow-bg"></div>}
                        </div>
                    </div>

                    {/* Activity & Performance History */}
                    <div className="premium-card performance-card full-width">
                        <div className="card-header-premium">
                            <div className="header-label">
                                <TrendingUp size={18} />
                                <h3>Performance Insights</h3>
                            </div>
                            <Link to="/my-performance" className="view-link">
                                Detailed Analytics <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="performance-content">
                            <div className="chart-visual">
                                <div className="y-axis">
                                    <span>100%</span>
                                    <span>50%</span>
                                    <span>0%</span>
                                </div>
                                <div className="bars-container">
                                    {stats.performance_history.length > 0 ? (
                                        stats.performance_history.slice(0, 6).reverse().map((res, idx) => (
                                            <div key={res.id} className="premium-bar-item">
                                                <div className="bar-column">
                                                    <div
                                                        className="bar-progress"
                                                        style={{
                                                            height: `${(res.correct_answers / res.total_questions) * 100}%`,
                                                            animationDelay: `${idx * 0.1}s`
                                                        }}
                                                    >
                                                        <div className="bar-glow"></div>
                                                        <span className="tooltip">{Math.round((res.correct_answers / res.total_questions) * 100)}%</span>
                                                    </div>
                                                </div>
                                                <span className="label">{res.quiz_title}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-chart">
                                            <TrendingUp size={48} />
                                            <p>Complete quizzes to see your growth</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="history-list">
                                <h4>Recent Activity</h4>
                                {stats.performance_history.length > 0 ? (
                                    stats.performance_history.slice(0, 4).map(res => (
                                        <div key={res.id} className="history-item-premium">
                                            <div className="h-info">
                                                <span className="h-title">{res.quiz_title}</span>
                                                <span className="h-date">{new Date(res.completed_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className={`h-score ${res.correct_answers / res.total_questions >= 0.8 ? 'gold' : res.correct_answers / res.total_questions >= 0.6 ? 'silver' : 'bronze'}`}>
                                                {Math.round((res.correct_answers / res.total_questions) * 100)}%
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-list">No recent activity</div>
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
                    gap: 32px;
                    animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Hero Section */
                .hero-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 0;
                }

                .welcome-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 100px;
                    color: #818cf8;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                }

                .hero-content h1 {
                    font-size: 2.8rem;
                    font-weight: 800;
                    margin-bottom: 12px;
                    letter-spacing: -1px;
                }

                .premium-text {
                    background: linear-gradient(135deg, #60a5fa, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
                }

                .hero-content p {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.5);
                    max-width: 600px;
                }

                .btn-refresh-premium {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-refresh-premium:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                /* Layout Grid */
                .dashboard-main-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 24px;
                }

                .premium-card {
                    background: rgba(15, 15, 15, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 28px;
                    padding: 32px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .premium-card:hover {
                    border-color: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }

                .full-width {
                    grid-column: span 2;
                }

                /* Join Card Specific */
                .join-box {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                }

                .card-visual {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 24px;
                    color: #3b82f6;
                }

                .circle-glow {
                    position: absolute;
                    width: 140%;
                    height: 140%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
                    z-index: -1;
                    animation: pulseGlow 3s infinite;
                }

                @keyframes pulseGlow {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }

                .card-body {
                    flex: 1;
                }

                .card-body h3 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                }

                .card-body p {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.95rem;
                    margin-bottom: 24px;
                }

                .join-form-premium {
                    max-width: 400px;
                }

                .premium-input-wrapper {
                    display: flex;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 6px;
                    transition: all 0.3s;
                }

                .premium-input-wrapper:focus-within {
                    border-color: #3b82f6;
                    background: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }

                .premium-input-wrapper input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 0 16px;
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    outline: none;
                }

                .btn-join-action {
                    background: #3b82f6;
                    color: #fff;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-join-action:hover {
                    background: #2563eb;
                    transform: scale(1.02);
                }

                /* Stats Subgrid */
                .stats-subgrid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .stat-box-premium {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.3s;
                }

                .stat-box-premium:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateX(8px);
                }

                .stat-icon-wrap {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon-wrap.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .stat-icon-wrap.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .stat-icon-wrap.gold { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
                .stat-icon-wrap.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }

                .stat-content .val {
                    display: block;
                    font-size: 1.4rem;
                    font-weight: 800;
                }

                .stat-content .lbl {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                /* Performance Card */
                .card-header-premium {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .header-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #a855f7;
                }

                .header-label h3 {
                    color: #fff;
                    font-size: 1.25rem;
                }

                .view-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.85rem;
                    text-decoration: none;
                    transition: color 0.3s;
                }

                .view-link:hover { color: #fff; }

                .performance-content {
                    display: grid;
                    grid-template-columns: 1.4fr 0.6fr;
                    gap: 48px;
                }

                /* Chart Visual */
                .chart-visual {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 24px;
                    padding: 32px;
                    height: 300px;
                    display: flex;
                    gap: 24px;
                    position: relative;
                }

                .chart-visual .y-axis {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: calc(100% - 40px);
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .bars-container {
                    flex: 1;
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 100%;
                }

                .premium-bar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    width: 48px;
                }

                .bar-column {
                    width: 16px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 100px;
                    position: relative;
                    display: flex;
                    align-items: flex-end;
                }

                .bar-progress {
                    width: 100%;
                    background: linear-gradient(to top, #6366f1, #a855f7);
                    border-radius: 100px;
                    position: relative;
                    animation: growUp 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-origin: bottom;
                }

                .bar-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 20px;
                    background: #a855f7;
                    filter: blur(10px);
                    opacity: 0.4;
                }

                @keyframes growUp { from { scale: 1 0; } to { scale: 1 1; } }

                .tooltip {
                    position: absolute;
                    top: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #fff;
                    color: #000;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    opacity: 0;
                    transition: all 0.3s;
                }

                .premium-bar-item:hover .tooltip { opacity: 1; top: -45px; }

                .premium-bar-item .label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.3);
                    white-space: nowrap;
                    max-width: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* History List */
                .history-list h4 {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 20px;
                }

                .history-item-premium {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    margin-bottom: 12px;
                    transition: 0.3s;
                }

                .history-item-premium:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .h-info { display: flex; flex-direction: column; }
                .h-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 4px; }
                .h-date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.3); }

                .h-score {
                    font-weight: 800;
                    padding: 6px 12px;
                    border-radius: 10px;
                }

                .h-score.gold { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
                .h-score.silver { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
                .h-score.bronze { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                @media (max-width: 1024px) {
                    .dashboard-main-grid { grid-template-columns: 1fr; }
                    .full-width { grid-column: span 1; }
                    .performance-content { grid-template-columns: 1fr; }
                    .join-box { flex-direction: column; text-align: center; }
                    .hero-section { flex-direction: column; gap: 24px; align-items: flex-start; }
                }

                .streak-box {
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(249, 115, 22, 0.2);
                }

                .streak-val {
                    color: #f97316;
                    text-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
                }

                .streak-glow-bg {
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 100px;
                    height: 200px;
                    background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
                    z-index: 0;
                    pointer-events: none;
                }

                .streak-fire {
                    display: inline-block;
                    animation: flicker 1s infinite alternate;
                }

                @keyframes flicker {
                    from { transform: scale(1); filter: brightness(1); }
                    to { transform: scale(1.1); filter: brightness(1.2); }
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </DashboardLayout>
    );
}
