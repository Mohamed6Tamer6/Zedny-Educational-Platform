import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    Users,
    Trophy,
    Calendar,
    ChevronLeft,
    Download,
    Search,
    User,
    CheckCircle2,
    XCircle,
    BarChart3,
    Clock
} from 'lucide-react';

const API_Base_URL = '/api/v1';

export default function QuizResults() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [results, setResults] = useState([]);
    const [quizInfo, setQuizInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const [resultsRes, quizRes] = await Promise.all([
                fetch(`${API_Base_URL}/quizzes/${id}/results`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_Base_URL}/quizzes/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (resultsRes.ok && quizRes.ok) {
                const resultsData = await resultsRes.json();
                const quizData = await quizRes.json();
                setResults(resultsData);
                setQuizInfo(quizData);
            } else {
                showNotification('Failed to fetch results', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error connecting to server', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(r =>
        r.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading results...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="results-page">
                <header className="results-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ChevronLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="quiz-info-main">
                        <div className="badge">Activity Report</div>
                        <h1>{quizInfo?.title || 'Quiz Results'}</h1>
                        <p>{quizInfo?.description || 'Review student performance and engagement.'}</p>
                    </div>
                </header>

                <div className="results-stats-overview">
                    <div className="stat-mini-card">
                        <Users className="text-blue-400" />
                        <div>
                            <span className="val">{results.length}</span>
                            <span className="lbl">Total Students</span>
                        </div>
                    </div>
                    <div className="stat-mini-card">
                        <Trophy className="text-yellow-400" />
                        <div>
                            <span className="val">
                                {results.length > 0
                                    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
                                    : 0}
                            </span>
                            <span className="lbl">Average Score</span>
                        </div>
                    </div>
                    <div className="stat-mini-card">
                        <CheckCircle2 className="text-green-400" />
                        <div>
                            <span className="val">
                                {(() => {
                                    if (!results || results.length === 0 || !quizInfo?.questions) return 0;
                                    const totalMaxScore = quizInfo.questions.reduce((acc, q) => acc + (q.points || 0), 0);
                                    if (totalMaxScore === 0) return 0;
                                    const passers = results.filter(r => r.score >= (totalMaxScore * 0.5));
                                    return Math.round((passers.length / results.length) * 100);
                                })()}%
                            </span>
                            <span className="lbl">Success Rate</span>
                        </div>
                    </div>
                </div>

                <div className="results-container glassmorphism">
                    <div className="container-header">
                        <div className="title-section">
                            <BarChart3 size={20} />
                            <h2>Student Performance</h2>
                        </div>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="results-table-wrapper">
                        {filteredResults.length > 0 ? (
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Rank</th>
                                        <th>Correct Answers</th>
                                        <th>Final Score</th>
                                        <th>Completed At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.map((result) => (
                                        <tr key={result.id}>
                                            <td>
                                                <div className="student-cell">
                                                    <div className="avatar">
                                                        <User size={16} />
                                                    </div>
                                                    <span>{result.user_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`rank-badge ${result.rank?.toLowerCase()}`}>
                                                    {result.rank || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="progress-cell">
                                                    <span className="ratio">{result.correct_answers} / {result.total_questions}</span>
                                                    <div className="progress-bg">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${(result.correct_answers / result.total_questions) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="score-val">{result.score.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <div className="date-cell">
                                                    <Clock size={14} />
                                                    <span>{formatDate(result.completed_at)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-results">
                                <Users size={48} />
                                <p>No student results found for this quiz yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .results-page {
                    animation: fadeIn 0.5s ease-out;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .results-header {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    width: fit-content;
                    padding: 0;
                    font-weight: 600;
                    transition: 0.2s;
                }

                .back-btn:hover {
                    color: #fff;
                    transform: translateX(-4px);
                }

                .badge {
                    background: rgba(129, 140, 248, 0.1);
                    color: #818cf8;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    width: fit-content;
                    margin-bottom: 12px;
                    border: 1px solid rgba(129, 140, 248, 0.2);
                }

                .quiz-info-main h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .quiz-info-main p {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1.1rem;
                }

                .results-stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }

                .stat-mini-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 24px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .stat-mini-card .val {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 800;
                }

                .stat-mini-card .lbl {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .results-container {
                    background: rgba(20, 20, 25, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    overflow: hidden;
                }

                .container-header {
                    padding: 24px 32px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .title-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .title-section h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 8px 16px;
                    border-radius: 12px;
                    width: 300px;
                }

                .search-bar input {
                    background: none;
                    border: none;
                    color: #fff;
                    width: 100%;
                    outline: none;
                }

                .results-table-wrapper {
                    overflow-x: auto;
                }

                .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                .results-table th {
                    padding: 20px 32px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.02);
                }

                .results-table td {
                    padding: 20px 32px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }

                .student-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 600;
                }

                .avatar {
                    width: 32px;
                    height: 32px;
                    background: rgba(129, 140, 248, 0.2);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #818cf8;
                }

                .rank-badge {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .rank-badge.legendary\! { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .rank-badge.expert { background: rgba(168, 85, 247, 0.1); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.2); }
                .rank-badge.intermediate { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
                .rank-badge.novice { background: rgba(156, 163, 175, 0.1); color: #9ca3af; border: 1px solid rgba(156, 163, 175, 0.2); }

                .progress-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    min-width: 150px;
                }

                .ratio {
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .progress-bg {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 100px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #6366f1, #a855f7);
                    border-radius: 100px;
                }

                .score-val {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    color: #22c55e;
                }

                .date-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.85rem;
                }

                .empty-results {
                    padding: 80px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    color: rgba(255, 255, 255, 0.2);
                }

                .loading-state {
                    height: 400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(129, 140, 248, 0.1);
                    border-top-color: #818cf8;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .container-header { flex-direction: column; align-items: flex-start; }
                    .search-bar { width: 100%; }
                }
            `}</style>
        </DashboardLayout>
    );
}
