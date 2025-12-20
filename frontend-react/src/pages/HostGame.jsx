/**
 * =============================================================================
 * Host Game Page Component
 * =============================================================================
 * The interactive game interface for quiz hosts (teachers).
 * Displays questions, manages timer, tracks score, and handles answers.
 * 
 * Game States:
 * - loading: Fetching quiz data
 * - playing: Active gameplay
 * - results: Game finished, showing final score
 * - error: Failed to load quiz
 * 
 * Features:
 * - Auto-start on quiz load
 * - Countdown timer per question
 * - Score tracking with points calculation
 * - Support for single and multiple select questions
 * - Score overlay after each answer
 * - Auto-advance when timer runs out
 * - Final results with play again option
 * 
 * Question Types Supported:
 * - multiple_choice: Single correct answer
 * - multiple_select: Multiple correct answers
 * - true_false: Boolean answers
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/Game.css';

const API_URL = '/api/v1';
const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['fa-square', 'fa-circle', 'fa-play', 'fa-star']; // FontAwesome

function HostGameContent() {
    const { quizId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [quizData, setQuizData] = useState(null);
    const [gameState, setGameState] = useState('loading'); // loading, playing, results
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timer, setTimer] = useState(20);

    // Gameplay State
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null); // Index (single) or Array of Indices (multi)

    // Feedback State
    const [showScoreOverlay, setShowScoreOverlay] = useState(false);
    const [lastPointsEarned, setLastPointsEarned] = useState(0);

    // Initial Data Fetch
    useEffect(() => {
        async function fetchQuiz() {
            try {
                const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizData(data);

                    // Auto-start logic
                    if (data.questions && data.questions.length > 0) {
                        setGameState('playing');
                        setTimer(data.questions[0].time_limit || 20);
                    } else {
                        showNotification('No questions available', 'warning');
                        setGameState('error');
                    }
                } else {
                    showNotification('Quiz load failed', 'error');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                navigate('/dashboard');
            }
        }
        fetchQuiz();
    }, [quizId, token]);

    // Timer Logic
    useEffect(() => {
        if (gameState !== 'playing' || showScoreOverlay) return;

        if (timer <= 0) {
            processAnswerAndAdvance();
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState, timer, showScoreOverlay]);

    // Answer Handling
    const handleAnswer = (idx) => {
        if (showScoreOverlay) return;

        const q = quizData.questions[currentQIndex];
        const isMulti = q.question_type === 'multiple_select';

        if (!isMulti) {
            setSelectedAnswer(idx);
        } else {
            setSelectedAnswer(prev => {
                const current = Array.isArray(prev) ? prev : [];
                return current.includes(idx)
                    ? current.filter(i => i !== idx)
                    : [...current, idx];
            });
        }
    };

    const calculatePoints = () => {
        const q = quizData?.questions?.[currentQIndex];
        if (!q) return { pointsEarned: 0, isCorrect: false };

        let pointsEarned = 0;
        let isCorrect = false;

        if (q.question_type !== 'multiple_select') {
            if (selectedAnswer !== null) {
                const choice = q.choices[selectedAnswer];
                if (choice && choice.is_correct) {
                    pointsEarned = q.points || 10;
                    isCorrect = true;
                }
            }
        } else {
            const selectedIndices = Array.isArray(selectedAnswer) ? selectedAnswer : [];
            const correctIndices = q.choices.map((c, i) => c.is_correct ? i : -1).filter(i => i !== -1);

            const matches =
                selectedIndices.length === correctIndices.length &&
                selectedIndices.every(i => correctIndices.includes(i));

            if (matches) {
                pointsEarned = q.points || 10;
                isCorrect = true;
            }
        }
        return { pointsEarned, isCorrect };
    };

    const processAnswerAndAdvance = () => {
        if (showScoreOverlay) return;

        const { pointsEarned, isCorrect } = calculatePoints();

        if (isCorrect) {
            setScore(prev => prev + pointsEarned);
            setCorrectCount(prev => prev + 1);
        }
        setLastPointsEarned(pointsEarned);
        setShowScoreOverlay(true);

        setTimeout(() => {
            setShowScoreOverlay(false);
            if (quizData && currentQIndex < quizData.questions.length - 1) {
                const nextIdx = currentQIndex + 1;
                setCurrentQIndex(nextIdx);
                setTimer(quizData.questions[nextIdx].time_limit || 20);
                setSelectedAnswer(null);
            } else {
                setGameState('results');
            }
        }, 2000);
    };

    const endGame = () => {
        if (window.confirm("End Game?")) navigate('/dashboard');
    };

    const restartGame = () => {
        setGameState('playing');
        setCurrentQIndex(0);
        setTimer(quizData.questions[0].time_limit || 20);
        setScore(0);
        setCorrectCount(0);
        setSelectedAnswer(null);
        setShowScoreOverlay(false);
    };

    // --- RENDER LOGIC ---

    // 1. Loading State
    if (gameState === 'loading' || !quizData) {
        return (
            <div className="game-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner-border text-light" role="status"></div>
                    <h2 style={{ marginTop: 20 }}>Loading Quiz...</h2>
                </div>
            </div>
        );
    }

    // 2. Error State
    if (gameState === 'error') {
        return (
            <div className="game-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <h2>Error Loading Game</h2>
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    // 3. Results State
    if (gameState === 'results') {
        return (
            <div className="game-page">
                <div className="results-container">
                    <div className="results-card">
                        <div className="results-icon"><i className="fas fa-trophy"></i></div>
                        <h1>Game Finished!</h1>
                        <div className="results-stats">
                            <div className="result-stat">
                                <span className="stat-label">Total Score</span>
                                <span className="stat-value score">{score}</span>
                            </div>
                            <div className="result-stat">
                                <span className="stat-label">Correct</span>
                                <span className="stat-value correct">{correctCount} / {quizData.questions.length}</span>
                            </div>
                        </div>
                        <div className="results-actions" style={{ marginTop: 30 }}>
                            <button className="btn btn-primary" onClick={restartGame}>Play Again</button>
                            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Playing State (Default Fallback)
    const currentQ = quizData.questions[currentQIndex];
    if (!currentQ) return null; // Should not happen if data is integrity checked

    const isMultiSelect = currentQ.question_type === 'multiple_select';
    const progress = ((currentQIndex + 1) / quizData.questions.length) * 100;

    return (
        <div className="game-page">
            {/* Topbar */}
            <div className="host-topbar">
                <div className="host-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="logo" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Zedny</span>
                    <span style={{ opacity: 0.6 }}>|</span>
                    <span style={{ fontWeight: 600 }}>{quizData.title}</span>
                </div>
                <div className="host-topbar-right">
                    <button className="btn btn-sm btn-secondary" onClick={endGame}>End Game</button>
                </div>
            </div>

            {/* Score Overlay */}
            {showScoreOverlay && (
                <div className="score-overlay">
                    <div className="score-overlay-content">
                        <div className="score-label">Current Score</div>
                        <div className="score-number">{score}</div>
                        <div className={`score-plus ${lastPointsEarned > 0 ? '' : 'wrong'}`} style={{ color: lastPointsEarned > 0 ? '#22c55e' : '#ef4444' }}>
                            +{lastPointsEarned} Points
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', width: '100%', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#f59e0b', transition: 'width 0.5s ease' }}></div>
            </div>

            {/* Scrollable Content Area */}
            <div className="game-scrollable-content">
                {/* Game Header */}
                <div className="game-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span className="game-progress">Question {currentQIndex + 1} / {quizData.questions.length}</span>
                        <span style={{ fontSize: '0.9rem', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 4, width: 'fit-content' }}>
                            {isMultiSelect ? 'Multiple Select' : 'Single Choice'}
                        </span>
                    </div>

                    <span className="timer-circle" style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        border: '4px solid',
                        borderColor: timer <= 5 ? '#ef4444' : '#f59e0b',
                        color: timer <= 5 ? '#ef4444' : 'white',
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                    }}>
                        {timer}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                        <span className="game-score">Score: {score}</span>
                        <span style={{ color: '#f59e0b', fontSize: '1rem' }}>
                            <i className="fas fa-star" style={{ marginRight: 5 }}></i>{currentQ.points || 10} pts
                        </span>
                    </div>
                </div>

                {/* Question */}
                <div className="question-display" style={{
                    background: 'linear-gradient(135deg, #1a1a24, #252538)',
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '10px auto 24px',
                    maxWidth: '900px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    }}></div>
                    <h1 className="question-text" style={{
                        fontSize: '1.8rem',
                        margin: '0 0 10px 0',
                        fontWeight: '600',
                        lineHeight: '1.4',
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {currentQ.text}
                    </h1>
                    {isMultiSelect && (
                        <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: '1rem',
                            color: '#fbbf24',
                            fontWeight: '500'
                        }}>
                            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                            Select all correct answers
                        </div>
                    )}
                </div>

                {/* Answers */}
                <div className="answers-grid" style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 20px' }}>
                    {currentQ.choices?.map((choice, idx) => {
                        const isSelected = Array.isArray(selectedAnswer)
                            ? selectedAnswer.includes(idx)
                            : selectedAnswer === idx;

                        return (
                            <div
                                key={idx}
                                className={`answer-card ${COLORS[idx % 4]} ${isSelected ? 'selected' : ''}`}
                                style={{
                                    justifyContent: 'center',
                                    border: isSelected ? '4px solid white' : '0px solid transparent',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                    opacity: (showScoreOverlay) ? 0.8 : 1,
                                    padding: '20px 16px',
                                    minHeight: 90
                                }}
                                onClick={() => handleAnswer(idx)}
                            >
                                <div className="shape"><i className={`fas ${SHAPES[idx % 4]}`}></i></div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{choice.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="game-fixed-bottom">
                <button className="btn btn-primary next-question-btn" onClick={processAnswerAndAdvance} style={{
                    padding: '16px 50px',
                    fontSize: '1.2rem',
                    borderRadius: '50px',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    fontWeight: 800,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}>
                    NEXT QUESTION <i className="fas fa-chevron-right" style={{ marginLeft: 12 }}></i>
                </button>
            </div>
        </div>
    );
}

export default function HostGame() {
    return (
        <ErrorBoundary>
            <HostGameContent />
        </ErrorBoundary>
    );
}
