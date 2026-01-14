import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    User, Mail, Lock, Award, BookOpen,
    Save, Key, Shield, AlertTriangle,
    CheckCircle, Camera, Edit3, Eye, EyeOff
} from 'lucide-react';

const API_Base_URL = '/api/v1';

export default function Profile() {
    const { user, token, logout, syncUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [stats, setStats] = useState({
        quizzes: 0,
        courses: 0,
        achievements: []
    });

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            // Fetch stats based on role
            const endpoint = user?.role === 'TEACHER'
                ? `${API_Base_URL}/quizzes/stats/teacher`
                : `${API_Base_URL}/quizzes/stats/student`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (user?.role === 'TEACHER') {
                    setStats({
                        quizzes: data.total_quizzes,
                        courses: data.total_courses || 0,
                        label: 'Quizzes Created'
                    });
                } else {
                    setStats({
                        quizzes: data.quizzes_taken,
                        label: 'Quizzes Taken',
                        score: data.avg_score
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const body = {
                full_name: formData.full_name
            };

            if (formData.new_password) {
                if (formData.new_password !== formData.confirm_password) {
                    showNotification("Passwords do not match", "error");
                    setIsUpdating(false);
                    return;
                }
                body.password = formData.new_password;
            }

            const res = await fetch(`${API_Base_URL}/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showNotification("Profile updated successfully", "success");
                // Update local storage if needed or just refresh
                setFormData(prev => ({ ...prev, new_password: '', confirm_password: '' }));
            } else {
                const err = await res.json();
                showNotification(err.detail || "Failed to update profile", "error");
            }
        } catch (err) {
            showNotification("Connection error", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            showNotification("Please select an image file", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification("Image must be smaller than 5MB", "error");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload the file
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const uploadRes = await fetch(`${API_Base_URL}/uploads/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataUpload
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const uploadData = await uploadRes.json();
            const avatarUrl = uploadData.url;

            // 2. Update the user profile
            const updateRes = await fetch(`${API_Base_URL}/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar_url: avatarUrl })
            });

            if (updateRes.ok) {
                showNotification("Profile picture updated", "success");
                await syncUser(token); // Refresh user data globally
            } else {
                showNotification("Failed to update profile picture", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Error uploading image", "error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="profile-container">
                <header className="profile-hero">
                    <div className="hero-backdrop"></div>
                    <div className="profile-id-section">
                        <div className="avatar-wrapper">
                            <div className="main-avatar">
                                {isUploading ? (
                                    <span className="loader-mini white"></span>
                                ) : user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" className="avatar-image" />
                                ) : (
                                    user?.full_name?.charAt(0) || 'U'
                                )}
                            </div>
                            <button
                                className="edit-avatar-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                title="Change Profile Picture"
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </div>
                        <div className="profile-basic-info">
                            <div className="role-badge">{user?.role}</div>
                            <h1>{user?.full_name}</h1>
                            <p>{user?.email}</p>
                        </div>
                    </div>

                    <div className="profile-stats-bar">
                        <div className="p-stat">
                            <span className="p-val">{stats.quizzes}</span>
                            <span className="p-label">{stats.label}</span>
                        </div>
                        <div className="p-divider"></div>
                        {user?.role === 'TEACHER' ? (
                            <div className="p-stat">
                                <span className="p-val">{stats.courses}</span>
                                <span className="p-label">Courses Active</span>
                            </div>
                        ) : (
                            <div className="p-stat">
                                <span className="p-val">{stats.score}%</span>
                                <span className="p-label">Average Score</span>
                            </div>
                        )}
                        <div className="p-divider"></div>
                        <div className="p-stat">
                            <span className="p-val">{user?.streak_count || 0}</span>
                            <span className="p-label">Day Streak</span>
                        </div>
                    </div>
                </header>

                <div className="profile-grid">
                    <section className="profile-main-card glassmorphism-p">
                        <div className="card-header">
                            <User size={20} className="text-purple-400" />
                            <h2>General Information</h2>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="form-group-r">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <Edit3 size={18} />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                            <div className="form-group-r disabled">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input type="email" value={formData.email} disabled />
                                </div>
                                <span className="input-hint">Email cannot be changed for security.</span>
                            </div>

                            <div className="card-divider"></div>

                            <div className="card-header mt-4">
                                <Lock size={20} className="text-blue-400" />
                                <h2>Security & Password</h2>
                            </div>

                            <div className="form-row-r">
                                <div className="form-group-r">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <Key size={18} />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.new_password}
                                            onChange={e => setFormData({ ...formData, new_password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password-btn"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group-r">
                                    <label>Confirm Password</label>
                                    <div className="input-with-icon">
                                        <Shield size={18} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.confirm_password}
                                            onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button type="submit" className="btn-save-profile" disabled={isUpdating}>
                                    {isUpdating ? <span className="loader-mini"></span> : <Save size={18} />}
                                    <span>{isUpdating ? 'Updating...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="profile-sidebar">
                        <div className="achievement-card glassmorphism-p">
                            <div className="card-header">
                                <Award size={20} className="text-gold" />
                                <h2>Achievements</h2>
                            </div>
                            <div className="achievements-list">
                                <div className="achievement-item">
                                    <div className="ach-icon green">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div className="ach-info">
                                        <h4>Verified Account</h4>
                                        <p>Your identity is confirmed.</p>
                                    </div>
                                </div>
                                {user?.streak_count > 5 && (
                                    <div className="achievement-item">
                                        <div className="ach-icon orange">
                                            <Award size={18} />
                                        </div>
                                        <div className="ach-info">
                                            <h4>Streak Master</h4>
                                            <p>Active for over 5 days!</p>
                                        </div>
                                    </div>
                                )}
                                <div className="achievement-item empty">
                                    <p>More achievements coming soon...</p>
                                </div>
                            </div>
                        </div>

                        <div className="notice-card glassmorphism-p warning">
                            <AlertTriangle size={24} />
                            <h3>Privacy Note</h3>
                            <p>Your profile information is only visible to you and the administrators of the platform.</p>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
                .profile-container {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    animation: fadeIn 0.6s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Hero Section */
                .profile-hero {
                    background: rgba(20, 20, 25, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    backdrop-filter: blur(20px);
                }

                .hero-backdrop {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
                    z-index: 0;
                }

                .profile-id-section {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    position: relative;
                    z-index: 1;
                }

                .avatar-wrapper {
                    position: relative;
                }

                .main-avatar {
                    width: 120px;
                    height: 120px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 900;
                    color: #fff;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .loader-mini.white {
                    border-color: rgba(255, 255, 255, 0.3);
                    border-top-color: #fff;
                }

                .edit-avatar-btn {
                    position: absolute;
                    bottom: -8px;
                    right: -8px;
                    width: 40px;
                    height: 40px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    transition: 0.2s;
                }

                .edit-avatar-btn:hover {
                    transform: scale(1.1);
                }

                .profile-basic-info h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 4px;
                    letter-spacing: -1px;
                }

                .profile-basic-info p {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1.1rem;
                }

                .role-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(168, 85, 247, 0.15);
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    border-radius: 100px;
                    color: #c084fc;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 12px;
                }

                .profile-stats-bar {
                    display: flex;
                    align-items: center;
                    gap: 60px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    width: fit-content;
                }

                .p-stat {
                    display: flex;
                    flex-direction: column;
                }

                .p-val {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #fff;
                }

                .p-label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }

                .p-divider {
                    width: 1px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Grid Content */
                .profile-grid {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    gap: 32px;
                }

                .profile-main-card {
                    padding: 40px;
                    border-radius: 32px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .card-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-group-r label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 8px;
                }

                .input-with-icon {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0 16px;
                    border-radius: 16px;
                    height: 54px;
                    transition: 0.3s;
                    color: rgba(255, 255, 255, 0.3);
                }

                .input-with-icon:focus-within {
                    border-color: #6366f1;
                    background: rgba(255, 255, 255, 0.08);
                    color: #6366f1;
                }

                .input-with-icon input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100%;
                    height: 100%;
                    outline: none;
                    font-size: 1rem;
                }

                .toggle-password-btn {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    margin-right: -8px;
                    transition: 0.2s;
                }

                .toggle-password-btn:hover {
                    color: #fff;
                }

                .form-group-r.disabled {
                    opacity: 0.7;
                }

                .input-hint {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.3);
                    margin-top: 6px;
                    display: block;
                }

                .form-row-r {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .card-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.05);
                    margin: 16px 0;
                }

                .btn-save-profile {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 16px 32px;
                    border-radius: 18px;
                    font-weight: 800;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
                    width: fit-content;
                    margin-top: 10px;
                }

                .btn-save-profile:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px rgba(255, 255, 255, 0.2);
                }

                .btn-save-profile:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Sidebar */
                .profile-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .achievement-card {
                    padding: 32px;
                    border-radius: 32px;
                }

                .achievements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .achievement-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .ach-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ach-icon.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .ach-icon.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }

                .ach-info h4 { font-size: 0.95rem; margin-bottom: 2px; }
                .ach-info p { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); }

                .achievement-item.empty {
                    text-align: center;
                    padding: 20px;
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 0.85rem;
                }

                .notice-card {
                    padding: 24px;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .notice-card.warning {
                    background: rgba(245, 158, 11, 0.05);
                    border-color: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                }

                .notice-card h3 { font-size: 1rem; font-weight: 700; color: #fff; }
                .notice-card p { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); line-height: 1.5; }

                .glassmorphism-p {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .text-gold { color: #f59e0b; }

                @media (max-width: 1024px) {
                    .profile-grid { grid-template-columns: 1fr; }
                    .form-row-r { grid-template-columns: 1fr; }
                    .profile-hero { padding: 30px; }
                    .profile-id-section { flex-direction: column; text-align: center; }
                    .profile-stats-bar { width: 100%; justify-content: space-around; gap: 20px; }
                }
            `}</style>
        </DashboardLayout>
    );
}
