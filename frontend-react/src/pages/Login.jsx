/**
 * =============================================================================
 * Login Page Component
 * =============================================================================
 * Handles user authentication - both login and registration in one component.
 * Uses a toggle between "Sign in" and "Sign up" modes.
 * 
 * Features:
 * - Email/password authentication
 * - Toggle between login and registration
 * - Password visibility toggle
 * - Auto-login after successful registration
 * - Form validation
 * - Error handling with notifications
 * 
 * API Endpoints Used:
 * - POST /auth/login: Authenticate existing user
 * - POST /auth/register: Create new account
 * - GET /auth/me: Fetch user details after login
 * 
 * State:
 * - isLogin: Toggle between login/signup modes
 * - loading: Form submission in progress
 * - Form fields: email, password, firstName, lastName, role
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { GraduationCap, School } from 'lucide-react';
// Import the External CSS
import '../styles/Login.css';

const API_URL = '/api/v1';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('STUDENT');

    const [showPassword, setShowPassword] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [socialProvider, setSocialProvider] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();
    const { showNotification } = useNotification();

    const handleSocialAuth = (provider) => {
        setSocialProvider(provider);
        setIsSocialModalOpen(true);
    };

    const selectSocialAccount = (selectedEmail) => {
        setIsSocialModalOpen(false);
        setIsLogin(false); // Switch to Sign Up mode
        setEmail(selectedEmail);
        showNotification(`Connected with ${socialProvider} (${selectedEmail}). Now set your account password.`, 'success');

        // Auto-focus password field after a short delay
        setTimeout(() => {
            const pwdInput = document.querySelector('input[type="password"]');
            if (pwdInput) pwdInput.focus();
        }, 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // Login Flow
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        username: email,
                        password: password
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Fetch user details
                    const userResponse = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });

                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        login(data.access_token, userData);
                        showNotification('Welcome back!', 'success');

                        // Redirect based on role not needed here if App.jsx handles it via route guard on /dashboard
                        navigate('/dashboard');
                    } else {
                        throw new Error('Failed to fetch user details');
                    }
                } else {
                    const error = await response.json();
                    throw new Error(error.detail || 'Login failed');
                }
            } else {
                // Sign Up Flow
                const registerResponse = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        full_name: `${firstName} ${lastName}`.trim(),
                        role: role
                    })
                });

                if (!registerResponse.ok) {
                    const error = await registerResponse.json();
                    throw new Error(error.detail || 'Registration failed');
                }

                // Auto login after registration
                const loginResponse = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        username: email,
                        password: password
                    })
                });

                if (loginResponse.ok) {
                    const data = await loginResponse.json();

                    // Fetch user details
                    const userResponse = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });

                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        login(data.access_token, userData);
                        showNotification('Account created successfully!', 'success');
                        navigate('/dashboard');
                    } else {
                        setIsLogin(true);
                        showNotification('Account created! Please log in.', 'success');
                    }
                } else {
                    setIsLogin(true);
                    showNotification('Account created! Please log in.', 'success');
                }
            }
        } catch (err) {
            console.error(err);
            showNotification(err.message || 'An error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Background Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            <div className="auth-card">
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                        type="button"
                    >
                        Sign up
                    </button>
                    <button
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                        type="button"
                    >
                        Sign in
                    </button>
                </div>

                <div className="auth-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <h1 className="auth-title" style={{ margin: '0 0 10px 0' }}>
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                        {isLogin ? 'Enter your details to access your account' : 'Start your learning journey today'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="form-row">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ color: 'white', marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', opacity: 0.8 }}>I am a:</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div
                                        onClick={() => setRole('STUDENT')}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            border: role === 'STUDENT' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                            backgroundColor: role === 'STUDENT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                            padding: '15px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <GraduationCap size={24} color={role === 'STUDENT' ? '#3b82f6' : 'rgba(255,255,255,0.7)'} />
                                        <span style={{ fontSize: '0.9rem', color: role === 'STUDENT' ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: role === 'STUDENT' ? '500' : 'normal' }}>Student</span>
                                    </div>

                                    <div
                                        onClick={() => setRole('TEACHER')}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            border: role === 'TEACHER' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                            backgroundColor: role === 'TEACHER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                            padding: '15px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <School size={24} color={role === 'TEACHER' ? '#3b82f6' : 'rgba(255,255,255,0.7)'} />
                                        <span style={{ fontSize: '0.9rem', color: role === 'TEACHER' ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: role === 'TEACHER' ? '500' : 'normal' }}>Teacher</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </form>

                <div className="divider">
                    OR SIGN IN WITH
                </div>

                <div className="social-buttons">
                    <button type="button" className="btn-social google" onClick={() => handleSocialAuth('Google')}>
                        <span className="social-icon">G</span>
                        <span className="social-text">Continue with Google</span>
                    </button>
                    <button type="button" className="btn-social facebook" onClick={() => handleSocialAuth('Facebook')}>
                        <span className="social-icon">F</span>
                        <span className="social-text">Continue with Facebook</span>
                    </button>
                </div>

                <div className="auth-footer" style={{ marginTop: '20px' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </span>
                </div>
            </div>
            {/* Social OAuth Simulation Modal */}
            {isSocialModalOpen && (
                <div className="modal-overlay">
                    <div className="social-modal glassmorphism animate-in">
                        <div className="modal-header">
                            <div className="provider-logo">{socialProvider[0]}</div>
                            <h3>Sign in with {socialProvider}</h3>
                            <p>Choose an account to continue to <strong>Zedny</strong></p>
                        </div>
                        <div className="account-list">
                            {[
                                { name: 'Mohamed Ali', email: 'mohamed.ali@gmail.com' },
                                { name: 'Guest Student', email: 'student.zedny@outlook.com' },
                                { name: 'Demo Teacher', email: 'teacher.demo@gmail.com' }
                            ].map((acc, i) => (
                                <div key={i} className="account-item" onClick={() => selectSocialAccount(acc.email)}>
                                    <div className="acc-avatar">{acc.name[0]}</div>
                                    <div className="acc-info">
                                        <span className="acc-name">{acc.name}</span>
                                        <span className="acc-email">{acc.email}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="account-item use-another" onClick={() => setIsSocialModalOpen(false)}>
                                <div className="acc-avatar">+</div>
                                <div className="acc-info">
                                    <span className="acc-name">Use another account</span>
                                </div>
                            </div>
                        </div>
                        <p className="modal-footer-text">
                            To continue, {socialProvider} will share your name, email address, and profile picture with Zedny.
                        </p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }
                .social-modal {
                    width: 100%;
                    max-width: 400px;
                    padding: 32px;
                    border-radius: 24px;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .animate-in {
                    animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .provider-logo {
                    width: 48px;
                    height: 48px;
                    background: #fff;
                    color: #000;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 900;
                    margin: 0 auto 16px;
                }
                .account-list {
                    margin: 24px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .account-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: 0.2s;
                }
                .account-item:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateX(4px);
                }
                .acc-avatar {
                    width: 36px;
                    height: 36px;
                    background: #818cf8;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }
                .acc-name { display: block; font-size: 0.9rem; font-weight: 600; }
                .acc-email { display: block; font-size: 0.75rem; opacity: 0.5; }
                .modal-footer-text { font-size: 0.7rem; opacity: 0.4; line-height: 1.4; }
                
                .social-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; }
                .btn-social {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    cursor: pointer;
                    font-weight: 600;
                    transition: 0.3s;
                }
                .btn-social:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                .social-icon { font-weight: 900; font-size: 1.2rem; width: 20px; }
            `}</style>
        </div>
    );
}
