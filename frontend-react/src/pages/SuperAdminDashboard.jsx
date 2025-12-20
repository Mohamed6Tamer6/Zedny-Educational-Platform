/**
 * =============================================================================
 * Super Admin Command Center Component
 * =============================================================================
 * This component provides a comprehensive oversight interface for system
 * administrators. It enables real-time monitoring of system health,
 * user management, and global quiz moderation.
 * 
 * Features:
 * - Real-time system telemetry (CPU, Memory, Logs)
 * - User Directory with role-based filtering
 * - Global Quiz Oversight with moderation capabilities
 * - Periodic background data synchronization
 * 
 * @module SuperAdminDashboard
 * @author Zedny Development Team
 * =============================================================================
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Shield, Users, BarChart, Settings, Database, Activity, RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const API_URL = '/api/v1';

export default function SuperAdminDashboard() {
    const { user, token } = useAuth();
    const { showNotification } = useNotification();
    const [stats, setStats] = useState({
        total_users: 0,
        total_quizzes: 0,
        system_uptime: '99.9%',
        total_attempts: 0,
        total_teachers: 0,
        total_students: 0
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [viewData, setViewData] = useState([]);
    const [healthData, setHealthData] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setViewData(await res.json());
            setActiveTab('users');
        } catch (err) {
            showNotification("Failed to fetch users", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/quizzes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setViewData(await res.json());
            setActiveTab('quizzes');
        } catch (err) {
            showNotification("Failed to fetch quizzes", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/health-detailed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHealthData(await res.json());
            setActiveTab('health');
        } catch (err) {
            showNotification("Failed to fetch health data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingUser)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setViewData(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                showNotification("User updated successfully", "success");
                setEditingUser(null);
            } else {
                showNotification("Failed to update user", "error");
            }
        } catch (err) {
            showNotification("Error updating user", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${API_URL}/admin/quizzes/${quizId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setViewData(prev => prev.filter(q => q.id !== quizId));
                showNotification("Quiz deleted successfully", "success");
            } else {
                showNotification("Failed to delete quiz", "error");
            }
        } catch (err) {
            showNotification("Error deleting quiz", "error");
        }
    };

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchStats();
            const interval = setInterval(fetchStats, 60000);
            return () => clearInterval(interval);
        }
    }, [token, activeTab]);

    const renderOverview = () => (
        <>
            <div className="admin-stats-grid">
                <div className="admin-stat-card glassmorphism">
                    <div className="stat-v">{stats.total_users.toLocaleString()}</div>
                    <div className="stat-l">Total Users ({stats.total_teachers}T / {stats.total_students}S)</div>
                </div>
                <div className="admin-stat-card glassmorphism">
                    <div className="stat-v">{stats.total_quizzes.toLocaleString()}</div>
                    <div className="stat-l">Active Quiz Sessions</div>
                </div>
                <div className="admin-stat-card glassmorphism">
                    <div className="stat-v">{stats.total_attempts.toLocaleString()}</div>
                    <div className="stat-l">Total Quiz Attempts</div>
                </div>
            </div>

            <div className="admin-tools-grid">
                <div className="tool-card glassmorphism">
                    <Users className="tool-icon" />
                    <h3>User Directory</h3>
                    <p>Manage all Teacher and Student accounts, permissions, and roles.</p>
                    <button className="tool-btn" onClick={fetchUsers}>Manage Directory</button>
                </div>

                <div className="tool-card glassmorphism">
                    <Database className="tool-icon" />
                    <h3>Quiz Oversight</h3>
                    <p>Access, edit, or delete any quiz content across the platform.</p>
                    <button className="tool-btn" onClick={fetchQuizzes}>Override Quizzes</button>
                </div>

                <div className="tool-card glassmorphism">
                    <Activity className="tool-icon" />
                    <h3>System Health</h3>
                    <p>Monitor server performance, API logs, and database status.</p>
                    <button className="tool-btn" onClick={fetchHealth}>View Health</button>
                </div>
            </div>
        </>
    );

    const renderUsers = () => (
        <div className="admin-view-panel glassmorphism">
            <div className="panel-header">
                <h2>User Directory <span className="count-badge">{viewData.length}</span></h2>
                <button className="btn-back" onClick={() => setActiveTab('overview')}>Back</button>
            </div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewData.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-initials">{u.full_name?.charAt(0) || 'U'}</div>
                                        <div className="user-details">
                                            <span className="n">{u.full_name}</span>
                                            <span className="e">{u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className={`role-tag ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                <td><span className={`status-tag ${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? 'Active' : 'Banned'}</span></td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn-action-s" onClick={() => setEditingUser(u)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderQuizzes = () => (
        <div className="admin-view-panel glassmorphism">
            <div className="panel-header">
                <h2>Quiz Oversight <span className="count-badge">{viewData.length}</span></h2>
                <button className="btn-back" onClick={() => setActiveTab('overview')}>Back</button>
            </div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Quiz Title</th>
                            <th>Author</th>
                            <th>Status</th>
                            <th>Questions</th>
                            <th>Attempts</th>
                            <th>Code</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewData.map(q => (
                            <tr key={q.id}>
                                <td>{q.title}</td>
                                <td>{q.teacher_name}</td>
                                <td><span className="status-tag active">Live</span></td>
                                <td>{q.question_count}</td>
                                <td>{q.attempt_count}</td>
                                <td className="font-mono">{q.access_code}</td>
                                <td>
                                    <button className="btn-action-s danger" onClick={() => handleDeleteQuiz(q.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderHealth = () => (
        <div className="admin-view-panel glassmorphism">
            <div className="panel-header">
                <h2>System Health</h2>
                <button className="btn-back" onClick={() => setActiveTab('overview')}>Back</button>
            </div>
            <div className="health-grid">
                <div className="health-card">
                    <label>CPU Usage</label>
                    <div className="progress-bar-w">
                        <div className="progress-fill" style={{ width: `${healthData?.cpu_usage || 0}%`, background: healthData?.cpu_usage > 70 ? '#ef4444' : '#22c55e' }}></div>
                    </div>
                    <span>{healthData?.cpu_usage}%</span>
                </div>
                <div className="health-card">
                    <label>Memory Usage</label>
                    <div className="stat-row">
                        <span>{healthData?.memory_usage?.toFixed(1)} MB</span>
                        <BarChart className="text-blue" size={20} />
                    </div>
                </div>
                <div className="health-card wide">
                    <label>System Logs</label>
                    <div className="log-window">
                        <div className="log-line">
                            <span className="log-ts">[{new Date().toLocaleTimeString()}]</span>
                            <span className="log-msg">{healthData?.last_log}</span>
                        </div>
                        <div className="log-line">
                            <span className="log-ts">[{new Date().toLocaleTimeString()}]</span>
                            <span className="log-msg">Database connection pool check: OK</span>
                        </div>
                        <div className="log-line">
                            <span className="log-ts">[{new Date().toLocaleTimeString()}]</span>
                            <span className="log-msg">API Route /api/v1/admin/health-detailed called by SUPER_ADMIN</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="admin-dashboard">
                <header className="admin-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="header-badge">
                                <Shield size={14} />
                                <span>Super Admin Access</span>
                            </div>
                            <h1>System <span className="highlight">Command Center</span></h1>
                            <p>Global oversight of the Zedny Educational Platform.</p>
                        </div>
                        {activeTab === 'overview' && (
                            <button
                                className="btn-refresh-admin glassmorphism"
                                onClick={() => { setLoading(true); fetchStats(); }}
                                disabled={loading}
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                <span>Refreshed every 60s</span>
                            </button>
                        )}
                    </div>
                </header>

                {loading && activeTab !== 'overview' ? (
                    <div className="loading-container">
                        <RefreshCw className="animate-spin" size={48} />
                        <p>Loading encrypted data...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'quizzes' && renderQuizzes()}
                        {activeTab === 'health' && renderHealth()}
                    </>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal glassmorphism">
                            <div className="modal-header">
                                <h3>Edit User Account</h3>
                                <button className="btn-close" onClick={() => setEditingUser(null)}>×</button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="admin-edit-form">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={editingUser.full_name}
                                        onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Account Role</label>
                                        <select
                                            value={editingUser.role}
                                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        >
                                            <option value="STUDENT">Student</option>
                                            <option value="TEACHER">Teacher</option>
                                            <option value="SUPER_ADMIN">Super Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Account Status</label>
                                        <select
                                            value={editingUser.is_active}
                                            onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Banned</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                                    <button type="submit" className="btn-save" disabled={isUpdating}>
                                        {isUpdating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>


            <style jsx>{`
                .admin-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    animation: slideUp 0.6s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .admin-header {
                    margin-bottom: 10px;
                }

                .header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 15px;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .admin-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 5px;
                }

                .highlight {
                    background: linear-gradient(135deg, #ef4444, #f59e0b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .admin-header p {
                    color: rgba(255, 255, 255, 0.5);
                }

                .btn-refresh-admin {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 15px;
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .btn-refresh-admin:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                }

                .animate-spin {
                    animation: spin 2s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }

                /* Admin Modals */
                .admin-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                }

                .admin-modal {
                    width: 100%;
                    max-width: 500px;
                    padding: 40px;
                    border-radius: 28px;
                    position: relative;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .modal-header h3 { font-size: 1.5rem; }

                .btn-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 2rem;
                    cursor: pointer;
                    transition: 0.2s;
                    line-height: 1;
                }

                .btn-close:hover { color: #fff; }

                .admin-edit-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .admin-edit-form input,
                .admin-edit-form select {
                    padding: 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    font-size: 1rem;
                    transition: 0.2s;
                }

                .admin-edit-form input:focus,
                .admin-edit-form select:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #ef4444;
                    outline: none;
                }

                .modal-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 10px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    cursor: pointer;
                }

                .btn-save {
                    flex: 2;
                    padding: 14px;
                    border-radius: 12px;
                    background: #ef4444;
                    color: #fff;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: 0.2s;
                }

                .btn-save:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }

                .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Admin View Panel */
                .admin-view-panel {
                    padding: 30px;
                    border-radius: 24px;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }

                .count-badge {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 2px 10px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    margin-left: 10px;
                    vertical-align: middle;
                }

                .btn-back {
                    padding: 8px 20px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .btn-back:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Table Styling */
                .admin-table-container {
                    overflow-x: auto;
                }

                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                .admin-table th {
                    padding: 15px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .admin-table td {
                    padding: 18px 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .user-initials {
                    width: 36px;
                    height: 36px;
                    background: #6366f1;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                }

                .user-details {
                    display: flex;
                    flex-direction: column;
                }

                .user-details .n { font-weight: 600; font-size: 0.95rem; }
                .user-details .e { font-size: 0.8rem; opacity: 0.5; }

                .role-tag {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .role-tag.teacher { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .role-tag.student { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .role-tag.super_admin { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .status-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                }

                .status-tag::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .status-tag.active::before { background: #22c55e; }
                .status-tag.inactive::before { background: #ef4444; }

                .btn-action-s {
                    padding: 6px 14px;
                    border-radius: 8px;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .btn-action-s:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                }

                .btn-action-s.danger:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                    color: #fff;
                }

                .font-mono { font-family: monospace; letter-spacing: 1px; }

                /* Health Monitoring */
                .health-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .health-card {
                    padding: 25px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 18px;
                }

                .health-card.wide { grid-column: span 2; }

                .health-card label {
                    display: block;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .progress-bar-w {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }

                .progress-fill {
                    height: 100%;
                    transition: 1s ease-out;
                }

                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 1.4rem;
                    font-weight: 700;
                }

                .log-window {
                    background: #050505;
                    border-radius: 12px;
                    padding: 15px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.85rem;
                    color: #22c55e;
                    min-height: 150px;
                }

                .log-line { margin-bottom: 8px; display: flex; gap: 10px; }
                .log-ts { color: rgba(255, 255, 255, 0.3); }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 100px;
                    gap: 20px;
                    color: rgba(255, 255, 255, 0.5);
                }

                @media (max-width: 768px) {
                    .admin-stats-grid { grid-template-columns: 1fr; }
                    .health-grid { grid-template-columns: 1fr; }
                    .health-card.wide { grid-column: span 1; }
                }
                .admin-stat-card {
                    padding: 20px 30px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .stat-v { font-size: 1.8rem; font-weight: 700; color: #fff; }
                .stat-l { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); }

                .admin-tools-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .tool-card {
                    padding: 35px;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    transition: 0.3s;
                }

                .tool-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .tool-icon {
                    width: 32px;
                    height: 32px;
                    color: #ef4444;
                    margin-bottom: 10px;
                }

                .tool-card h3 { font-size: 1.2rem; }
                .tool-card p {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                    line-height: 1.6;
                    margin-bottom: 10px;
                }

                .tool-btn {
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: transparent;
                    color: #fff;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.2s;
                    align-self: flex-start;
                }

                .tool-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                }

                .glassmorphism {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                @media (max-width: 768px) {
                    .admin-stats-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </DashboardLayout>
    );
}
