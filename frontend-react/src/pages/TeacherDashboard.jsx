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
    Play
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
            // Fetch both quizzes and stats
            const [quizzesRes, statsRes] = await Promise.all([
                fetch(`${API_Base_URL}/quizzes/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_Base_URL}/quizzes/stats/teacher`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (quizzesRes.ok && statsRes.ok) {
                const quizzesData = await quizzesRes.json();
                const statsData = await statsRes.json();

                // Merge quiz-specific stats into the quizzes list
                const enhancedQuizzes = quizzesData.map(q => {
                    const quizStat = statsData.quizzes.find(s => s.id === q.id);
                    return {
                        ...q,
                        student_count: quizStat?.student_count || 0,
                        avg_score_val: quizStat?.avg_score || 0
                    };
                });

                setQuizzes(enhancedQuizzes);
                setStats({
                    total_quizzes: statsData.total_quizzes,
                    total_students: statsData.total_students,
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
                // Refresh stats after deletion
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

    const handleEditQuiz = (id) => {
        navigate(`/edit-quiz/${id}`);
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.access_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="teacher-dashboard">
                <header className="dashboard-header-t">
                    <div className="header-text">
                        <h1>Teacher <span className="highlight">Console</span></h1>
                        <p>Manage your interactive learning materials and track student progress.</p>
                    </div>
                    <div className="header-actions-t">
                        <form className="join-quiz-inline glassmorphism" onSubmit={handleJoinGame}>
                            <Play size={18} color="#6366f1" />
                            <input
                                type="text"
                                placeholder="Enter Room Code"
                                maxLength={6}
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            />
                            <button type="submit">Join</button>
                        </form>
                        <Link to="/create-quiz" className="btn-create-new">
                            <Plus size={20} />
                            <span>Create New Quiz</span>
                        </Link>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="stats-row-t">
                    <div className="stat-card-t glassmorphism">
                        <div className="stat-icon-t blue"><BookOpen size={24} /></div>
                        <div className="stat-info-t">
                            <span className="stat-value">{stats.total_quizzes}</span>
                            <span className="stat-label">Total Quizzes</span>
                        </div>
                    </div>
                    <div className="stat-card-t glassmorphism">
                        <div className="stat-icon-t purple"><Users size={24} /></div>
                        <div className="stat-info-t">
                            <span className="stat-value">{stats.total_students}</span>
                            <span className="stat-label">Total Students</span>
                        </div>
                    </div>
                    <div className="stat-card-t glassmorphism">
                        <div className="stat-icon-t green"><BarChart3 size={24} /></div>
                        <div className="stat-info-t">
                            <span className="stat-value">{stats.avg_completion_rate}%</span>
                            <span className="stat-label">Avg. Completion</span>
                        </div>
                    </div>
                </div>

                {/* Main Content: Quizzes List */}
                <section className="quizzes-section">
                    <div className="section-header">
                        <h2>My Quizzes</h2>
                        <div className="search-bar-t">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="quiz-list-grid">
                        {loading ? (
                            <div className="loading-grid">
                                {[1, 2, 3].map(n => <div key={n} className="quiz-skeleton glassmorphism"></div>)}
                            </div>
                        ) : filteredQuizzes.length > 0 ? (
                            filteredQuizzes.map(quiz => (
                                <div key={quiz.id} className="quiz-row-card glassmorphism">
                                    <div className="quiz-info-main">
                                        <div className="quiz-icon-box">
                                            {quiz.title.charAt(0)}
                                        </div>
                                        <div className="quiz-titles">
                                            <h3>{quiz.title}</h3>
                                            <div className="quiz-tags">
                                                <span className="tag-code"><Clock size={12} /> {quiz.questions?.length || 0} Questions</span>
                                                <span className="tag-code"><Edit size={12} /> Code: <strong>{quiz.access_code}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="quiz-stats-mini">
                                        <div className="mini-stat">
                                            <span className="m-val">{quiz.student_count}</span>
                                            <span className="m-lbl">Students</span>
                                        </div>
                                        <div className="mini-stat">
                                            <span className="m-val">{quiz.avg_score_val}%</span>
                                            <span className="m-lbl">Avg. Score</span>
                                        </div>
                                    </div>

                                    <div className="quiz-actions">
                                        <button className="action-btn-t view" onClick={() => navigate(`/quiz/${quiz.id}`)} title="View Responses">
                                            <Eye size={18} />
                                        </button>
                                        <button className="action-btn-t edit" onClick={() => handleEditQuiz(quiz.id)} title="Edit Quiz">
                                            <Edit size={18} />
                                        </button>
                                        <button className="action-btn-t delete" onClick={() => confirmDelete(quiz.id)} title="Delete Quiz">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-teacher-state glassmorphism">
                                <BookOpen size={48} color="rgba(255,255,255,0.1)" />
                                <p>No quizzes found. Start by creating one!</p>
                                <Link to="/create-quiz" className="btn-link">Create Quiz Now</Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="modal">
                    <div className="modal-content glassmorphism">
                        <Trash2 size={48} color="#ef4444" style={{ margin: '0 auto 20px', display: 'block' }} />
                        <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '10px' }}>Delete Quiz?</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '30px' }}>
                            Are you sure you want to delete this quiz? This action cannot be undone.
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteModal({ isOpen: false, quizId: null })}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff' }} onClick={handleDeleteQuiz}>
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <style jsx>{`
                .teacher-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 35px;
                }

                .dashboard-header-t {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .header-text h1 {
                    font-size: 2.2rem;
                    margin-bottom: 8px;
                }

                .highlight {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header-text p {
                    color: rgba(255, 255, 255, 0.55);
                    max-width: 500px;
                }

                .header-actions-t {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .join-quiz-inline {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 15px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .join-quiz-inline input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 120px;
                    outline: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    letter-spacing: 1px;
                }

                .join-quiz-inline button {
                    background: rgba(99, 102, 241, 0.15);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    color: #818cf8;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .join-quiz-inline button:hover {
                    background: #6366f1;
                    color: #fff;
                }

                .btn-create-new {
                    background: #6366f1;
                    color: #fff;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 24px;
                    border-radius: 14px;
                    font-weight: 600;
                    transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
                }

                .btn-create-new:hover {
                    background: #4f46e5;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3);
                }

                .stats-row-t {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .stat-card-t {
                    padding: 25px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .stat-icon-t {
                    width: 54px;
                    height: 54px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon-t.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .stat-icon-t.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .stat-icon-t.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

                .stat-info-t {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }

                .section-header h2 {
                    font-size: 1.5rem;
                }

                .search-bar-t {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px 16px;
                    width: 300px;
                }

                .search-bar-t input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100%;
                    outline: none;
                    font-size: 0.9rem;
                }

                .quiz-list-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .quiz-row-card {
                    padding: 20px 30px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: 0.2s;
                }

                .quiz-row-card:hover {
                    border-color: rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.05);
                }

                .quiz-info-main {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    flex: 2;
                }

                .quiz-icon-box {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: #6366f1;
                    text-transform: uppercase;
                }

                .quiz-titles h3 {
                    font-size: 1.1rem;
                    margin-bottom: 6px;
                }

                .quiz-tags {
                    display: flex;
                    gap: 15px;
                }

                .tag-code {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .tag-code strong { color: #fff; }

                .quiz-stats-mini {
                    display: flex;
                    gap: 40px;
                    flex: 1;
                    justify-content: center;
                }

                .mini-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .m-val { font-weight: 600; font-size: 1rem; }
                .m-lbl { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); }

                .quiz-actions {
                    display: flex;
                    gap: 10px;
                    flex: 1;
                    justify-content: flex-end;
                }

                .action-btn-t {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                }

                .action-btn-t.view:hover { color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
                .action-btn-t.edit:hover { color: #a855f7; border-color: #a855f7; background: rgba(168, 85, 247, 0.1); }
                .action-btn-t.delete:hover { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }

                .empty-teacher-state {
                    padding: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }

                .btn-link {
                    color: #6366f1;
                    text-decoration: underline;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                @media (max-width: 900px) {
                    .dashboard-header-t { flex-direction: column; align-items: flex-start; }
                    .quiz-row-card { flex-direction: column; align-items: flex-start; gap: 20px; }
                    .quiz-stats-mini { justify-content: flex-start; gap: 30px; }
                    .quiz-actions { width: 100%; }
                }

                .loading-grid { display: flex; flex-direction: column; gap: 15px; }
                .quiz-skeleton { height: 80px; border-radius: 20px; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
            `}</style>
        </DashboardLayout>
    );
}
