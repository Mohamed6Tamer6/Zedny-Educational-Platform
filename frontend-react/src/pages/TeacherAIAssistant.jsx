import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Sparkles, Send, Bot, User, Copy, Trash2, BotIcon, Plus, MessageSquare, History, Search, Menu, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TeacherAIAssistant() {
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isWideMode, setIsWideMode] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch chat history on mount
    useEffect(() => {
        fetchSessions();
    }, [token]);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/v1/ai/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    };

    const loadSessionMessages = async (sessionId) => {
        setIsLoading(true);
        setCurrentSessionId(sessionId);
        try {
            const res = await fetch(`/api/v1/ai/sessions/${sessionId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            } else {
                showNotification("Could not load chat history", "error");
            }
        } catch (err) {
            showNotification("Connection error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([
            {
                role: 'assistant',
                content: "Hello! I'm your Zedny AI assistant. I can help you design course outlines, write lesson content, or brainstorm quiz questions. What are we working on today?"
            }
        ]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: input,
                    history: messages.slice(-10), // Send last 10 messages for context
                    session_id: currentSessionId
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

                // If it was a new chat, update session ID and refresh list
                if (!currentSessionId && data.session_id) {
                    setCurrentSessionId(data.session_id);
                    fetchSessions();
                }
            } else {
                showNotification('AI service is currently unavailable. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Chat error:', error);
            showNotification('Connection error. Please check your internet.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (e, sessionId) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/v1/ai/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (currentSessionId === sessionId) {
                    handleNewChat();
                }
                showNotification("Chat history deleted", "success");
            }
        } catch (err) {
            showNotification("Failed to delete chat", "error");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showNotification('Content copied to clipboard!', 'success');
    };

    const isRTL = (text) => {
        const rtlChars = /[\u0600-\u06FF]/;
        return rtlChars.test(text);
    };

    // Initial message if nothing is loaded
    useEffect(() => {
        if (messages.length === 0 && !isLoading && !currentSessionId) {
            setMessages([
                {
                    role: 'assistant',
                    content: "Hello! I'm your Zedny AI assistant. I can help you design course outlines, write lesson content, or brainstorm quiz questions. What are we working on today?"
                }
            ]);
        }
    }, [messages]);

    return (
        <DashboardLayout fullWidth={isWideMode}>
            <div className="ai-layout-wrapper">
                {/* Sidebar */}
                <aside className={`ai-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <button className="new-chat-btn" onClick={handleNewChat}>
                            <Plus size={18} />
                            <span>New Conversation</span>
                        </button>
                    </div>

                    <div className="history-section">
                        <div className="section-label">
                            <History size={14} />
                            <span>RECENT HISTORY</span>
                        </div>
                        <div className="sessions-list">
                            {sessions.length === 0 ? (
                                <div className="no-history">No previous chats</div>
                            ) : (
                                sessions.map(session => (
                                    <div
                                        key={session.id}
                                        className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                                        onClick={() => loadSessionMessages(session.id)}
                                    >
                                        <MessageSquare size={16} className="msg-icon" />
                                        <span className="session-title">{session.title}</span>
                                        <button className="delete-session-btn" onClick={(e) => deleteSession(e, session.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className={`ai-main-content ${isWideMode ? 'is-wide-mode' : ''}`}>
                    <header className="ai-header">
                        <div className="ai-title">
                            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            <div className="ai-icon-bg">
                                <Sparkles className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <h1>AI Content <span className="gradient-text">Assistant</span></h1>
                                <p>Your intelligent partner for creating world-class educational content.</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button
                                className="toggle-wide-btn"
                                onClick={() => setIsWideMode(!isWideMode)}
                                title={isWideMode ? "Centered View" : "Full Width View"}
                            >
                                {isWideMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                <span className="btn-label">{isWideMode ? "Normal" : "Expand"}</span>
                            </button>
                        </div>
                    </header>

                    <div className="chat-window-p">
                        <div className="messages-container">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message-wrapper ${msg.role}`}>
                                    <div className={`message-avatar ${msg.role}`}>
                                        {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                                    </div>
                                    <div className={`message-bubble ${msg.role} ${isRTL(msg.content) ? 'rtl' : 'ltr'}`}>
                                        <div className="message-content">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                        {msg.role === 'assistant' && (
                                            <button
                                                className="copy-btn"
                                                onClick={() => copyToClipboard(msg.content)}
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message-wrapper assistant">
                                    <div className="message-avatar assistant">
                                        <Bot size={20} className="animate-pulse" />
                                    </div>
                                    <div className="message-bubble assistant loading">
                                        <div className="typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="input-area-container">
                            <form className="input-area" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    placeholder="Ask me for a course outline, lesson ideas, or content drafts..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
                                    {isLoading ? <div className="spinner-small" /> : <Send size={20} />}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .ai-layout-wrapper {
                    display: flex;
                    height: calc(100vh - 140px);
                    width: 100%;
                    background: rgba(15, 15, 20, 0.4);
                    border-radius: 24px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .is-wide-mode .ai-layout-wrapper {
                    border-radius: 0;
                    border: none;
                    height: calc(100vh - 120px);
                    background: rgba(10, 10, 15, 0.6);
                }

                .ai-sidebar {
                    width: 300px;
                    background: rgba(10, 10, 15, 0.8);
                    border-right: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }

                .ai-sidebar.closed {
                    width: 0;
                    opacity: 0;
                    transform: translateX(-20px);
                    pointer-events: none;
                }

                .sidebar-header {
                    padding: 24px;
                }

                .new-chat-btn {
                    width: 100%;
                    padding: 14px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 14px;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: 0.3s;
                    font-size: 0.95rem;
                    font-weight: 600;
                }

                .new-chat-btn:hover {
                    background: rgba(99, 102, 241, 0.1);
                    border-color: #6366f1;
                    color: #818cf8;
                }

                .history-section {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 12px 24px;
                }

                .section-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    padding: 20px 12px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .sessions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .session-item {
                    padding: 12px 14px;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: 0.2s;
                    position: relative;
                    color: rgba(255, 255, 255, 0.6);
                }

                .session-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .session-item.active {
                    background: rgba(99, 102, 241, 0.15);
                    color: #818cf8;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }

                .session-title {
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                }

                .delete-session-btn {
                    padding: 6px;
                    color: rgba(255, 255, 255, 0.2);
                    opacity: 0;
                    transition: 0.2s;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .session-item:hover .delete-session-btn {
                    opacity: 1;
                }

                .delete-session-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 6px;
                }

                .no-history {
                    padding: 20px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 0.85rem;
                    font-style: italic;
                }

                .ai-main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    background: rgba(15, 15, 20, 0.2);
                }

                .ai-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 30px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .toggle-wide-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 18px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 12px;
                    color: #818cf8;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .toggle-wide-btn:hover {
                    background: #6366f1;
                    color: #fff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
                }

                .toggle-wide-btn .btn-label {
                    display: inline-block;
                }

                .sidebar-toggle {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.2s;
                    margin-right: 16px;
                }

                .sidebar-toggle:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .ai-title {
                    display: flex;
                    align-items: center;
                }

                .ai-icon-bg {
                    width: 44px;
                    height: 44px;
                    background: rgba(168, 85, 247, 0.1);
                    border: 1px solid rgba(168, 85, 247, 0.2);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }

                .ai-title h1 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: 2px;
                }

                .ai-title p {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.85rem;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #818cf8, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .chat-window-p {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .messages-container {
                    flex: 1;
                    padding: 40px 30px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                /* Custom Scrollbar */
                .messages-container::-webkit-scrollbar, .history-section::-webkit-scrollbar {
                    width: 6px;
                }
                .messages-container::-webkit-scrollbar-track, .history-section::-webkit-scrollbar-track {
                    background: transparent;
                }
                .messages-container::-webkit-scrollbar-thumb, .history-section::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .messages-container::-webkit-scrollbar-thumb:hover, .history-section::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .message-wrapper {
                    display: flex;
                    gap: 20px;
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .is-wide-mode .message-wrapper {
                    max-width: 95%;
                }

                .message-wrapper.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }

                .message-avatar.assistant {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: #fff;
                }

                .message-avatar.user {
                    background: rgba(255, 255, 255, 0.08);
                    color: #cbd5e1;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .message-bubble {
                    padding: 20px 28px;
                    border-radius: 24px;
                    font-size: 1.05rem;
                    line-height: 1.7;
                    position: relative;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    max-width: calc(100% - 70px);
                }

                .message-bubble.rtl {
                    direction: rtl;
                    text-align: right;
                }

                .message-wrapper.assistant .message-bubble {
                    background: rgba(30, 30, 40, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-top-left-radius: 4px;
                    color: #e2e8f0;
                }

                .message-wrapper.user .message-bubble {
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: #fff;
                    border-top-right-radius: 4px;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
                }

                .message-content p { margin-bottom: 16px; }
                .message-content h1, .message-content h2, .message-content h3 {
                    margin: 24px 0 12px 0;
                    color: #fff;
                }
                .message-content code {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 3px 8px;
                    border-radius: 6px;
                    color: #fca5a5;
                }
                .message-content pre {
                    background: #0f111a;
                    padding: 24px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    margin: 20px 0;
                }

                .copy-btn {
                    position: absolute;
                    bottom: -32px;
                    right: 0;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 6px 14px;
                    border-radius: 8px;
                    transition: 0.2s;
                    opacity: 0;
                }

                .message-wrapper.assistant:hover .copy-btn { opacity: 1; }
                .copy-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }

                .input-area-container {
                    padding: 24px 40px 40px;
                    background: rgba(10, 10, 15, 0.9);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .input-area {
                    display: flex;
                    gap: 16px;
                    max-width: 950px;
                    margin: 0 auto;
                    transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .is-wide-mode .input-area {
                    max-width: 95%;
                }

                .input-area input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 18px 30px;
                    color: #fff;
                    outline: none;
                    transition: 0.3s;
                    font-size: 1.1rem;
                }

                .input-area input:focus {
                    border-color: #6366f1;
                    background: rgba(255, 255, 255, 0.06);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .send-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: #fff;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
                }

                .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }

                .typing-dots { display: flex; gap: 6px; padding: 4px 0; }
                .typing-dots span { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                    40% { transform: scale(1.1); opacity: 1; }
                }

                .spinner-small { width: 24px; height: 24px; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .ai-sidebar { width: 260px; }
                }

                @media (max-width: 768px) {
                    .ai-sidebar {
                        position: absolute;
                        z-index: 1000;
                        height: 100%;
                        width: 280px;
                        box-shadow: 20px 0 50px rgba(0,0,0,0.5);
                    }
                    .ai-sidebar.closed { transform: translateX(-100%); width: 280px; opacity: 1; }
                    .ai-header { padding: 16px 20px; }
                    .messages-container { padding: 20px; gap: 24px; }
                    .message-wrapper { gap: 12px; }
                    .message-bubble { padding: 16px 20px; font-size: 1rem; }
                    .input-area-container { padding: 16px 20px 30px; }
                }
            `}</style>
        </DashboardLayout>
    );
}
