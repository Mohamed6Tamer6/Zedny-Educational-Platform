/**
 * =============================================================================
 * Lesson Viewer Page - LMS Feature
 * =============================================================================
 * View and interact with individual lessons.
 * 
 * Features:
 * - Video player for video content
 * - Text content renderer
 * - PDF viewer (iframe embed)
 * - Quiz link integration
 * - Mark as complete button
 * - Navigation to next/previous lesson
 * - Progress tracking
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
    ChevronLeft, ChevronRight, Check, Video, FileText,
    File, PlayCircle, Home, BookOpen, Bot, Sparkles, X, Send, Users, Shield
} from 'lucide-react';
import CourseCommunity from '../components/CourseCommunity';
import '../styles/LMS.css';

const API_URL = '/api/v1';

export default function LessonViewer() {
    const { id: courseId, lessonId } = useParams();
    const { token, user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [canComplete, setCanComplete] = useState(false); // New state for progress enforcement
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCommunityOpen, setIsCommunityOpen] = useState(false);
    const [completionMsg, setCompletionMsg] = useState(''); // Feedback message

    const isOwner = user && course?.teacher_id === user.id;

    // Reset completion state when lesson changes (Logic moved to main flow, this effect handles sidebar enforcement)
    useEffect(() => {
        if (!currentLesson || isCompleted) return; // If already completed or not loaded, skip

        setCanComplete(false); // Default to locked
        setCompletionMsg('');

        if (currentLesson.content_type === 'text') setCanComplete(true);
        if (currentLesson.content_type === 'quiz_link') setCanComplete(true);

        if (currentLesson.content_type === 'video') setCompletionMsg('Please watch the full video to complete.');
        if (currentLesson.content_type === 'pdf') {
            setCompletionMsg('Please view the PDF to complete (wait 10s or scroll).');
            // Strict timer for PDF
            const timer = setTimeout(() => {
                setCanComplete(true);
                setCompletionMsg('You can now complete this lesson.');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [currentLesson, isCompleted]);

    useEffect(() => {
        if (courseId && lessonId) {
            // Reset states whenever lesson changes
            setIsCompleted(false);
            setCanComplete(false);
            setCompletionMsg('');
            // Then fetch data
            fetchCourseAndLesson();
        }
    }, [courseId, lessonId]);

    const fetchCourseAndLesson = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourse(data);

                // Find current lesson
                const lesson = data.lessons.find(l => l.id === parseInt(lessonId));
                setCurrentLesson(lesson);

                // Fetch enrollment/progress to check real completion status
                if (!isOwner) {
                    checkCompletionStatus(lesson.id);
                } else {
                    // Teacher always sees "Admin Mode"
                    setCanComplete(true);
                }
            }
        } catch (err) {
            console.error('Error fetching lesson:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkCompletionStatus = async (targetLessonId) => {
        try {
            const res = await fetch(`${API_URL}/courses/my-enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const enrollments = await res.json();
                const enrollment = enrollments.find(e => e.course_id === parseInt(courseId));

                if (enrollment && enrollment.lesson_progress) {
                    const progress = enrollment.lesson_progress.find(p => p.lesson_id === targetLessonId);
                    if (progress && progress.status === 'completed') {
                        setIsCompleted(true);
                        setCanComplete(true);
                        return; // Already completed
                    }
                }
            }
            // If not completed, apply enforcement rules in another effect
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (currentLesson?.content_type === 'quiz_link' && currentLesson.quiz_code) {
            const timer = setTimeout(() => {
                navigate(`/play?code=${currentLesson.quiz_code}`);
            }, 1500); // Small delay to let user see they are being redirected
            return () => clearTimeout(timer);
        }
    }, [currentLesson]);

    const markComplete = async () => {
        setCompleting(true);
        try {
            const res = await fetch(`${API_URL}/courses/lessons/${lessonId}/progress`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    time_spent_seconds: 0
                })
            });

            if (res.ok) {
                setIsCompleted(true);
                showNotification('Lesson marked as complete!', 'success');
            }
        } catch (err) {
            showNotification('Failed to update progress', 'error');
        } finally {
            setCompleting(false);
        }
    };

    const navigateLesson = (direction) => {
        if (!course || !currentLesson) return;

        const currentIdx = course.lessons.findIndex(l => l.id === currentLesson.id);
        const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;

        if (newIdx >= 0 && newIdx < course.lessons.length) {
            navigate(`/courses/${courseId}/lessons/${course.lessons[newIdx].id}`);
        }
    };

    const getCurrentIndex = () => {
        if (!course || !currentLesson) return 0;
        return course.lessons.findIndex(l => l.id === currentLesson.id);
    };

    const renderContent = () => {
        if (!currentLesson) return null;

        switch (currentLesson.content_type) {
            case 'video':
                const videoUrl = currentLesson.content_url;
                const isYoutube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

                if (isYoutube) {
                    let embedUrl = videoUrl;
                    if (videoUrl?.includes('youtube.com/watch')) {
                        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    } else if (videoUrl?.includes('youtu.be/')) {
                        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    }
                    return (
                        <div className="video-container">
                            <iframe
                                src={embedUrl}
                                title={currentLesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    );
                } else {
                    return (
                        <div className="video-container local-video" style={{ paddingBottom: 0, height: 'auto' }}>
                            <video
                                src={videoUrl}
                                controls
                                controlsList="nodownload"
                                style={{ width: '100%', borderRadius: '16px', background: '#000', outline: 'none' }}
                                poster={course?.thumbnail_url}
                                onEnded={() => {
                                    setCanComplete(true);
                                    setCompletionMsg('Video finished! You can now mark as complete.');
                                }}
                                onPlay={() => setCanComplete(false)} // Reset if they replay? Optional.
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    );
                }

            case 'pdf':
                return (
                    <div className="pdf-viewer-container glassmorphism-lms" style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div className="pdf-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <File size={20} className="text-blue-400" />
                                PDF Document
                            </span>
                            <a
                                href={currentLesson.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-external-btn"
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    color: '#60a5fa',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}
                            >
                                Open in New Tab
                            </a>
                        </div>
                        <iframe
                            src={`${currentLesson.content_url}#toolbar=0`}
                            title={currentLesson.title}
                            width="100%"
                            height="600"
                            style={{ border: 'none', borderRadius: '8px', background: 'white' }}
                        ></iframe>
                    </div>
                );

            case 'quiz_link':
                return (
                    <div className="quiz-link-container glassmorphism" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
                        <PlayCircle size={80} className="text-purple-400" style={{ marginBottom: '20px' }} />
                        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Quiz Assessment</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px' }}>
                            This lesson contains a quiz. Use the code below to enter:
                        </p>
                        <div className="quiz-code-display" style={{
                            fontSize: '3rem',
                            fontWeight: '900',
                            letterSpacing: '5px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '20px',
                            borderRadius: '16px',
                            display: 'inline-block',
                            marginBottom: '40px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {currentLesson.quiz_code || 'N/A'}
                        </div>
                        <br />
                        <button
                            onClick={() => navigate(`/play?code=${currentLesson.quiz_code}`)}
                            className="btn-take-quiz"
                            style={{
                                padding: '15px 40px',
                                borderRadius: '12px',
                                background: '#818cf8',
                                border: 'none',
                                color: '#fff',
                                fontWeight: '800',
                                cursor: 'pointer',
                                fontSize: '1.1rem'
                            }}
                        >
                            Enter Quiz Room
                        </button>
                    </div>
                );

            case 'text':
            default:
                return (
                    <div className="text-content">
                        <div className="content-body">
                            {currentLesson.content_text?.split('\n').map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="lms-page">
                <div className="loading-state" style={{ height: '100vh' }}>
                    <div className="spinner"></div>
                    <p>Loading lesson...</p>
                </div>
            </div>
        );
    }

    if (!currentLesson) {
        return (
            <div className="lms-page">
                <div className="empty-state" style={{ height: '100vh' }}>
                    <BookOpen size={64} />
                    <h3>Lesson not found</h3>
                    <Link to={`/courses/${courseId}`}>Back to Course</Link>
                </div>
            </div>
        );
    }

    const currentIdx = getCurrentIndex();
    const hasPrev = currentIdx > 0;
    const hasNext = course && currentIdx < course.lessons.length - 1;

    return (
        <div className="lms-page lesson-viewer-page">
            {/* Top Navigation */}
            <header className="lesson-header">
                <Link to={`/courses/${courseId}`} className="back-link">
                    <ChevronLeft size={20} /> {course?.title}
                </Link>
                <div className="lesson-progress-indicator">
                    <span>{currentIdx + 1} / {course?.lessons?.length}</span>
                </div>
            </header>

            {/* Lesson Content */}
            <main className="lesson-main">
                <div className="lesson-title-bar">
                    <h1>{currentLesson.title}</h1>
                    <span className="content-type-badge">{currentLesson.content_type?.toUpperCase()}</span>
                </div>

                <div className="lesson-content-area">
                    {renderContent()}
                </div>
            </main>

            {/* Bottom Navigation */}
            <footer className="lesson-footer">
                <button
                    className="nav-btn prev"
                    onClick={() => navigateLesson('prev')}
                    disabled={!hasPrev}
                >
                    <ChevronLeft size={20} /> Previous
                </button>

                <button
                    className={`btn-complete ${isCompleted ? 'completed' : ''} ${isOwner ? 'admin-mode-btn' : ''}`}
                    onClick={() => !isOwner && markComplete()}
                    disabled={completing || isCompleted || isOwner || (!canComplete && !isCompleted)}
                    title={
                        isOwner ? "Teachers cannot track progress on their own courses" :
                            isCompleted ? "Already completed" :
                                !canComplete ? completionMsg : "Mark this lesson as complete"
                    }
                    style={{ opacity: (!canComplete && !isCompleted && !isOwner) ? 0.6 : 1 }}
                >
                    {isOwner ? (
                        <><Shield size={20} /> Admin Mode</>
                    ) : isCompleted ? (
                        <><Check size={20} /> Completed</>
                    ) : completing ? (
                        'Saving...'
                    ) : !canComplete ? (
                        <span>Locked (Finish Content)</span>
                    ) : (
                        <><Check size={20} /> Mark Complete</>
                    )}
                </button>

                <button
                    className="nav-btn next"
                    onClick={() => {
                        if (hasNext) navigateLesson('next');
                        else navigate(`/courses/${courseId}`);
                    }}
                >
                    {hasNext ? (
                        <>Next <ChevronRight size={20} /></>
                    ) : (
                        <>Finish Course <Home size={20} style={{ marginLeft: '8px' }} /></>
                    )}
                </button>
            </footer>

            {/* AI Tutor Chat Sidebar */}
            <AIChatTutor
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                lesson={currentLesson}
                courseTitle={course?.title}
            />

            {!isChatOpen && (
                <button className="fab-ai-tutor" onClick={() => setIsChatOpen(true)} title="Ask AI Tutor">
                    <Bot size={24} />
                    <Sparkles size={12} className="sparkle-icon" />
                </button>
            )}

            {!isCommunityOpen && (
                <button className="fab-community" onClick={() => setIsCommunityOpen(true)} title="Course Community">
                    <Users size={24} />
                </button>
            )}

            <CourseCommunity
                isOpen={isCommunityOpen}
                onClose={() => setIsCommunityOpen(false)}
                courseId={courseId}
                courseTitle={course?.title}
            />

            <style jsx>{`
                .fab-ai-tutor {
                    position: fixed;
                    bottom: 100px;
                    right: 30px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 100;
                }

                .fab-ai-tutor:hover {
                    transform: scale(1.1) rotate(5deg);
                    box-shadow: 0 15px 35px rgba(99, 102, 241, 0.6);
                }

                .fab-community {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #2dd4bf);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 100;
                }

                .fab-community:hover {
                    transform: scale(1.1) rotate(-5deg);
                    box-shadow: 0 15px 35px rgba(59, 130, 246, 0.6);
                }

                .sparkle-icon {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

/**
 * Sub-component for the AI Chat Sidebar
 */
function AIChatTutor({ isOpen, onClose, lesson, courseTitle }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `Hi! I'm your AI Tutor for **${lesson?.title}**. How can I help you understand this lesson better?`
            }]);
        }
    }, [isOpen, lesson]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const systemContext = `
                You are a helpful AI Tutor on the Zedny Educational Platform. 
                You are helping a student with the lesson: "${lesson.title}" from the course "${courseTitle}".
                
                Lesson Content Reference:
                ${lesson.content_text || "No direct text content provided. Help them based on the title and general knowledge of the topic."}
                
                Keep your explanations clear, educational, and encouraging. Focus on the context above.
            `;

            const res = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    system_context: systemContext
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. 😓" }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ai-tutor-drawer ${isOpen ? 'open' : ''}`}>
            <div className="drawer-header">
                <div className="bot-info">
                    <Bot size={18} />
                    <span>AI Tutor</span>
                </div>
                <button onClick={onClose}><X size={20} /></button>
            </div>

            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.role}`}>
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div className="chat-bubble assistant typing">
                        <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Ask a question..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={!input.trim() || loading}>
                    <Send size={18} />
                </button>
            </form>

            <style jsx>{`
                .ai-tutor-drawer {
                    position: fixed;
                    top: 0;
                    right: -400px;
                    width: 380px;
                    height: 100vh;
                    background: rgba(15, 15, 20, 0.95);
                    backdrop-filter: blur(20px);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    z-index: 1000;
                    transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    box-shadow: -20px 0 50px rgba(0, 0, 0, 0.5);
                }

                .ai-tutor-drawer.open { right: 0; }

                .drawer-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bot-info { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #a78bfa; }
                .drawer-header button { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .chat-bubble {
                    max-width: 85%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .chat-bubble.assistant {
                    align-self: flex-start;
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.9);
                    border-bottom-left-radius: 4px;
                }

                .chat-bubble.user {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .chat-input-area {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    gap: 12px;
                }

                .chat-input-area input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 10px 16px;
                    color: white;
                    outline: none;
                }

                .chat-input-area button {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .typing { display: flex; gap: 4px; padding: 12px 20px; }
                .typing .dot { width: 6px; height: 6px; background: rgba(255, 255, 255, 0.3); border-radius: 50%; animation: pulse-typing 1s infinite; }
                .typing .dot:nth-child(2) { animation-delay: 0.2s; }
                .typing .dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes pulse-typing { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); opacity: 1; } }
            `}</style>
        </div>
    );
}
