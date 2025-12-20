/**
 * =============================================================================
 * Player Game Page Component
 * =============================================================================
 * The game interface for students/players joining via room code.
 * Handles joining, playing, and displaying results.
 * 
 * Game Flow Steps:
 * 1. join: Enter room code and player name
 * 2. waiting: Brief loading screen before game starts
 * 3. playing: Answer questions with timer
 * 4. results: Final score and rank display
 * 
 * Features:
 * - Join game by 6-character room code
 * - Countdown timer for each question
 * - Immediate feedback on answer (correct/wrong)
 * - Score tracking with animated display
 * - Rank system based on performance
 * - Play again option
 * 
 * Rank System:
 * - Legendary: 80%+ correct
 * - Expert: 60-79% correct
 * - Intermediate: 40-59% correct
 * - Novice: Below 40% correct
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Game.css';

const API_URL = '/api/v1';
const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['fa-square', 'fa-circle', 'fa-play', 'fa-star'];

export default function PlayerGame() {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { user, token } = useAuth(); // Optional for player, but good if we have it

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
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Refs for stable results regardless of React render cycles
    const scoreRef = useRef(0);
    const correctCountRef = useRef(0);
    const intervalRef = useRef(null);
    const location = useLocation();

    // Auto-join if code in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (code) {
            setRoomCode(code);
            if (user?.full_name) {
                setPlayerName(user.full_name);
                autoJoin(code, user.full_name);
            }
        }
    }, [location.search, user]);

    const autoJoin = async (code, name) => {
        try {
            const res = await fetch(`${API_URL}/quizzes/by-code/${code}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const quiz = await res.json();
                setQuizData(quiz);
                setStep('waiting');
                setTimeout(() => startGame(quiz), 1500);
            }
        } catch (err) {
            console.error(err);
        }
    };

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
            const res = await fetch(`${API_URL}/quizzes/by-code/${roomCode}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const foundQuiz = await res.json();
                setQuizData(foundQuiz);
                setStep('waiting');
                setTimeout(() => {
                    startGame(foundQuiz);
                }, 2000);
            } else {
                showNotification("Room not found or invalid", "error");
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
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        scoreRef.current = 0;
        correctCountRef.current = 0;
        loadQuestion(0, quiz);
    };

    const loadQuestion = (index, quiz) => {
        if (!quiz || !quiz.questions[index]) return;
        const q = quiz.questions[index];
        setTimer(q.time_limit || 20);
        setFeedback(null);
        setSelectedChoice(null);

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
        // Automatically submit the quiz with current saved answers
        if (selectedChoice !== null) {
            const q = quizData.questions[currentQIndex];
            const choice = q.choices[selectedChoice];
            if (choice?.is_correct) {
                const pts = q.points || 10;
                setScore(prev => prev + pts);
                setCorrectCount(prev => prev + 1);
                scoreRef.current += pts;
                correctCountRef.current += 1;
            } else {
                setWrongCount(prev => prev + 1);
            }
        } else {
            setWrongCount(prev => prev + 1);
        }

        // Timer expiry forces quiz completion
        finishGame();
    };

    const handleChoiceClick = (idx) => {
        if (feedback) return;
        setSelectedChoice(idx);
    };

    const commitAnswer = () => {
        if (selectedChoice === null) return;

        const q = quizData.questions[currentQIndex];
        const choice = q.choices[selectedChoice];
        const isCorrect = choice?.is_correct || false;

        if (isCorrect) {
            const pts = q.points || 10;
            setScore(prev => prev + pts);
            setCorrectCount(prev => prev + 1);
            scoreRef.current += pts;
            correctCountRef.current += 1;
            setFeedback({ isCorrect: true, points: pts });
        } else {
            setWrongCount(prev => prev + 1);
            setFeedback({
                isCorrect: false,
                correctText: q.choices.find(c => c.is_correct)?.text || "Unknown"
            });
        }

        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const nextQuestion = () => {
        if (quizData && currentQIndex < quizData.questions.length - 1) {
            const nextIdx = currentQIndex + 1;
            setCurrentQIndex(nextIdx);
            loadQuestion(nextIdx, quizData);
        } else {
            finishGame();
        }
    };

    const finishGame = async () => {
        setStep('results');
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (token && quizData) {
            try {
                setIsSaving(true);
                // Calculate rank inside finishGame since state updates might not be flushed
                const totalQ = quizData.questions.length || 1;
                const finalCorrect = correctCountRef.current;
                const finalScore = scoreRef.current;

                const ratio = finalCorrect / totalQ;
                let rankLabel = 'Novice';
                if (ratio >= 0.8) rankLabel = 'Legendary!';
                else if (ratio >= 0.6) rankLabel = 'Expert';
                else if (ratio >= 0.4) rankLabel = 'Intermediate';

                const payload = {
                    quiz_id: quizData.id,
                    score: finalScore,
                    total_questions: totalQ,
                    correct_answers: finalCorrect,
                    rank: rankLabel
                };

                console.log("DEBUG: Sending payload to /attempts", payload);
                const res = await fetch(`${API_URL}/quizzes/${quizData.id}/attempts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const saved = await res.json();
                    console.log("DEBUG: Saved successfully", saved);
                    showNotification("Performance saved successfully", "success");
                } else {
                    const errorMsg = await res.text();
                    console.error("DEBUG: Save failed", res.status, errorMsg);
                    showNotification(`Error: ${res.status} - Could not save results`, "error");
                }
            } catch (err) {
                console.error("DEBUG: Network error saving result", err);
                showNotification("Network error. Results not saved.", "error");
            } finally {
                setIsSaving(false);
            }
        } else {
            console.warn("DEBUG: Token or QuizData missing in finishGame", { token: !!token, quizData: !!quizData });
        }
    };

    const resetGame = () => {
        setStep('join');
        setQuizData(null);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        scoreRef.current = 0;
        correctCountRef.current = 0;
        setFeedback(null);
        setSelectedChoice(null);
    };

    const handleExit = () => {
        if (isSaving) {
            showNotification("Saving results, please wait...", "warning");
            return;
        }
        navigate('/dashboard');
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
                                    className={`answer-card ${COLORS[idx % 4]} ${selectedChoice === idx ? 'selected' : ''}`}
                                    onClick={() => handleChoiceClick(idx)}
                                    style={{ transform: 'none' }}
                                >
                                    <div className="shape"><i className={`fas ${SHAPES[idx % 4]}`}></i></div>
                                    <span>{c.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Control Row: Only visible when a choice is made and no feedback is showing */}
                        <div className="game-actions-row">
                            {selectedChoice !== null && !feedback && (
                                <button
                                    className="btn btn-primary next-question-btn"
                                    style={{ padding: '15px 60px', fontSize: '1.2rem', minWidth: '250px' }}
                                    onClick={commitAnswer}
                                >
                                    {currentQIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className={`answer-feedback ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
                            <div className="feedback-content">
                                <i className={`feedback-icon fas ${feedback.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                <h2>{feedback.isCorrect ? 'Correct!' : 'Wrong!'}</h2>
                                <p>{feedback.isCorrect ? `+${feedback.points} Points` : `Correct answer: ${feedback.correctText}`}</p>
                                <button className="btn btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', minWidth: '200px' }} onClick={nextQuestion}>
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
                                <span className="stat-value correct">{correctCountRef.current}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Wrong</span>
                                <span className="stat-value wrong">{quizData.questions.length - correctCountRef.current}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Score</span>
                                <span className="stat-value score">
                                    <AnimatedValue value={scoreRef.current} />
                                </span>
                            </div>
                        </div>

                        <div className="results-actions">
                            <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
                            <button className="btn btn-secondary" onClick={handleExit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Exit Quiz</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

