import { useState, useEffect } from 'react';
import { X, Send, Star, MessageSquare, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const API_Base_URL = '/api/v1';

export default function CourseFeedback({ isOpen, onClose, courseId, isOwner }) {
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const [feedbackList, setFeedbackList] = useState([]);
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isOwner) {
            fetchFeedback();
        }
    }, [isOpen, isOwner]);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base_URL}/courses/${courseId}/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackList(data);
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_Base_URL}/courses/${courseId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, rating })
            });

            if (res.ok) {
                showNotification('Thank you for your feedback!', 'success');
                setContent('');
                onClose();
            } else {
                let errorMsg = 'Failed to submit feedback';
                try {
                    const err = await res.json();
                    errorMsg = err.detail || errorMsg;
                } catch (e) {
                    errorMsg = `Server error (${res.status}): ${res.statusText}`;
                }
                showNotification(errorMsg, 'error');
            }
        } catch (err) {
            console.error('Feedback Submit Error:', err);
            showNotification(`Network error: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="feedback-modal">
                <div className="modal-header">
                    <div className="header-title">
                        <MessageSquare size={20} className="text-blue-400" />
                        <h3>{isOwner ? 'Student Feedback' : 'Course Feedback'}</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-content">
                    {isOwner ? (
                        <div className="feedback-list-container">
                            <p className="admin-note">Identities are hidden to encourage honest feedback.</p>
                            {loading ? (
                                <div className="loading-feedback">Loading feedback...</div>
                            ) : feedbackList.length > 0 ? (
                                <div className="feedback-scroll">
                                    {feedbackList.map((f) => (
                                        <div key={f.id} className="feedback-card">
                                            <div className="feedback-meta">
                                                <div className="stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            fill={i < f.rating ? "#fbbf24" : "none"}
                                                            className={i < f.rating ? "text-yellow-400" : "text-gray-600"}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="date">{new Date(f.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="feedback-content">
                                                <Quote size={16} className="quote-icon" />
                                                <p>{f.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-feedback">
                                    <MessageSquare size={48} />
                                    <p>No feedback received yet.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="feedback-form">
                            <p>How do you find the course? Your feedback is anonymous and helps teachers improve.</p>

                            <div className="rating-selector">
                                <label>Rate the course:</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`star-btn ${s <= rating ? 'active' : ''}`}
                                            onClick={() => setRating(s)}
                                        >
                                            <Star size={24} fill={s <= rating ? "#fbbf24" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Your Thoughts:</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What did you like? What can be improved?"
                                    required
                                    rows={5}
                                />
                            </div>

                            <button type="submit" className="submit-feedback-btn" disabled={submitting}>
                                {submitting ? 'Sending...' : <><Send size={18} /> Send Feedback</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .feedback-modal {
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-title h3 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: #fff;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .close-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .modal-content {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                }

                .admin-note {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    margin-bottom: 20px;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .feedback-scroll {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .feedback-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 16px;
                }

                .feedback-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); }

                .feedback-content {
                    position: relative;
                }

                .quote-icon {
                    color: rgba(59, 130, 246, 0.2);
                    margin-bottom: 8px;
                }

                .feedback-content p {
                    margin: 0;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.8);
                }

                /* Form Styles */
                .feedback-form p {
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 24px;
                }

                .rating-selector {
                    margin-bottom: 24px;
                }

                .rating-selector label {
                    display: block;
                    margin-bottom: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }

                .star-rating {
                    display: flex;
                    gap: 12px;
                }

                .star-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #333;
                    transition: 0.2s;
                    padding: 0;
                }

                .star-btn.active { color: #fbbf24; }
                .star-btn:hover { transform: scale(1.1); }

                .input-group label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .input-group textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 16px;
                    color: #fff;
                    resize: vertical;
                    font-family: inherit;
                    transition: 0.2s;
                }

                .input-group textarea:focus {
                    border-color: #3b82f6;
                    outline: none;
                    background: rgba(0, 0, 0, 0.5);
                }

                .submit-feedback-btn {
                    margin-top: 24px;
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #3b82f6, #06b6d4);
                    border: none;
                    border-radius: 16px;
                    color: #fff;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .submit-feedback-btn:hover {
                    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }

                .submit-feedback-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .empty-feedback {
                    text-align: center;
                    padding: 60px 20px;
                    color: rgba(255, 255, 255, 0.2);
                }

                .empty-feedback p { margin-top: 16px; font-size: 1.1rem; }
            `}</style>
        </div>
    );
}
