import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, BookOpen, User as UserIcon, Settings } from 'lucide-react';
import '../styles/Dashboard.css';

/**
 * DashboardLayout - A wrapper component that provides consistent 
 * navigation and styling for all dashboard types.
 */
export default function DashboardLayout({ children, activeTab }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const normalizedRole = user?.role?.toUpperCase();
    const isTeacher = normalizedRole === 'TEACHER';
    const isStudent = normalizedRole === 'STUDENT';
    const isSuperAdmin = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN';

    return (
        <div className="dashboard-container">
            <div className="bg-gradient"></div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-left-brand">
                    <Link to="/dashboard" className="logo">Zedny<span className="dot">.</span></Link>
                </div>

                <div className="nav-center-links">
                    {/* Common link for all */}
                    <Link
                        to="/dashboard"
                        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    >
                        Dashboard
                    </Link>

                    {/* Teacher specific */}
                    {isTeacher && (
                        <>
                            <Link
                                to="/quizzes"
                                className={`nav-link ${location.pathname === '/quizzes' ? 'active' : ''}`}
                            >
                                My Quizzes
                            </Link>
                            <Link
                                to="/create-quiz"
                                className={`nav-link ${location.pathname === '/create-quiz' ? 'active' : ''}`}
                            >
                                Create Quiz
                            </Link>
                        </>
                    )}

                    {/* Student specific results */}
                    {isStudent && !isTeacher && (
                        <Link
                            to="/my-performance"
                            className={`nav-link ${location.pathname === '/my-performance' ? 'active' : ''}`}
                        >
                            My Performance
                        </Link>
                    )}
                </div>

                <div className="nav-right">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info-h">
                            <span className="user-name-h">{user?.full_name || 'User'}</span>
                            <span className="user-role-tag">{user?.role?.toLowerCase()}</span>
                        </div>
                    </div>
                    <button className="btn-logout-icon" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="dashboard-main-content">
                {children}
            </main>

            <style jsx>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #0a0a0f;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                }

                .dashboard-main-content {
                    padding: 100px 40px 40px;
                    flex: 1;
                    z-index: 1;
                    max-width: 1400px;
                    width: 100%;
                    margin: 0 auto;
                }

                .nav-left-brand {
                    flex: 1;
                }

                .nav-center-links {
                    flex: 2;
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                }

                .nav-link {
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    font-size: 0.95rem;
                    font-weight: 500;
                    transition: 0.2s;
                    position: relative;
                }

                .nav-link:hover {
                    color: #fff;
                }

                .nav-link.active {
                    color: #fff;
                }

                .nav-link.active::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #6366f1;
                    border-radius: 2px;
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-right: 15px;
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: #fff;
                    font-size: 0.9rem;
                }

                .user-info-h {
                    display: flex;
                    flex-direction: column;
                }

                .user-name-h {
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .user-role-tag {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 0.5px;
                }

                .btn-logout-icon {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    border-radius: 8px;
                    transition: 0.2s;
                }

                .btn-logout-icon:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                @media (max-width: 768px) {
                    .nav-center-links {
                        display: none;
                    }
                    .dashboard-main-content {
                        padding: 100px 20px 20px;
                    }
                }
            `}</style>
        </div>
    );
}
