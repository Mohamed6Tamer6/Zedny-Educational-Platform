import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
// Import the External CSS
import '../styles/Login.css';

const API_URL = 'http://127.0.0.1:8000/api/v1';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

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
                        role: 'student'
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
                        // If fetching user fails, just show message and ask to login (fallback)
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
                {/* Close/Back Button - optional, functionality similar to existing app but user didn't explicitly ask for it here, keeping it simple or removed if not needed. 
                    However, original design had a close button in image 1? 
                    Image 1 shows an 'x' at top right. I'll add a simple one if it helps match 'theme'.
                */}
                {/* <button className="close-btn" onClick={() => navigate('/')}>×</button> */}

                {/* Toggle Tabs */}
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
                        {/* Eye Icon for password toggle provided by styles if needed, but simplistic approach here */}
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
                    <button type="button" className="btn-social">
                        G
                    </button>
                    <button type="button" className="btn-social">
                        F
                    </button>
                </div>

                <div className="auth-footer">
                    By creating an account, you agree to our <a href="#">Terms & Service</a>
                </div>

                <div className="auth-footer" style={{ marginTop: '10px' }}>
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



