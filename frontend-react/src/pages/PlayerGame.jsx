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
import { Bot, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import AIExplanationModal from '../components/AIExplanationModal';
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
    const [userAnswers, setUserAnswers] = useState([]); // Track user choices for review
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationData, setExplanationData] = useState(null);

    // Refs for stable results regardless of React render cycles
    const scoreRef = useRef(0);
    const correctCountRef = useRef(0);
    const intervalRef = useRef(null);
    const autoAdvanceRef = useRef(null);
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

    const [isJoining, setIsJoining] = useState(false);

    const recordParticipation = async (quizId) => {
        if (!token) return;
        try {
            console.log(`DEBUG: Recording participation for quiz ${quizId}`);
            await fetch(`${API_URL}/quizzes/${quizId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error("DEBUG: Failed to record participation", err);
        }
    };

    const autoJoin = async (code, name) => {
        try {
            console.log(`DEBUG: Auto-joining code ${code} for ${name}`);
            const res = await fetch(`${API_URL}/quizzes/by-code/${code}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const quiz = await res.json();
                console.log("DEBUG: Quiz data received", quiz);
                setQuizData(quiz);
                setStep('waiting');
                recordParticipation(quiz.id); // Background call
                setTimeout(() => startGame(quiz), 800);
            } else {
                console.error("DEBUG: Room not found", res.status);
            }
        } catch (err) {
            console.error("DEBUG: Auto-join error", err);
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
            setIsJoining(true);
            console.log(`DEBUG: Joining code ${roomCode} manually`);
            const res = await fetch(`${API_URL}/quizzes/by-code/${roomCode}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const foundQuiz = await res.json();
                console.log("DEBUG: Found quiz", foundQuiz);
                setQuizData(foundQuiz);
                setStep('waiting');
                recordParticipation(foundQuiz.id);
                // Transitions to playing state after a short brief
                setTimeout(() => {
                    startGame(foundQuiz);
                }, 800);
            } else {
                showNotification("Room not found or invalid code", "error");
            }
        } catch (err) {
            console.error("DEBUG: Handle join error", err);
            showNotification("Error joining room", "error");
        } finally {
            setIsJoining(false);
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
        setUserAnswers([]);
        loadQuestion(0, quiz);
    };

    // Timer Sound Logic
    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio context not supported", e);
        }
    };

    // Timer Effect (Correct pattern for React)
    useEffect(() => {
        if (step !== 'playing' || feedback || !quizData) return;

        if (timer <= 0) {
            handleTimeout();
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 6 && prev > 1) {
                    playBeep();
                }
                return (prev > 0 ? prev - 1 : 0);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [step, timer, feedback, quizData]);

    const loadQuestion = (index, quiz) => {
        if (!quiz || !quiz.questions[index]) return;
        const q = quiz.questions[index];
        setTimer(q.time_limit || 20);
        setFeedback(null);
        setSelectedChoice(null);
    };

    const handleTimeout = () => {
        // Automatically submit the current state (selected or not)
        commitAnswer();
    };

    const handleChoiceClick = (idx) => {
        if (feedback) return;
        setSelectedChoice(idx);
        // User wants immediate feedback, so we commit the answer right away
        // Use a timeout to ensure state is updated or just pass the idx directly
        setTimeout(() => commitAnswer(idx), 50);
    };

    const commitAnswer = (choiceIdx = null) => {
        // If timer is still running, stop it
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (feedback) return; // Prevent double submission

        const actualChoiceIdx = choiceIdx !== null ? choiceIdx : selectedChoice;
        const q = quizData.questions[currentQIndex];
        const choice = actualChoiceIdx !== null ? q.choices[actualChoiceIdx] : null;
        const isCorrect = choice?.is_correct || false;

        // Store user answer for review
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQIndex] = actualChoiceIdx;
            return newAnswers;
        });

        let pointsAwarded = 0;
        if (isCorrect) {
            pointsAwarded = q.points || 10;
            setScore(prev => prev + pointsAwarded);
            setCorrectCount(prev => prev + 1);
            scoreRef.current += pointsAwarded;
            correctCountRef.current += 1;
            setFeedback({ isCorrect: true, points: pointsAwarded });
        } else {
            setWrongCount(prev => prev + 1);
            setFeedback({
                isCorrect: false,
                correctText: q.choices.find(c => c.is_correct)?.text || "Unknown",
                wasTimeout: actualChoiceIdx === null
            });
        }

        // Auto-advance after 2 seconds
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = setTimeout(() => {
            nextQuestion();
        }, 2000);
    };

    const nextQuestion = () => {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

        if (quizData && currentQIndex < quizData.questions.length - 1) {
            const nextIdx = currentQIndex + 1;
            setCurrentQIndex(nextIdx);
            loadQuestion(nextIdx, quizData);
        } else {
            finishGame();
        }
    };

    const finishGame = async () => {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
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
        if (quizData) {
            // Direct restart
            startGame(quizData);
            return;
        }
        setStep('join');
        setQuizData(null);
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        scoreRef.current = 0;
        correctCountRef.current = 0;
        setFeedback(null);
        setSelectedChoice(null);
        setUserAnswers([]);
    };

    const startReview = () => {
        setStep('review');
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
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleJoin}
                                disabled={isJoining}
                            >
                                {isJoining ? 'Joining...' : 'Join Room'}
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
                        <div className="game-progress">
                            <span className="current">Q{currentQIndex + 1}</span>
                            <span className="total">/ {quizData.questions.length}</span>
                        </div>
                        <div className={`timer-circle ${timer <= 5 ? 'warning' : ''}`}>
                            <svg className="timer-svg" viewBox="0 0 60 60">
                                <circle r="28" cx="30" cy="30"></circle>
                                <circle r="28" cx="30" cy="30" style={{
                                    strokeDashoffset: 176 - (176 * timer) / (quizData.questions[currentQIndex].time_limit || 20)
                                }}></circle>
                            </svg>
                            <span className="timer-text">{timer}</span>
                        </div>
                        <div className="game-score">
                            <span className="score-label">Points</span>
                            <span className="score-value">{score}</span>
                        </div>
                    </div>

                    <div className="game-main">
                        <div className="question-display">
                            <div className="question-badge">{currentQIndex + 1}</div>
                            <h1 className="question-text">{quizData.questions[currentQIndex].text}</h1>
                            <div className="question-meta">
                                <span>{quizData.questions[currentQIndex].points || 10} POINTS</span>
                            </div>
                        </div>

                        <div className="answers-grid">
                            {quizData?.questions?.[currentQIndex]?.choices?.map((c, idx) => (
                                <div
                                    key={idx}
                                    className={`answer-card ${COLORS[idx % 4]} ${selectedChoice === idx ? 'selected' : ''}`}
                                    onClick={() => handleChoiceClick(idx)}
                                    style={{ transform: 'none' }}
                                >
                                    <div className="shape">{String.fromCharCode(65 + idx)}</div>
                                    <span>{c.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Control Row: Only visible when a choice is made and no feedback is showing */}
                        <div className="game-actions-row">
                            {selectedChoice !== null && !feedback && (
                                <button
                                    className="btn btn-primary next-question-btn"
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
                                <h2>{feedback.wasTimeout ? "Time's Up!" : (feedback.isCorrect ? 'Correct!' : 'Wrong!')}</h2>
                                <p>
                                    {feedback.isCorrect
                                        ? `+${feedback.points} Points`
                                        : (feedback.wasTimeout
                                            ? `The correct answer was: ${feedback.correctText}`
                                            : `Correct answer: ${feedback.correctText}`)}
                                </p>
                                <button className="btn btn-primary" onClick={nextQuestion}>
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
                                <span className="stat-value wrong">{(quizData?.questions?.length || 0) - correctCountRef.current}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Score</span>
                                <span className="stat-value score">
                                    <AnimatedValue value={scoreRef.current} />
                                </span>
                            </div>
                        </div>

                        <div className="results-actions">
                            <button className="btn" onClick={resetGame} style={{ background: '#fff', color: '#000' }}>Play Again</button>
                            <button className="btn btn-primary" onClick={startReview}>Next (Review)</button>
                            <button className="btn btn-secondary" onClick={handleExit}>Exit</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'review' && quizData && (
                <div className="review-container">
                    <div className="review-header">
                        <h1>Quiz Review</h1>
                        <div className="review-summary">
                            <span>Score: {score}</span>
                            <span>Correct: {correctCount} / {quizData.questions.length}</span>
                        </div>
                    </div>

                    <div className="review-content">
                        {quizData.questions.map((q, qIdx) => {
                            const userChoiceIdx = userAnswers[qIdx];
                            const isCorrect = userChoiceIdx !== null && q.choices[userChoiceIdx]?.is_correct;

                            return (
                                <div key={qIdx} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                                    <div className="review-q-header">
                                        <div className="q-info-group">
                                            <span className="q-num">Question {qIdx + 1}</span>
                                            <span className={`q-status ${isCorrect ? 'status-correct' : 'status-wrong'}`}>
                                                {isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-ai-explain"
                                            onClick={() => {
                                                const studentAnsText = userChoiceIdx !== null ? q.choices[userChoiceIdx]?.text : "No answer provided";
                                                setExplanationData({ question: q, studentAnswer: studentAnsText });
                                                setIsExplaining(true);
                                            }}
                                        >
                                            <Bot size={14} />
                                            <span>Wait, Why?</span>
                                        </button>
                                    </div>
                                    <h3 className="review-q-text">{q.text}</h3>
                                    <div className="review-choices">
                                        {q.choices.map((choice, cIdx) => {
                                            const isSelected = userChoiceIdx === cIdx;
                                            const isProperCorrect = choice.is_correct;

                                            let choiceClass = '';
                                            if (isProperCorrect) choiceClass = 'correct-choice';
                                            else if (isSelected && !isProperCorrect) choiceClass = 'wrong-choice';

                                            return (
                                                <div key={cIdx} className={`review-choice ${choiceClass}`}>
                                                    <span className="choice-text">{choice.text}</span>
                                                    {isProperCorrect && <i className="fas fa-check-circle"></i>}
                                                    {isSelected && !isProperCorrect && <i className="fas fa-times-circle"></i>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="review-footer">
                        <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
                        <button className="btn btn-secondary" onClick={handleExit}>Finish Review</button>
                    </div>
                </div>
            )}
            {explanationData && (
                <AIExplanationModal
                    isOpen={isExplaining}
                    onClose={() => setIsExplaining(false)}
                    question={explanationData.question}
                    studentAnswer={explanationData.studentAnswer}
                />
            )}
        </div>
    );
}
