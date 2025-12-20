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

    // Password Visibility Toggle
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const { showNotification } = useNotification();

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
                    <button type="button" className="btn-social">G</button>
                    <button type="button" className="btn-social">F</button>
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
        </div>
    );
}
