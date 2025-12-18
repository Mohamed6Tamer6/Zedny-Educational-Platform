import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Game.css';

const API_URL = '/api/v1';
const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['fa-square', 'fa-circle', 'fa-play', 'fa-star'];

export default function PlayerGame() {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { token } = useAuth(); // Optional for player, but good if we have it

    // Steps: 'join', 'waiting', 'playing', 'results'
    const [step, setStep] = useState('join');
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');

    const [quizData, setQuizData] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [timer, setTimer] = useState(0);
    const [feedback, setFeedback] = useState(null); // { isCorrect, correctText, points }

    // Timer Ref
    const intervalRef = useRef(null);

    // --- JOIN LOGIC ---
    const handleJoin = async () => {
        if (roomCode.length !== 6) {
            showNotification("Invalid Code", "error");
            return;
        }
        if (!playerName) {
            showNotification("Name required", "error");
            return;
        }

        try {
            // Find quiz by access code
            // We'll use the public endpoint if available, or authenticated
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${API_URL}/quizzes/`, { headers });

            if (res.ok) {
                const quizzes = await res.json();
                const foundQuiz = quizzes.find(q => q.access_code === roomCode);

                if (foundQuiz) {
                    setQuizData(foundQuiz);
                    setStep('waiting');
                    // Auto start after 2s simulation
                    setTimeout(() => {
                        startGame(foundQuiz);
                    }, 2000);
                } else {
                    showNotification("Room not found", "error");
                }
            } else {
                showNotification("Connection error", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Error joining", "error");
        }
    };

    const startGame = (quiz) => {
        if (!quiz.questions || quiz.questions.length === 0) {
            showNotification("Quiz has no questions", "warning");
            return;
        }
        setStep('playing');
        setCurrentQIndex(0);
        loadQuestion(0, quiz);
    };

    const loadQuestion = (index, quiz) => {
        const q = quiz.questions[index];
        setTimer(q.time_limit || 20);
        setFeedback(null);

        // Start Timer
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleTimeout = () => {
        // Treat as wrong answer
        setWrongCount(prev => prev + 1);
        const q = quizData.questions[currentQIndex];
        setFeedback({
            isCorrect: false,
            correctText: q.choices.find(c => c.is_correct)?.text,
            points: q.points || 10
        });
    };

    // --- RANKS ---
    const getRank = () => {
        const totalQ = quizData?.questions?.length || 1;
        const ratio = correctCount / totalQ;
        if (ratio >= 0.8) return { label: 'Legendary!', padding: 20 };
        if (ratio >= 0.6) return { label: 'Expert', padding: 20 };
        if (ratio >= 0.4) return { label: 'Intermediate', padding: 20 };
        return { label: 'Novice', padding: 20 };
    };

    const handleAnswer = (choiceIndex) => {
        console.log("DEBUG: Answer clicked index:", choiceIndex);
        if (feedback) {
            console.log("DEBUG: Click ignored, feedback already showing.");
            return;
        }

        // Clear timer immediately
        if (intervalRef.current) clearInterval(intervalRef.current);

        const q = quizData.questions[currentQIndex];
        if (!q) {
            console.error("DEBUG: Question not found at index", currentQIndex);
            return;
        }

        const choice = q.choices[choiceIndex];
        if (!choice) {
            console.error("DEBUG: Choice not found at index", choiceIndex);
            return;
        }

        const isCorrect = choice.is_correct;
        console.log("DEBUG: Choice is correct?", isCorrect);

        if (isCorrect) {
            const pts = q.points || 10;
            // Use functional state updates to ensure accuracy
            setScore(prev => prev + pts);
            setCorrectCount(prev => prev + 1);
            setFeedback({ isCorrect: true, points: pts });
        } else {
            setWrongCount(prev => prev + 1);
            setFeedback({
                isCorrect: false,
                correctText: q.choices.find(c => c.is_correct)?.text || "Unknown"
            });
        }
    };

    // Counting animation effect
    const AnimatedValue = ({ value }) => {
        const [displayValue, setDisplayValue] = useState(0);

        useEffect(() => {
            let start = 0;
            const end = value;
            if (start === end) return;

            const duration = 1500;
            const increment = end / (duration / 16); // 60fps

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setDisplayValue(end);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(start));
                }
            }, 16);

            return () => clearInterval(timer);
        }, [value]);

        return <>{displayValue}</>;
    };

    return (
        <div className="game-page">
            {step === 'join' && (
                <div className="join-container">
                    <div className="join-card">
                        <div className="logo">Zedny<span className="dot">.</span></div>
                        <h1>Join Game</h1>
                        <p>Enter 6-digit room code</p>
                        <div className="join-form">
                            <input
                                className="join-input"
                                type="text"
                                placeholder="Room Code"
                                maxLength={6}
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                            />
                            <input
                                className="join-input"
                                type="text"
                                placeholder="Your Name"
                                maxLength={15}
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                            />
                            <button className="btn btn-primary" style={{ width: '100%', padding: 15, fontSize: '1.1rem' }} onClick={handleJoin}>
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'waiting' && (
                <div className="waiting-container">
                    <div className="waiting-content">
                        <h1>Waiting for {quizData?.title}...</h1>
                        <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i></div>
                    </div>
                </div>
            )}

            {step === 'playing' && quizData && (
                <div className="game-content">
                    <div className="game-header">
                        <div className="game-progress">Q {currentQIndex + 1} / {quizData.questions.length}</div>
                        <div className="timer-circle">{timer}</div>
                        <div className="game-score">Score: <strong>{score}</strong></div>
                    </div>

                    <div className="game-main">
                        <div className="question-display">
                            <h1 className="question-text">{quizData.questions[currentQIndex].text}</h1>
                            <div className="question-meta">
                                <span>Question {currentQIndex + 1} of {quizData.questions.length}</span>
                                <span>{quizData.questions[currentQIndex].points || 10} points</span>
                            </div>
                        </div>

                        <div className="answers-grid">
                            {quizData.questions[currentQIndex].choices.map((c, idx) => (
                                <div
                                    key={idx}
                                    className={`answer-card ${COLORS[idx % 4]}`}
                                    onClick={() => handleAnswer(idx)}
                                    style={{ transform: 'none' }}
                                >
                                    <div className="shape"><i className={`fas ${SHAPES[idx % 4]}`}></i></div>
                                    <span>{c.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className={`answer-feedback ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
                            <div className="feedback-content">
                                <i className={`feedback-icon fas ${feedback.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                <h2>{feedback.isCorrect ? 'Correct!' : 'Wrong!'}</h2>
                                <p>{feedback.isCorrect ? `+${feedback.points} Points` : `Correct answer: ${feedback.correctText}`}</p>
                                <button className="btn btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem' }} onClick={nextQuestion}>
                                    {currentQIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish Game'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'results' && (
                <div className="results-container">
                    <div className="results-card">
                        <div className="result-rank-badge">{getRank().label}</div>
                        <h1 style={{ marginBottom: 30 }}>Game Over!</h1>

                        <div className="results-stats">
                            <div className="result-stat">
                                <span className="stat-label">Correct</span>
                                <span className="stat-value correct">{correctCount}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Wrong</span>
                                <span className="stat-value wrong">{wrongCount}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Score</span>
                                <span className="stat-value score">
                                    <AnimatedValue value={score} />
                                </span>
                            </div>
                        </div>

                        <div className="results-actions">
                            <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
