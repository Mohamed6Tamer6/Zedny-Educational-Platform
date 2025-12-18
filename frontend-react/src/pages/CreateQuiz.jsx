import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import '../styles/Creator.css';

const API_URL = 'http://127.0.0.1:8000/api/v1';
const DEFAULT_QUESTION = {
    id: 1,
    text: '',
    type: 'multiple_choice',
    timeLimit: 20,
    points: 10,
    answerOptions: 'single_select',
    answers: [
        { text: '', isCorrect: false, color: 'red' },
        { text: '', isCorrect: false, color: 'blue' },
        { text: '', isCorrect: false, color: 'yellow' },
        { text: '', isCorrect: false, color: 'green' }
    ]
};

const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['fa-square', 'fa-circle', 'fa-play', 'fa-star']; // FontAwesome classes

export default function CreateQuiz() {
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // State
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
    const [currentQIndex, setCurrentQIndex] = useState(0);

    // Modals
    const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
    const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);
    const [modalAnswerText, setModalAnswerText] = useState('');
    const [modalIsCorrect, setModalIsCorrect] = useState(false);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState(''); // 'loading', 'success', 'error'
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState('medium');

    // Helpers
    const currentQ = questions[currentQIndex];

    const fileInputRef = useRef(null);

    // --- Actions ---

    const addQuestion = () => {
        const newQ = JSON.parse(JSON.stringify(DEFAULT_QUESTION));
        newQ.id = Date.now();
        setQuestions([...questions, newQ]);
        setCurrentQIndex(questions.length); // Switch to new question
    };

    const deleteQuestion = (index, e) => {
        if (e) e.stopPropagation();
        if (questions.length <= 1) {
            showNotification("You must have at least one question.", "warning");
            return;
        }
        const newQs = questions.filter((_, i) => i !== index);
        setQuestions(newQs);
        if (currentQIndex >= newQs.length) {
            setCurrentQIndex(newQs.length - 1);
        }
    };

    const duplicateCurrentQuestion = () => {
        const newQ = JSON.parse(JSON.stringify(currentQ));
        newQ.id = Date.now();
        const newQs = [...questions];
        newQs.splice(currentQIndex + 1, 0, newQ);
        setQuestions(newQs);
        setCurrentQIndex(currentQIndex + 1);
    };

    const updateQuestionField = (field, value) => {
        const newQs = [...questions];
        const q = newQs[currentQIndex];

        // If changing type to True/False, replace answers
        if (field === 'type') {
            if (value === 'true_false') {
                q.answers = [
                    { text: 'True', isCorrect: true, color: 'blue' },
                    { text: 'False', isCorrect: false, color: 'red' }
                ];
            } else if (value === 'multiple_choice' && q.type === 'true_false') {
                // Reset to default 4 options if switching back from T/F
                q.answers = [
                    { text: '', isCorrect: false, color: 'red' },
                    { text: '', isCorrect: false, color: 'blue' },
                    { text: '', isCorrect: false, color: 'yellow' },
                    { text: '', isCorrect: false, color: 'green' }
                ];
            }
        }

        q[field] = value;
        setQuestions(newQs);
    };

    const handleTitleChange = (e) => setQuizTitle(e.target.value);

    // --- Answer Modal ---

    const openAnswerModal = (ansIndex) => {
        const ans = currentQ.answers[ansIndex];
        setEditingAnswerIndex(ansIndex);
        setModalAnswerText(ans.text);
        setModalIsCorrect(ans.isCorrect);
        setIsAnswerModalOpen(true);
    };

    const saveAnswer = () => {
        const newQs = [...questions];
        const q = newQs[currentQIndex];

        q.answers[editingAnswerIndex] = {
            ...q.answers[editingAnswerIndex],
            text: modalAnswerText,
            isCorrect: modalIsCorrect
        };

        // Logic for single select: if this one is correct, others must be false
        if (q.answerOptions === 'single_select' && modalIsCorrect) {
            q.answers.forEach((a, i) => {
                if (i !== editingAnswerIndex) a.isCorrect = false;
            });
        }

        setQuestions(newQs);
        setIsAnswerModalOpen(false);
    };

    // --- Saving Quiz ---

    const saveQuiz = async () => {
        if (!quizTitle.trim()) {
            showNotification("Please enter a quiz title", "error");
            return;
        }

        try {
            console.log("DEBUG: Checking Auth Token in saveQuiz...");
            console.log("DEBUG: Token Present:", !!token);
            if (!token) {
                console.error("DEBUG: No auth token found!");
                showNotification("Authentication error: No login token found. Please save your work elsewhere and re-login.", "error");
                return;
            }

            // Prepare the quiz data
            const quizData = {
                title: quizTitle.trim(),
                description: "Created via Web UI",  // Required by backend
                is_public: true,  // Make sure this is boolean
                questions: questions.map((q, qIndex) => {
                    // Filter out empty answers first
                    const nonEmptyAnswers = q.answers.filter(a => a.text && a.text.trim());

                    // Ensure we have at least one answer
                    if (!nonEmptyAnswers || nonEmptyAnswers.length === 0) {
                        throw new Error(`Question ${qIndex + 1} must have at least one answer`);
                    }

                    // Check for at least one correct answer (among non-empty answers)
                    const hasCorrectAnswer = nonEmptyAnswers.some(a => a.isCorrect);
                    if (!hasCorrectAnswer) {
                        throw new Error(`Question ${qIndex + 1} must have at least one correct answer`);
                    }

                    // Determine question type based on options
                    let validQuestionType = q.type || 'multiple_choice';
                    if (validQuestionType === 'multiple_choice' && q.answerOptions === 'multiple_select') {
                        validQuestionType = 'multiple_select';
                    }

                    return {
                        text: q.text.trim(),
                        question_type: validQuestionType,
                        points: parseInt(q.points) || 10,  // Convert to number, default 10
                        time_limit: parseInt(q.timeLimit) || 30,  // Convert to number
                        choices: nonEmptyAnswers.map((a) => {
                            return {
                                text: a.text.trim(),
                                is_correct: a.isCorrect === true  // Ensure boolean
                            };
                        })
                    };
                })
            };

            console.log("DEBUG: Sending quiz data payload:", JSON.stringify(quizData, null, 2));

            const response = await fetch('http://127.0.0.1:8000/api/v1/quizzes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(quizData)
            });

            console.log("DEBUG: Response Status:", response.status);
            const responseData = await response.json().catch(() => ({}));
            console.log("DEBUG: Response Body:", responseData);

            if (!response.ok) {
                console.error("Backend error:", responseData);

                // Handle 401 Unauthorized specifically
                if (response.status === 401) {
                    showNotification("Session expired. Please log in again.", "error");
                    setTimeout(() => {
                        window.location.href = '/login'; // Force redirect
                        localStorage.removeItem('token'); // Clear token
                        localStorage.removeItem('user');
                    }, 1500);
                    return;
                }
                console.error("Backend error:", responseData);
                const errorDetail = responseData.detail || responseData.error || 'Unknown Backend Error';
                const errorMsg = `Error ${response.status}: ${JSON.stringify(errorDetail)}`;
                throw new Error(errorMsg);
            }

            showNotification('Quiz saved successfully!', 'success');
            navigate(`/quiz/${responseData.id}`);

        } catch (error) {
            console.error('Error saving quiz FULL DETAILS:', error);

            // Show detailed error message from backend if available
            let errorMessage = 'UNKNOWN ERROR (UPDATED): Please check console logs';
            if (error.message) {
                errorMessage = error.message;
            }

            showNotification(errorMessage, 'error');
        }
    };

    // --- AI Generation ---

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        }
    };

    const generateAI = async () => {
        if (!pdfFile) {
            showNotification("Please upload a PDF file first.", "warning");
            return;
        }

        setAiLoading(true);
        setAiStatus('loading');

        const formData = new FormData();
        formData.append('pdf_file', pdfFile);
        formData.append('num_questions', aiNumQuestions);
        formData.append('difficulty', aiDifficulty);

        try {
            const res = await fetch(`${API_URL}/generate/from-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const detail = errorData.detail || errorData.message || 'Generation failed';
                throw new Error(detail);
            }

            const data = await res.json();

            // Transform incoming questions - backend returns: {text, choices: [{text, is_correct}]}
            const newQuestions = data.questions.map((q, idx) => ({
                id: Date.now() + idx,
                text: q.text || q.question || '', // Support both formats
                type: 'multiple_choice',
                timeLimit: 20,
                points: 10,
                answerOptions: 'single_select',
                answers: q.choices ? q.choices.map((choice, i) => ({
                    text: choice.text,
                    isCorrect: choice.is_correct,
                    color: ['red', 'blue', 'yellow', 'green'][i] || 'red'
                })) : [
                    { text: q.options?.[0] || '', isCorrect: q.correct_answer === 0, color: 'red' },
                    { text: q.options?.[1] || '', isCorrect: q.correct_answer === 1, color: 'blue' },
                    { text: q.options?.[2] || '', isCorrect: q.correct_answer === 2, color: 'yellow' },
                    { text: q.options?.[3] || '', isCorrect: q.correct_answer === 3, color: 'green' }
                ]
            }));

            setQuestions(prev => [...prev, ...newQuestions]);
            setIsAIModalOpen(false);
            setAiStatus('success');
            showNotification(`Generated ${newQuestions.length} questions!`, 'success');

            // Switch to first new question
            setCurrentQIndex(questions.length); // accounts for 0-index

            // Clear file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            setPdfFile(null);

        } catch (err) {
            console.error('PDF Generation Error:', err);
            setAiStatus('error');

            // If it's the error we threw from !res.ok, use its message
            // Otherwise, it might be a network error or crash
            let errorMessage = err.message || "Connection lost or server error. Please check if backend is running.";

            showNotification(`Generation Error: ${errorMessage}`, "error");

            // Clear file input on error as well, so user can retry cleanly
            if (fileInputRef.current) fileInputRef.current.value = '';
            setPdfFile(null);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="creator-page">
            {/* Top Bar */}
            <header className="creator-topbar">
                <div className="topbar-left">
                    <Link to="/dashboard" className="logo">Zedny<span className="dot">.</span> <small style={{ fontSize: '0.6em', opacity: 0.5 }}>v2.1</small></Link>
                    <input
                        type="text"
                        className="quiz-title-input"
                        placeholder="Enter quiz title (Required)"
                        value={quizTitle}
                        onChange={handleTitleChange}
                    />
                </div>
                <div className="topbar-right">
                    <Link to="/quizzes" className="btn btn-sm btn-secondary">Exit</Link>
                    <button className="btn btn-sm btn-primary" onClick={saveQuiz}>
                        <i className="fas fa-save"></i> Save
                    </button>
                </div>
            </header>

            <div className="creator-layout">
                {/* Sidebar */}
                <aside className="creator-sidebar">
                    <div className="sidebar-header">
                        <h3>Questions ({questions.length})</h3>
                    </div>
                    <div className="question-list">
                        {questions.map((q, idx) => (
                            <div
                                key={q.id}
                                className={`question-thumb ${idx === currentQIndex ? 'active' : ''}`}
                                onClick={() => setCurrentQIndex(idx)}
                            >
                                <span className="q-num">{idx + 1}</span>
                                <div className="q-preview">{q.text || 'No question text'}</div>
                                <button
                                    className="delete-page-btn"
                                    onClick={(e) => deleteQuestion(idx, e)}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-primary btn-full margin-top" onClick={addQuestion}>
                        <i className="fas fa-plus"></i> Add Question
                    </button>
                </aside>

                {/* Canvas */}
                <main className="creator-canvas">
                    <div className="question-editor">
                        <input
                            type="text"
                            className="question-text-input"
                            placeholder="Start typing your question"
                            value={currentQ.text}
                            onChange={(e) => updateQuestionField('text', e.target.value)}
                        />

                        <div className="media-area">
                            <div className="media-placeholder">
                                <i className="fas fa-image"></i>
                                <p>Upload file (Demo only)</p>
                            </div>
                        </div>

                        <div className="answers-grid">
                            {currentQ.answers.map((ans, idx) => (
                                <div key={idx} className={`answer-card ${ans.color}`} onClick={() => openAnswerModal(idx)}>
                                    <div className="shape">
                                        <i className={`fas ${SHAPES[idx]}`}></i>
                                    </div>
                                    <div className={`answer-content-btn ${ans.text ? 'has-value' : ''}`}>
                                        <span>{ans.text || 'Add Answer'}</span>
                                    </div>
                                    {ans.isCorrect && <i className="fas fa-check-circle" style={{ fontSize: '1.5rem' }}></i>}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Settings Panel */}
                <aside className="creator-settings">
                    <button className="btn btn-ai-glow margin-bottom" style={{ marginBottom: 20 }} onClick={() => setIsAIModalOpen(true)}>
                        <i className="fas fa-magic"></i> Generate with AI
                    </button>

                    <div className="setting-group">
                        <label><i className="fas fa-question-circle"></i> Question type</label>
                        <select
                            className="setting-select"
                            value={currentQ.type}
                            onChange={(e) => updateQuestionField('type', e.target.value)}
                        >
                            <option value="multiple_choice">Quiz</option>
                            <option value="true_false">True or False</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label><i className="fas fa-clock"></i> Time limit</label>
                        <select
                            className="setting-select"
                            value={currentQ.timeLimit}
                            onChange={(e) => updateQuestionField('timeLimit', e.target.value)}
                        >
                            <option value="10">10 seconds</option>
                            <option value="20">20 seconds</option>
                            <option value="30">30 seconds</option>
                            <option value="60">60 seconds</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label><i className="fas fa-star"></i> Points</label>
                        <select
                            className="setting-select"
                            value={currentQ.points}
                            onChange={(e) => updateQuestionField('points', e.target.value)}
                        >
                            <option value="0">No points</option>
                            <option value="10">Standard (10 pt)</option>
                            <option value="20">Double (20 pt)</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label><i className="fas fa-check-circle"></i> Answer options</label>
                        <select
                            className="setting-select"
                            value={currentQ.answerOptions}
                            onChange={(e) => updateQuestionField('answerOptions', e.target.value)}
                        >
                            <option value="single_select">Single select</option>
                            <option value="multiple_select">Multiple select</option>
                        </select>
                    </div>

                    <div className="setting-actions">
                        <button className="btn btn-secondary btn-full" onClick={() => deleteQuestion(currentQIndex)}>
                            <i className="fas fa-trash"></i> Delete
                        </button>
                        <button className="btn btn-outline btn-full" onClick={duplicateCurrentQuestion}>
                            <i className="fas fa-copy"></i> Duplicate
                        </button>
                    </div>
                </aside>
            </div>

            {/* Answer Modal */}
            {isAnswerModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Answer</h3>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Type answer..."
                            value={modalAnswerText}
                            onChange={(e) => setModalAnswerText(e.target.value)}
                        />

                        <div className="modal-toggle-area">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={modalIsCorrect}
                                    onChange={(e) => setModalIsCorrect(e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                            <span className="toggle-label">Mark as Correct Answer</span>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setIsAnswerModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveAnswer}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Modal */}
            {isAIModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3><i className="fas fa-magic" style={{ color: '#8b5cf6' }}></i> Generate with AI</h3>

                        <div className="setting-group">
                            <label>Upload PDF</label>
                            <label htmlFor="pdf-upload" className="custom-file-upload">
                                <i className="fas fa-cloud-upload-alt"></i>
                                {pdfFile ? pdfFile.name : 'Choose PDF File'}
                            </label>
                            <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} />
                        </div>

                        <div className="setting-group">
                            <label>Number of Questions</label>
                            <select className="setting-select" value={aiNumQuestions} onChange={e => setAiNumQuestions(e.target.value)}>
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label>Difficulty</label>
                            <select className="setting-select" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                                <option value="beginner">Beginner</option>
                                <option value="medium">Medium</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        {aiStatus === 'loading' && <div className="status-box active loading">Generating... <i className="fas fa-spinner fa-spin"></i></div>}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setIsAIModalOpen(false)}>Cancel</button>
                            <button className="btn btn-ai-glow" onClick={generateAI} disabled={aiLoading}>
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
