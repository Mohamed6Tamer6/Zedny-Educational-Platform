/**
 * =============================================================================
 * Sign Up Page Component (Premium Redesign)
 * =============================================================================
 * Standalone registration page for new user account creation.
 * Fully aligned with the premium glassmorphism design of the login page.
 * 
 * Features:
 * - Stunning Dark Mode UI with animated background blobs
 * - Premium Glassmorphism card effect
 * - Interactive Icon-based Role Selection (Student/Teacher)
 * - Auto-login after successful registration
 * - Form validation with real-time feedback
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { GraduationCap, School, ArrowRight, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import '../styles/Login.css'; // Re-use the premium styles

const API_URL = '/api/v1';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [loading, setLoading] = useState(false);

    // UI States
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const { showNotification } = useNotification();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Register User
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

            // 2. Auto Login after registration
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

                // 3. Fetch user details to complete login
                const userResponse = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${data.access_token}`
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    login(data.access_token, userData);
                    showNotification('Welcome to Zedny! Account created successfully.', 'success');
                    navigate('/dashboard');
                } else {
                    showNotification('Account created! Please sign in.', 'success');
                    navigate('/login');
                }
            } else {
                showNotification('Account created! Please sign in.', 'success');
                navigate('/login');
            }
        } catch (err) {
            console.error(err);
            showNotification(err.message || 'An error occurred during registration.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Background Aesthetic Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="auth-title" style={{ margin: '0 0 10px 0' }}>Join Zedny</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', margin: 0 }}>
                        Create your account to start your journey
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSignUp}>
                    {/* Name Fields */}
                    <div className="form-row">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Role Selection - Premium Icons */}
                    <div className="input-group" style={{ color: 'white', marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', opacity: 0.8, fontWeight: '500' }}>
                            I am joining as a:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div
                                onClick={() => setRole('STUDENT')}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    border: role === 'STUDENT' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: role === 'STUDENT' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                    padding: '20px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: role === 'STUDENT' ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <GraduationCap size={28} color={role === 'STUDENT' ? '#3b82f6' : 'rgba(255,255,255,0.6)'} />
                                <span style={{ fontSize: '0.95rem', color: role === 'STUDENT' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Student</span>
                                {role === 'STUDENT' && <CheckCircle2 size={16} color="#3b82f6" style={{ position: 'absolute', top: 10, right: 10 }} />}
                            </div>

                            <div
                                onClick={() => setRole('TEACHER')}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    border: role === 'TEACHER' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: role === 'TEACHER' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                    padding: '20px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: role === 'TEACHER' ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <School size={28} color={role === 'TEACHER' ? '#3b82f6' : 'rgba(255,255,255,0.6)'} />
                                <span style={{ fontSize: '0.95rem', color: role === 'TEACHER' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Teacher</span>
                                {role === 'TEACHER' && <CheckCircle2 size={16} color="#3b82f6" style={{ position: 'absolute', top: 10, right: 10 }} />}
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (min 8 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        <div
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '16px' }}>
                        {loading ? 'Creating Account...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                Sign Up <ArrowRight size={18} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '32px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', borderBottom: '1px solid #fff' }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

