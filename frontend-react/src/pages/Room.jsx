import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Copy, Play, ArrowLeft, Users, BookOpen, Sparkles, CheckCircle } from 'lucide-react';

const API_Base_URL = '/api/v1';

export default function Room() {
    const { id } = useParams();
    const [code, setCode] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [quizData, setQuizData] = useState(null);

    useEffect(() => {
        async function fetchQuiz() {
            try {
                const res = await fetch(`${API_Base_URL}/quizzes/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizData(data);
                    setCode(data.access_code);
                } else {
                    showNotification('Quiz not found', 'error');
                    navigate('/dashboard');
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
        navigate(`/game/host/${id}`);
    };

    if (!quizData) return (
        <div className="loading-room">
            <div className="loader"></div>
            <p>Booting up Game Environment...</p>
            <style jsx>{`
                .loading-room { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0a0a0c; color: #fff; }
                .loader { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    return (
        <div className="room-page-premium">
            {/* Background Aesthetic */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>

            <div className="room-card-premium glassmorphism-room">
                <div className="icon-success-r">
                    <CheckCircle size={40} />
                </div>

                <div className="room-header-r">
                    <div className="badge-r">
                        <Sparkles size={14} />
                        <span>SESSION READY</span>
                    </div>
                    <h1>Lobby <span className="gradient-text-blue">Manifest</span></h1>
                    <p>Transmit the access credentials to your audience to initialize the engagement.</p>
                </div>

                <div className="code-box-premium glassmorphism-inner">
                    <label>ACCESS CODE</label>
                    <div className="code-display">{code || '------'}</div>
                    <button className="btn-copy-premium" onClick={copyToClipboard}>
                        <Copy size={18} />
                        <span>Copy Identity</span>
                    </button>
                </div>

                <div className="room-info-grid">
                    <div className="info-item-r">
                        <Users size={20} className="text-blue" />
                        <div className="info-dat">
                            <span className="info-val">Waiting...</span>
                            <span className="info-lbl">PARTICIPANTS</span>
                        </div>
                    </div>
                    <div className="info-item-r">
                        <BookOpen size={20} className="text-purple" />
                        <div className="info-dat">
                            <span className="info-val">{quizData.questions?.length || 0}</span>
                            <span className="info-lbl">CHALLENGES</span>
                        </div>
                    </div>
                </div>

                <div className="room-actions-r">
                    <button className="btn-action-r launch" onClick={handleStartGame}>
                        <Play size={20} />
                        <span>Launch Broadcast</span>
                    </button>
                    <Link to="/teacher-dashboard" className="btn-action-r back">
                        <ArrowLeft size={20} />
                        <span>Exit Lobby</span>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .room-page-premium {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a0a0c;
                    color: #fff;
                    position: relative;
                    overflow: hidden;
                    padding: 20px;
                }

                .blob {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%);
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                }

                .blob-1 { top: -100px; left: -100px; }
                .blob-2 { bottom: -100px; right: -100px; background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%); }

                .room-card-premium {
                    max-width: 600px;
                    width: 100%;
                    padding: 60px;
                    border-radius: 40px;
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    animation: cardIn 1s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes cardIn {
                    from { opacity: 0; transform: scale(0.9) translateY(40px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .glassmorphism-room {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
                }

                .icon-success-r {
                    width: 80px;
                    height: 80px;
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 32px;
                }

                .badge-r {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    padding: 6px 16px;
                    border-radius: 100px;
                    color: #818cf8;
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 1px;
                    margin-bottom: 24px;
                }

                .room-header-r h1 {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 16px;
                    letter-spacing: -1.5px;
                }

                .gradient-text-blue {
                    background: linear-gradient(135deg, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .room-header-r p {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin-bottom: 48px;
                }

                .code-box-premium {
                    padding: 32px;
                    border-radius: 32px;
                    margin-bottom: 40px;
                }

                .glassmorphism-inner {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .code-box-premium label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.3);
                    letter-spacing: 2px;
                    margin-bottom: 16px;
                }

                .code-display {
                    font-size: 4rem;
                    font-weight: 900;
                    letter-spacing: 10px;
                    margin-bottom: 32px;
                    font-family: 'Inter', sans-serif;
                }

                .btn-copy-premium {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 18px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0 auto;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .btn-copy-premium:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
                }

                .room-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 48px;
                }

                .info-item-r {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 20px;
                    text-align: left;
                }

                .info-dat { display: flex; flex-direction: column; }
                .info-val { font-weight: 800; font-size: 1.1rem; }
                .info-lbl { font-size: 0.7rem; color: rgba(255, 255, 255, 0.3); font-weight: 700; }

                .room-actions-r { display: flex; flex-direction: column; gap: 16px; }
                .btn-action-r {
                    width: 100%;
                    padding: 20px;
                    border-radius: 22px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: 0.3s;
                    border: none;
                }

                .btn-action-r.launch {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: #fff;
                    box-shadow: 0 15px 35px rgba(99, 102, 241, 0.25);
                }

                .btn-action-r.launch:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 45px rgba(99, 102, 241, 0.35);
                }

                .btn-action-r.back {
                    background: transparent;
                    color: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-decoration: none;
                }

                .btn-action-r.back:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .text-blue { color: #60a5fa; }
                .text-purple { color: #a855f7; }

                @media (max-width: 600px) {
                    .room-card-premium { padding: 40px 24px; }
                    .code-display { font-size: 3rem; letter-spacing: 5px; }
                    .room-info-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
