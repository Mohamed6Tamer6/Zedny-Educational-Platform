import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    Plus,
    Search,
    MoreVertical,
    Users,
    Clock,
    BookOpen,
    ArrowRight,
    Edit,
    Trash2,
    Eye,
    BarChart3,
    Play,
    Sparkles,
    LayoutGrid
} from 'lucide-react';

const API_Base_URL = '/api/v1';

export default function TeacherDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [quizzes, setQuizzes] = useState([]);
    const [stats, setStats] = useState({
        total_quizzes: 0,
        total_students: 0,
        total_participations: 0,
        avg_completion_rate: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, quizId: null });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [quizzesRes, statsRes] = await Promise.all([
                fetch(`${API_Base_URL}/quizzes/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_Base_URL}/quizzes/stats/teacher`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (quizzesRes.ok && statsRes.ok) {
                const quizzesData = await quizzesRes.json();
                const statsData = await statsRes.json();

                const enhancedQuizzes = quizzesData.map(q => {
                    const quizStat = statsData.quizzes.find(s => s.id === q.id);
                    return {
                        ...q,
                        student_count: quizStat?.student_count || 0,
                        participation_count: quizStat?.participation_count || 0,
                        avg_score_val: quizStat?.avg_score || 0
                    };
                });

                setQuizzes(enhancedQuizzes);
                setStats({
                    total_quizzes: statsData.total_quizzes,
                    total_students: statsData.total_students,
                    total_participations: statsData.total_participations,
                    avg_completion_rate: statsData.avg_completion_rate
                });
            } else {
                showNotification('Failed to fetch dashboard data', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Server connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setDeleteModal({ isOpen: true, quizId: id });
    };

    const handleDeleteQuiz = async () => {
        const id = deleteModal.quizId;
        try {
            const res = await fetch(`${API_Base_URL}/quizzes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setQuizzes(quizzes.filter(q => q.id !== id));
                showNotification('Quiz deleted successfully', 'success');
                fetchDashboardData();
            } else {
                showNotification('Failed to delete quiz', 'error');
            }
        } catch (err) {
            showNotification('Error deleting quiz', 'error');
        } finally {
            setDeleteModal({ isOpen: false, quizId: null });
        }
    };

    const handleJoinGame = (e) => {
        e.preventDefault();
        if (joinCode.length === 6) {
            navigate(`/play?code=${joinCode.toUpperCase()}`);
        } else {
            showNotification('Please enter a 6-character code', 'warning');
        }
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.access_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="teacher-dashboard">
                {/* Header Section */}
                <header className="premium-header">
                    <div className="header-text-wrap">
                        <div className="badge-premium">
                            <Sparkles size={14} />
                            <span>Creator Studio</span>
                        </div>
                        <h1>Teacher <span className="gradient-text">Console</span></h1>
                        <p>Architect your knowledge and monitor your students' intellectual growth.</p>
                    </div>
                    <div className="header-actions-premium">
                        <form className="join-form-compact glassmorphism" onSubmit={handleJoinGame}>
                            <Play size={16} className="play-icon" />
                            <input
                                type="text"
                                placeholder="ROOM CODE"
                                maxLength={6}
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            />
                            <button type="submit">Join</button>
                        </form>
                        <Link to="/create-quiz" className="btn-create-premium">
                            <Plus size={20} />
                            <span>Create Quiz</span>
                        </Link>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid-premium">
                    <div className="stat-card-premium blue">
                        <div className="stat-visual"><BookOpen size={24} /></div>
                        <div className="stat-data">
                            <span className="s-value">{stats.total_quizzes}</span>
                            <span className="s-label">Total Quizzes</span>
                        </div>
                    </div>
                    <div className="stat-card-premium purple">
                        <div className="stat-visual"><Users size={24} /></div>
                        <div className="stat-data">
                            <span className="s-value">{stats.total_participations}</span>
                            <span className="s-label">Total Engagements</span>
                        </div>
                    </div>
                    <div className="stat-card-premium green">
                        <div className="stat-visual"><BarChart3 size={24} /></div>
                        <div className="stat-data">
                            <span className="s-value">{stats.avg_completion_rate}%</span>
                            <span className="s-label">Avg. Completion</span>
                        </div>
                    </div>
                </div>

                {/* Quizzes Section */}
                <section className="quizzes-explorer">
                    <div className="explorer-header">
                        <div className="title-with-icon">
                            <LayoutGrid size={20} className="text-purple-400" />
                            <h2>My Library</h2>
                        </div>
                        <div className="search-box-premium">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by title or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="quizzes-display-grid">
                        {loading ? (
                            <div className="skeleton-grid">
                                {[1, 2, 3].map(n => <div key={n} className="skeleton-item-premium"></div>)}
                            </div>
                        ) : filteredQuizzes.length > 0 ? (
                            filteredQuizzes.map(quiz => (
                                <div key={quiz.id} className="quiz-premium-row">
                                    <div className="quiz-main-info">
                                        <div className="quiz-avatar">
                                            {quiz.title.charAt(0)}
                                        </div>
                                        <div className="quiz-details">
                                            <h3>{quiz.title}</h3>
                                            <div className="quiz-meta">
                                                <span className="meta-pill"><Clock size={12} /> {quiz.questions?.length || 0} Qs</span>
                                                <span className="meta-pill code"><Sparkles size={12} /> CODE: <strong>{quiz.access_code}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="quiz-data-mini">
                                        <div className="d-item">
                                            <span className="d-val">{quiz.participation_count}</span>
                                            <span className="d-lbl">Entries</span>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="d-item">
                                            <span className="d-val">{quiz.student_count}</span>
                                            <span className="d-lbl">Completions</span>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="d-item">
                                            <span className="d-val">{quiz.avg_score_val}%</span>
                                            <span className="d-lbl">Avg. Score</span>
                                        </div>
                                    </div>

                                    <div className="quiz-row-actions">
                                        <button className="row-btn view" onClick={() => navigate(`/quiz/${quiz.id}`)} title="View Lobby">
                                            <Eye size={18} />
                                        </button>
                                        <button className="row-btn stats" onClick={() => navigate(`/quiz/${quiz.id}/results`)} title="View Student Results">
                                            <BarChart3 size={18} />
                                        </button>
                                        <button className="row-btn edit" onClick={() => navigate(`/edit-quiz/${quiz.id}`)} title="Edit Quiz">
                                            <Edit size={18} />
                                        </button>
                                        <button className="row-btn delete" onClick={() => confirmDelete(quiz.id)} title="Delete permanently">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-premium glassmorphism">
                                <BookOpen size={48} className="opacity-20" />
                                <p>Your library is empty. Let's create your first masterpiece.</p>
                                <Link to="/create-quiz" className="action-link-premium">Get Started</Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Custom Modal */}
            {deleteModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-premium glassmorphism">
                        <div className="alert-icon"><Trash2 size={40} /></div>
                        <h3>Delete this quiz?</h3>
                        <p>This will permanently remove all student responses and data associated with this quiz. This action cannot be undone.</p>
                        <div className="modal-btn-row">
                            <button className="modal-btn cancel" onClick={() => setDeleteModal({ isOpen: false, quizId: null })}>Keep it</button>
                            <button className="modal-btn confirm" onClick={handleDeleteQuiz}>Delete Permanently</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .teacher-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    animation: fadeIn 0.8s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Header */
                .premium-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-bottom: 10px;
                }

                .badge-premium {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(168, 85, 247, 0.1);
                    border: 1px solid rgba(168, 85, 247, 0.2);
                    border-radius: 100px;
                    color: #a855f7;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }

                .header-text-wrap h1 {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 12px;
                    letter-spacing: -1.5px;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #818cf8, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header-text-wrap p {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1.1rem;
                    max-width: 500px;
                }

                .header-actions-premium {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .join-form-compact {
                    display: flex;
                    align-items: center;
                    padding: 6px 6px 6px 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    transition: all 0.3s;
                }

                .join-form-compact:focus-within {
                    border-color: #818cf8;
                    background: rgba(255, 255, 255, 0.08);
                }

                .join-form-compact input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100px;
                    padding: 0 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    outline: none;
                }

                .join-form-compact button {
                    background: #818cf8;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .btn-create-premium {
                    background: #fff;
                    color: #000;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 800;
                    transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
                }

                .btn-create-premium:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(255, 255, 255, 0.2);
                }

                /* Stats Grid */
                .stats-grid-premium {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                }

                .stat-card-premium {
                    padding: 32px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    transition: 0.4s;
                }

                .stat-card-premium:hover {
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-5px);
                }

                .stat-visual {
                    width: 60px;
                    height: 60px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .blue .stat-visual { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .purple .stat-visual { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .green .stat-visual { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

                .s-value { font-size: 2rem; font-weight: 900; display: block; }
                .s-label { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

                /* Quizzes Section */
                .explorer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .title-with-icon { display: flex; align-items: center; gap: 12px; }
                .title-with-icon h2 { font-size: 1.5rem; font-weight: 800; }

                .search-box-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px 20px;
                    border-radius: 16px;
                    width: 350px;
                }

                .search-box-premium input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100%;
                    outline: none;
                }

                /* Quiz List */
                .quizzes-display-grid { display: flex; flex-direction: column; gap: 16px; }

                .quiz-premium-row {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 24px 32px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: 0.3s;
                }

                .quiz-premium-row:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.12);
                    transform: scale(1.01);
                }

                .quiz-main-info { display: flex; align-items: center; gap: 24px; flex: 2; }
                .quiz-avatar {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                }

                .quiz-details h3 { font-size: 1.25rem; margin-bottom: 6px; font-weight: 700; }
                .quiz-meta { display: flex; gap: 16px; }
                .meta-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 10px;
                    border-radius: 8px;
                }
                .meta-pill.code strong { color: #fff; }

                .quiz-data-mini { flex: 1; display: flex; align-items: center; justify-content: center; gap: 32px; }
                .d-item { text-align: center; }
                .d-val { font-size: 1.2rem; font-weight: 800; display: block; }
                .d-lbl { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; font-weight: 600; }
                .divider { width: 1px; height: 30px; background: rgba(255, 255, 255, 0.1); }

                .quiz-row-actions { flex: 1; display: flex; justify-content: flex-end; gap: 12px; }
                .row-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                }

                .row-btn:hover { color: #fff; transform: translateY(-2px); }
                .row-btn.view:hover { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-color: #3b82f6; }
                .row-btn.stats:hover { background: rgba(34, 197, 94, 0.2); color: #22c55e; border-color: #22c55e; }
                .row-btn.edit:hover { background: rgba(168, 85, 247, 0.2); color: #a855f7; border-color: #a855f7; }
                .row-btn.delete:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: #ef4444; }

                /* Empty & Modal */
                .empty-state-premium { padding: 80px; text-align: center; border-radius: 32px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .action-link-premium { color: #818cf8; font-weight: 700; text-decoration: underline; }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .modal-content-premium {
                    max-width: 500px;
                    width: 100%;
                    padding: 40px;
                    border-radius: 32px;
                    text-align: center;
                    animation: modalIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes modalIn { from { translate: 0 50px; opacity: 0; } }

                .alert-icon { color: #ef4444; margin-bottom: 24px; padding: 20px; background: rgba(239, 68, 68, 0.1); display: inline-block; border-radius: 24px; }
                .modal-btn-row { display: flex; gap: 16px; margin-top: 32px; }
                .modal-btn { flex: 1; padding: 14px; border-radius: 16px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; }
                .modal-btn.cancel { background: rgba(255, 255, 255, 0.05); color: #fff; }
                .modal-btn.confirm { background: #ef4444; color: #fff; }
                .modal-btn:hover { scale: 1.05; }

                .glassmorphism { background: rgba(20, 20, 25, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }

                @media (max-width: 1024px) {
                    .premium-header { flex-direction: column; align-items: flex-start; gap: 32px; }
                    .stats-grid-premium { grid-template-columns: 1fr; }
                    .quiz-premium-row { flex-direction: column; gap: 24px; align-items: flex-start; }
                    .quiz-row-actions { width: 100%; }
                }

                .skeleton-grid { display: flex; flex-direction: column; gap: 16px; }
                .skeleton-item-premium { height: 100px; background: rgba(255, 255, 255, 0.03); border-radius: 24px; animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
            `}</style>
        </DashboardLayout>
    );
}
