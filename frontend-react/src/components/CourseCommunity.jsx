import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Users, MessageSquare, Shield, User, File, Download, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

/**
 * CourseCommunity Component
 * An expandable, full-screen community chat hub for course discussions.
 */
export default function CourseCommunity({ isOpen, onClose, courseId, courseTitle }) {
    const { token, user } = useAuth();
    const { showNotification } = useNotification();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);

    // Check if current user is teacher (admin of this course context)
    // Note: This logic assumes if they have role 'TEACHER', they are authorized. 
    // Ideally check if they are THE teacher of the course, but simpler for now as per instructions "teacher can upload".
    const canUpload = user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

    const handleFileUpload = async (file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch('/api/v1/uploads/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                // Send message with PDF format convention: [PDF]|URL|FILENAME
                const pdfContent = `[PDF]|${data.url}|${file.name}`;
                await sendMessage(pdfContent);
            } else {
                showNotification('Failed to upload PDF', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Upload error', 'error');
        } finally {
            setUploading(false);
        }
    };

    const sendMessage = async (content) => {
        try {
            const res = await fetch(`/api/v1/courses/${courseId}/community/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => [...prev, newMessage]);
            } else {
                showNotification('Failed to send message', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        }
    };

    useEffect(() => {
        if (isOpen && courseId) {
            fetchMessages();
            // Optional: Set up polling
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, courseId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/v1/courses/${courseId}/community/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching community messages:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const content = input.trim();
        setInput('');
        setLoading(true);
        await sendMessage(content);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="community-overlay">
            <div className="community-container glassmorphism">
                <header className="community-header">
                    <div className="header-left">
                        <div className="community-icon">
                            <Users size={24} />
                        </div>
                        <div className="title-group">
                            <h3>Course Community</h3>
                            <span className="course-name">{courseTitle}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </header>

                <div className="community-body">
                    <div className="messages-area">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                <MessageSquare size={48} />
                                <p>Welcome to the community! Be the first to start a discussion.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.user_id === user.id;
                                const isAdmin = msg.user_role === 'TEACHER' || msg.user_role === 'SUPER_ADMIN';

                                return (
                                    <div key={msg.id || idx} className={`message-row ${isMe ? 'mine' : 'others'}`}>
                                        <div className="msg-avatar">
                                            {isAdmin ? <Shield size={16} /> : <User size={16} />}
                                        </div>
                                        <div className="msg-bubble">
                                            <div className="msg-info">
                                                <span className="user-name">
                                                    {isAdmin ? 'Admin' : msg.user_name}
                                                    {isAdmin && <span className="admin-badge">Teacher</span>}
                                                </span>
                                                <span className="msg-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="msg-content">
                                                {msg.content.startsWith('[PDF]|') ? (
                                                    (() => {
                                                        const parts = msg.content.split('|');
                                                        const url = parts[1];
                                                        const name = parts[2] || 'Document.pdf';
                                                        return (
                                                            <div className="pdf-attachment">
                                                                <div className="pdf-icon">
                                                                    <File size={24} />
                                                                </div>
                                                                <div className="pdf-details">
                                                                    <span className="pdf-name">{name}</span>
                                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-download-link">
                                                                        Download PDF <Download size={14} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="community-footer">
                    {canUpload && (
                        <div className="upload-btn-wrapper">
                            <input
                                type="file"
                                id="community-pdf-upload"
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e.target.files[0])}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                            <button
                                className="icon-btn"
                                onClick={() => document.getElementById('community-pdf-upload').click()}
                                title="Upload PDF"
                                disabled={uploading}
                            >
                                {uploading ? <div className="spinner-small"></div> : <Paperclip size={20} />}
                            </button>
                        </div>
                    )}
                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Type a message to the community..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={!input.trim() || loading}>
                            <Send size={20} />
                        </button>
                    </form>
                </footer>
            </div>

            <style jsx>{`
                .community-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }

                .community-container {
                    width: 95%;
                    max-width: 1000px;
                    height: 90vh;
                    background: rgba(15, 15, 20, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7);
                }

                .community-header {
                    padding: 24px 32px;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-left { display: flex; align-items: center; gap: 20px; }

                .community-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
                }

                .title-group h3 { margin: 0; font-size: 1.4rem; color: #fff; }
                .course-name { font-size: 0.9rem; color: rgba(255, 255, 255, 0.4); }

                .close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: #fff;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .close-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; transform: rotate(90deg); }

                .community-body {
                    flex: 1;
                    padding: 32px;
                    overflow-y: auto;
                    background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent);
                }

                .messages-area {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .empty-chat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    color: rgba(255, 255, 255, 0.2);
                    gap: 20px;
                }

                .message-row { display: flex; gap: 16px; max-width: 80%; }
                .message-row.mine { align-self: flex-end; flex-direction: row-reverse; }
                .message-row.others { align-self: flex-start; }

                .msg-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.4);
                    flex-shrink: 0;
                }

                .mine .msg-avatar { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
                .others .msg-avatar { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

                .msg-bubble {
                    background: rgba(255, 255, 255, 0.04);
                    padding: 16px 20px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .mine .msg-bubble { background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1)); border-color: rgba(139, 92, 246, 0.2); border-bottom-right-radius: 4px; }
                .others .msg-bubble { border-bottom-left-radius: 4px; }

                .msg-info { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 8px; font-size: 0.8rem; }
                .user-name { font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
                .admin-badge { background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; }
                .msg-time { color: rgba(255, 255, 255, 0.3); }

                .msg-content { color: rgba(255, 255, 255, 0.9); line-height: 1.6; font-size: 1rem; }

                .community-footer {
                    padding: 24px 32px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    background: rgba(0, 0, 0, 0.2);
                }

                .chat-input-form { display: flex; gap: 16px; }
                .chat-input-form input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 16px 24px;
                    color: #fff;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .chat-input-form input:focus { border-color: #3b82f6; background: rgba(255, 255, 255, 0.08); }

                .chat-input-form button {
                    width: 56px;
                    height: 56px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .chat-input-form button:hover:not(:disabled) { transform: scale(1.05) translateY(-2px); background: #2563eb; }
                .chat-input-form button:disabled { opacity: 0.5; cursor: not-allowed; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .pdf-attachment {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 10px 14px;
                    border-radius: 12px;
                    margin-top: 4px;
                }
                .pdf-icon {
                    color: #ef4444; /* red for pdf */
                    background: rgba(239, 68, 68, 0.1);
                    padding: 8px;
                    border-radius: 8px;
                }
                .pdf-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .pdf-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #fff;
                }
                .pdf-download-link {
                    font-size: 0.75rem;
                    color: #60a5fa;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    text-decoration: none;
                }
                .pdf-download-link:hover { text-decoration: underline; }
                
                .upload-btn-wrapper {
                    display: flex;
                    align-items: center;
                    margin-right: 12px;
                }
                .icon-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
