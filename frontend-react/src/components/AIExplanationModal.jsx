import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Sparkles, Send, HelpCircle, User } from 'lucide-react';

/**
 * AIExplanationModal Component
 * Provides a premium, interactive chat interface for AI-powered mistake explanations.
 */
export default function AIExplanationModal({ isOpen, onClose, question, studentAnswer }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Initial explanation fetch
    useEffect(() => {
        if (isOpen && question && messages.length === 0) {
            fetchInitialExplanation();
        }
    }, [isOpen, question]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const fetchInitialExplanation = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/ai/explain-mistake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: question.id,
                    student_answer: studentAnswer,
                    history: []
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessages([{ role: 'assistant', content: data.reply }]);
            } else {
                setError(data.detail || 'Failed to get explanation');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');

        // Add user message to UI
        const newHistory = [...messages, { role: 'user', content: userMsg }];
        setMessages(newHistory);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/ai/explain-mistake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: question.id,
                    student_answer: studentAnswer,
                    history: newHistory
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setError(data.detail || 'Failed to get reply');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ai-modal-overlay">
            <div className="ai-modal-content glassmorphism">
                <header className="ai-modal-header">
                    <div className="title-with-icon">
                        <div className="bot-avatar">
                            <Bot size={20} />
                            <div className="active-dot"></div>
                        </div>
                        <div>
                            <h3>AI Tutor Chat</h3>
                            <span className="subtitle">Analyzing your choice • PDF Context Active</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="ai-modal-body">
                    {/* Question Context Card */}
                    <div className="context-card">
                        <div className="q-badge">Target Question</div>
                        <p className="q-text">{question.text}</p>
                        <div className="answer-row">
                            <div className="ans-item">
                                <span className="label">Your Choice:</span>
                                <span className="val wrong">{studentAnswer}</span>
                            </div>
                        </div>
                    </div>

                    <div className="chat-container">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg-bubble ${m.role}`}>
                                <div className="msg-icon">
                                    {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                                </div>
                                <div className="msg-content">
                                    {m.content.split('\n').map((line, j) => (
                                        <p key={j}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="msg-bubble assistant typing">
                                <div className="msg-icon"><Bot size={14} /></div>
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="ai-error">
                                <HelpCircle size={20} />
                                <p>{error}</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="ai-modal-footer">
                    <form className="chat-input-row" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Ask a follow-up question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={!input.trim() || loading}>
                            <Send size={18} />
                        </button>
                    </form>
                    <p className="footer-note">Grounded in Lesson PDF • Powered by Zedny AI</p>
                </footer>
            </div>

            <style jsx>{`
                .ai-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                }

                .ai-modal-content {
                    width: 90%;
                    max-width: 650px;
                    height: 85vh;
                    background: rgba(20, 20, 25, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 28px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .ai-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bot-avatar {
                    position: relative;
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .active-dot {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 10px;
                    height: 10px;
                    background: #22c55e;
                    border: 2px solid #000;
                    border-radius: 50%;
                }

                .title-with-icon {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .title-with-icon h3 { margin: 0; font-size: 1rem; font-weight: 700; }
                .subtitle { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }

                .close-btn { background: none; border: none; color: rgba(255, 255, 255, 0.3); cursor: pointer; transition: 0.2s; }
                .close-btn:hover { color: #fff; transform: rotate(90deg); }

                .ai-modal-body {
                    padding: 24px;
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .context-card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    flex-shrink: 0;
                }

                .q-badge {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: #818cf8;
                    margin-bottom: 6px;
                }

                .q-text { font-size: 0.95rem; line-height: 1.5; margin-bottom: 12px; color: rgba(255, 255, 255, 0.9); }
                .ans-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
                .ans-item .label { color: rgba(255, 255, 255, 0.4); }
                .ans-item .val.wrong { color: #ef4444; font-weight: 600; }

                .chat-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .msg-bubble {
                    display: flex;
                    gap: 12px;
                    max-width: 90%;
                    animation: slideUp 0.3s ease-out;
                }

                .msg-bubble.assistant { align-self: flex-start; }
                .msg-bubble.user { align-self: flex-end; flex-direction: row-reverse; }

                .msg-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.5);
                }

                .msg-bubble.assistant .msg-icon { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
                .msg-bubble.user .msg-icon { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

                .msg-content {
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }

                .msg-bubble.assistant .msg-content {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.95);
                    border-top-left-radius: 4px;
                }

                .msg-bubble.user .msg-content {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    border-top-right-radius: 4px;
                }

                .msg-content p { margin-bottom: 8px; }
                .msg-content p:last-child { margin-bottom: 0; }

                .chat-input-row {
                    display: flex;
                    gap: 12px;
                    padding: 20px 24px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .chat-input-row input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    outline: none;
                    transition: all 0.2s;
                }

                .chat-input-row input:focus { border-color: #6366f1; background: rgba(255, 255, 255, 0.08); }

                .chat-input-row button {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .chat-input-row button:hover:not(:disabled) { transform: scale(1.05); background: #4f46e5; }
                .chat-input-row button:disabled { opacity: 0.5; cursor: not-allowed; }

                .footer-note { font-size: 0.65rem; color: rgba(255, 255, 255, 0.2); text-align: center; margin-top: 10px; text-transform: uppercase; }

                .typing-dots { display: flex; gap: 4px; padding: 10px; }
                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: #818cf8;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
