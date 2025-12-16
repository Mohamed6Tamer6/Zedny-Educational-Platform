import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <div className="bg-gradient"></div>

            {/* Navbar */}
            <nav className="navbar">
                <Link to="/dashboard" className="logo">Zedny<span className="dot">.</span></Link>
                <div className="nav-right">
                    <span className="user-name">{user?.full_name || user?.email || 'User'}</span>
                    <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-page">
                {/* Left Column */}
                <div className="dashboard-left">
                    <h1 className="welcome-title">
                        Welcome to <span className="highlight">Zedny</span>
                    </h1>
                    <p className="welcome-description">
                        Zedny is an innovative <strong>e-learning platform</strong> designed to make education
                        interactive, engaging, and fun. Create dynamic quizzes, host live game
                        sessions, and transform learning into an exciting experience.
                    </p>

                    <div className="feature-cards">
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-rocket"></i></div>
                            <h3>Interactive Quizzes</h3>
                            <p>Create engaging quizzes with multiple question types</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-users"></i></div>
                            <h3>Live Sessions</h3>
                            <p>Host real-time quiz games with your students</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-chart-line"></i></div>
                            <h3>Instant Feedback</h3>
                            <p>Get immediate results and track performance</p>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <Link to="/create-quiz" className="btn-primary">
                            <i className="fas fa-plus"></i> Get Started
                        </Link>
                        <Link to="/quizzes" className="btn-secondary">
                            <i className="fas fa-arrow-right"></i> View Quizzes
                        </Link>
                    </div>
                </div>

                {/* Right Column */}
                <div className="dashboard-right">
                    <div className="floating-card card-questions">
                        <div className="card-icon"><i className="fas fa-question"></i></div>
                        <span>Questions</span>
                    </div>
                    <div className="floating-card card-achievements">
                        <div className="card-icon"><i className="fas fa-trophy"></i></div>
                        <span>Achievements</span>
                    </div>
                    <div className="floating-card card-points">
                        <div className="card-icon"><i className="fas fa-star"></i></div>
                        <span>Points</span>
                    </div>
                </div>
            </main>
        </>
    );
}
