import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Shield, Users, BarChart, Settings, Database, Activity, RefreshCw, Trash2, Edit2, CheckCircle, XCircle, Terminal, Cpu, HardDrive, BookOpen, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const API_Base_URL = '/api/v1';

export default function SuperAdminDashboard() {
    const { user, token } = useAuth();
    const { showNotification } = useNotification();
    const [stats, setStats] = useState({
        total_users: 0,
        total_quizzes: 0,
        system_uptime: '99.9%',
        total_attempts: 0,
        total_participations: 0,
        total_teachers: 0,
        total_students: 0
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [viewData, setViewData] = useState([]);
    const [healthData, setHealthData] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger', // danger or warning
        confirmText: 'Delete'
    });

    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_Base_URL}/admin/stats`, {
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
            const res = await fetch(`${API_Base_URL}/admin/users`, {
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
            const res = await fetch(`${API_Base_URL}/admin/quizzes`, {
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

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base_URL}/admin/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setViewData(await res.json());
            setActiveTab('courses');
        } catch (err) {
            showNotification("Failed to fetch courses", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = (courseId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Course',
            message: 'Are you sure you want to delete this course? This will permanently remove all lessons and content. This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Course',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_Base_URL}/courses/${courseId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setViewData(prev => prev.filter(c => c.id !== courseId));
                        showNotification("Course deleted successfully", "success");
                    } else {
                        showNotification("Failed to delete course", "error");
                    }
                } catch (err) {
                    showNotification("Error deleting course", "error");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base_URL}/admin/health-detailed`, {
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
            const res = await fetch(`${API_Base_URL}/admin/users/${editingUser.id}`, {
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

    const handleDeleteUser = (userId) => {
        if (userId === user.id) {
            showNotification("You cannot delete your own admin account.", "warning");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Delete User Account',
            message: 'CRITICAL WARNING: This will permanently delete this user and ALL their associated data (Quizzes, Attempts, Performances, Enrollments). This action is irreversible.',
            type: 'danger',
            confirmText: 'Permanently Delete',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_Base_URL}/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setViewData(prev => prev.filter(u => u.id !== userId));
                        showNotification("User and all associated data deleted", "success");
                        fetchStats();
                    } else {
                        const errorData = await res.json();
                        showNotification(errorData.detail || "Failed to delete user", "error");
                    }
                } catch (err) {
                    showNotification("Error deleting user", "error");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteQuiz = (quizId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Quiz',
            message: 'Are you sure you want to delete this quiz? All student attempts and statistics associated with it will be removed.',
            type: 'danger',
            confirmText: 'Delete Quiz',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_Base_URL}/admin/quizzes/${quizId}`, {
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
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
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
                <div className="stats-card glassmorphism-p">
                    <div className="card-accent-red"></div>
                    <div className="stats-val">{stats.total_users.toLocaleString()}</div>
                    <div className="stats-lbl">Total Registered Users</div>
                    <div className="stats-sub">{stats.total_teachers} Teachers • {stats.total_students} Students</div>
                </div>
                <div className="stats-card glassmorphism-p">
                    <div className="card-accent-blue"></div>
                    <div className="stats-val">{stats.total_quizzes.toLocaleString()}</div>
                    <div className="stats-lbl">Active Quizzes</div>
                    <div className="stats-sub">Global knowledge repository</div>
                </div>
                <div className="stats-card glassmorphism-p">
                    <div className="card-accent-gold"></div>
                    <div className="stats-val">{stats.total_courses?.toLocaleString() || 0}</div>
                    <div className="stats-lbl">Total Courses</div>
                    <div className="stats-sub">LMS content management</div>
                </div>
                <div className="stats-card glassmorphism-p">
                    <div className="card-accent-gold" style={{ background: '#22c55e' }}></div>
                    <div className="stats-val">{stats.total_participations.toLocaleString()}</div>
                    <div className="stats-lbl">Total Engagements</div>
                    <div className="stats-sub">{stats.total_attempts.toLocaleString()} Completions recorded</div>
                </div>
            </div>

            <div className="admin-tools-grid">
                <div className="tool-card-p glassmorphism-p" onClick={fetchUsers}>
                    <div className="icon-box-r purple"><Users size={24} /></div>
                    <h3>User Directory</h3>
                    <p>Audit accounts, adjust roles, and manage permissions across the infrastructure.</p>
                    <div className="btn-access-r">Control Center →</div>
                </div>

                <div className="tool-card-p glassmorphism-p" onClick={fetchQuizzes}>
                    <div className="icon-box-r blue"><Database size={24} /></div>
                    <h3>Global Oversight</h3>
                    <p>Monitor all instructional content and perform administrative overrides where necessary.</p>
                    <div className="btn-access-r">Access Repository →</div>
                </div>

                <div className="tool-card-p glassmorphism-p" onClick={fetchCourses}>
                    <div className="icon-box-r gold"><BookOpen size={24} /></div>
                    <h3>Course Management</h3>
                    <p>Oversight of all published and draft courses. Review content and manage instructional integrity.</p>
                    <div className="btn-access-r">Monitor Academy →</div>
                </div>

                <div className="tool-card-p glassmorphism-p" onClick={fetchHealth}>
                    <div className="icon-box-r green"><Activity size={24} /></div>
                    <h3>System Telemetry</h3>
                    <p>Real-time analytics for server load, database integrity, and operational health.</p>
                    <div className="btn-access-r">Diagnostics →</div>
                </div>
            </div>
        </>
    );

    const renderUsers = () => (
        <div className="admin-panel glassmorphism-p entry-anim">
            <div className="panel-head-r">
                <div className="head-info-r">
                    <h2>User Directory</h2>
                    <span className="badge-r">{viewData.length} records found</span>
                </div>
                <button className="btn-back-r" onClick={() => setActiveTab('overview')}>Exit Console</button>
            </div>
            <div className="table-wrapper-r">
                <table className="premium-table-r">
                    <thead>
                        <tr>
                            <th>IDENTIFIER</th>
                            <th>DESIGNATION</th>
                            <th>STATUS</th>
                            <th>ENROLLED</th>
                            <th>OPERATIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewData.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="user-info-row-r">
                                        <div className="initials-box-r">{u.full_name?.charAt(0) || 'U'}</div>
                                        <div>
                                            <div className="u-name-r">{u.full_name}</div>
                                            <div className="u-email-r">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className={`tag role ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                <td><span className={`tag status ${u.is_active ? 'active' : 'banned'}`}>{u.is_active ? 'ACTIVE' : 'BANNED'}</span></td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="icon-action-btn edit" onClick={() => setEditingUser(u)} title="Edit User"><Edit2 size={16} /></button>
                                        <button className="icon-action-btn delete" onClick={() => handleDeleteUser(u.id)} title="Delete User"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderQuizzes = () => (
        <div className="admin-panel glassmorphism-p entry-anim">
            <div className="panel-head-r">
                <div className="head-info-r">
                    <h2>Repository Oversight</h2>
                    <span className="badge-r">{viewData.length} quizzes detected</span>
                </div>
                <button className="btn-back-r" onClick={() => setActiveTab('overview')}>Exit Console</button>
            </div>
            <div className="table-wrapper-r">
                <table className="premium-table-r">
                    <thead>
                        <tr>
                            <th>TITLE</th>
                            <th>CREATOR</th>
                            <th>Questions</th>
                            <th>ENGAGEMENTS</th>
                            <th>COMPLETIONS</th>
                            <th>ACCESS</th>
                            <th>OPERATIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewData.map(q => (
                            <tr key={q.id}>
                                <td className="font-bold">{q.title}</td>
                                <td>{q.teacher_name}</td>
                                <td>{q.question_count}</td>
                                <td>{q.participation_count} Entries</td>
                                <td>{q.attempt_count} Finished</td>
                                <td><code className="access-code-box-r">{q.access_code}</code></td>
                                <td>
                                    <button className="icon-action-btn delete" onClick={() => handleDeleteQuiz(q.id)}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCourses = () => (
        <div className="admin-panel glassmorphism-p entry-anim">
            <div className="panel-head-r">
                <div className="head-info-r">
                    <h2>Academy Oversight</h2>
                    <span className="badge-r">{viewData.length} courses detected</span>
                </div>
                <button className="btn-back-r" onClick={() => setActiveTab('overview')}>Exit Console</button>
            </div>
            <div className="table-wrapper-r">
                <table className="premium-table-r">
                    <thead>
                        <tr>
                            <th>COURSE TITLE</th>
                            <th>TEACHER</th>
                            <th>LESSONS</th>
                            <th>STUDENTS</th>
                            <th>STATUS</th>
                            <th>OPERATIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewData.map(c => (
                            <tr key={c.id}>
                                <td className="font-bold">{c.title}</td>
                                <td>{c.teacher_name}</td>
                                <td>{c.lesson_count}</td>
                                <td>{c.enrollment_count} Enrolled</td>
                                <td>
                                    <span className={`tag status ${c.status}`}>
                                        {c.status?.toUpperCase() || 'DRAFT'}
                                    </span>
                                </td>
                                <td>
                                    <button className="icon-action-btn delete" onClick={() => handleDeleteCourse(c.id)}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderHealth = () => (
        <div className="admin-panel glassmorphism-p entry-anim">
            <div className="panel-head-r">
                <div className="head-info-r">
                    <h2>System Telemetry</h2>
                    <span className="badge-r">REAL-TIME MONITOR</span>
                </div>
                <button className="btn-back-r" onClick={() => setActiveTab('overview')}>Exit Console</button>
            </div>
            <div className="telemetry-grid-r">
                <div className="telemetry-card glassmorphism-p">
                    <div className="t-icon-r"><Cpu size={20} /></div>
                    <div className="t-data-r">
                        <label>CPU ARCHITECTURE LOAD</label>
                        <div className="p-bar-base-r">
                            <div className="p-bar-fill-r" style={{ width: `${healthData?.cpu_usage || 0}%`, background: healthData?.cpu_usage > 70 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                        </div>
                        <span className="t-val-r">{healthData?.cpu_usage}%</span>
                    </div>
                </div>
                <div className="telemetry-card glassmorphism-p">
                    <div className="t-icon-r"><HardDrive size={20} /></div>
                    <div className="t-data-r">
                        <label>MEMORY ALLOCATION</label>
                        <div className="t-stat-r">{healthData?.memory_usage?.toFixed(1)} UI_UX_COMPATIBLE_MB</div>
                    </div>
                </div>
                <div className="log-panel-p glassmorphism-p">
                    <div className="log-head-r">
                        <Terminal size={14} />
                        <span>KERNEL BROADCAST LOGS</span>
                    </div>
                    <div className="log-content-r">
                        <div className="log-entry-r">
                            <span className="ts-r">[{new Date().toLocaleTimeString()}]</span>
                            <span className="msg-r">TELEMETRY_SCAN_COMPLETE: CPU_USAGE={healthData?.cpu_usage}% MEM={healthData?.memory_usage?.toFixed(1)}MB</span>
                        </div>
                        <div className="log-entry-r warn">
                            <span className="ts-r">[{new Date().toLocaleTimeString()}]</span>
                            <span className="msg-r">SECURITY: API_OVERSIGHT_CALL FROM SUPERUSER_SESSION_ACTIVE</span>
                        </div>
                        <div className="log-entry-r info">
                            <span className="ts-r">[{new Date().toLocaleTimeString()}]</span>
                            <span className="msg-r">DATABASE: CONNECTION_POOL_STABLE (SYSTEM_VERIFIED)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="super-admin-root">
                <header className="admin-hero-r">
                    <div className="hero-left-r">
                        <div className="access-pill-r">
                            <Shield size={14} />
                            <span>ENCRYPTED SUPERUSER ACCESS</span>
                        </div>
                        <h1>Command <span className="gradient-text-red">Central</span></h1>
                        <p>Total system authority and architectural governance.</p>
                    </div>
                    {activeTab === 'overview' && (
                        <div className="hero-right-r">
                            <button className="btn-refresh-r" onClick={() => { setLoading(true); fetchStats(); }} disabled={loading}>
                                <RefreshCw size={18} className={loading ? 'spin-r' : ''} />
                                <span>{loading ? 'Syncing...' : 'Real-time'}</span>
                            </button>
                        </div>
                    )}
                </header>

                <div className="admin-content-r">
                    {loading && activeTab !== 'overview' ? (
                        <div className="admin-loader-r">
                            <div className="ring-r"></div>
                            <p>Querying Secure Nodes...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'users' && renderUsers()}
                            {activeTab === 'quizzes' && renderQuizzes()}
                            {activeTab === 'courses' && renderCourses()}
                            {activeTab === 'health' && renderHealth()}
                        </>
                    )}
                </div>

                {editingUser && (
                    <div className="p-modal-overlay">
                        <div className="p-modal-card glassmorphism-p">
                            <div className="modal-top-r">
                                <h3>Account Config</h3>
                                <button className="modal-close-r" onClick={() => setEditingUser(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-form">
                                <div className="p-field">
                                    <label>IDENTITY NAME</label>
                                    <input type="text" value={editingUser.full_name} onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })} required />
                                </div>
                                <div className="p-field">
                                    <label>EMAIL ADDRESS</label>
                                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
                                </div>
                                <div className="p-grid-r">
                                    <div className="p-field">
                                        <label>AUTHORITY</label>
                                        <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="TEACHER">TEACHER</option>
                                            <option value="SUPER_ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="p-field">
                                        <label>STATUS</label>
                                        <select value={editingUser.is_active} onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}>
                                            <option value="true">ACTIVE</option>
                                            <option value="false">RESTRICTED</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-actions-r">
                                    <button type="button" className="btn-final cancel" onClick={() => setEditingUser(null)}>ABORT</button>
                                    <button type="submit" className="btn-final submit" disabled={isUpdating}>{isUpdating ? 'SAVING...' : 'SYNC'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmModal.isOpen && (
                    <div className="p-modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                        <div className="p-modal-card glassmorphism-p danger-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-icon-wrapper">
                                <Trash2 size={48} className="danger-icon" />
                            </div>
                            <h3 className="modal-title-center">{confirmModal.title}</h3>
                            <p className="modal-message-center">{confirmModal.message}</p>
                            <div className="p-actions-r">
                                <button
                                    className="btn-final cancel"
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-final submit danger-btn"
                                    onClick={confirmModal.onConfirm}
                                >
                                    {confirmModal.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .super-admin-root { display: flex; flex-direction: column; gap: 40px; }
                .admin-hero-r { display: flex; justify-content: space-between; align-items: flex-end; }
                .access-pill-r { display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 16px; border-radius: 100px; color: #f87171; font-size: 0.7rem; font-weight: 800; margin-bottom: 20px; }
                .admin-hero-r h1 { font-size: 3.2rem; font-weight: 900; margin: 0; line-height: 1; }
                .gradient-text-red { background: linear-gradient(135deg, #ef4444, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .admin-hero-r p { color: rgba(255, 255, 255, 0.4); font-size: 1.1rem; margin-top: 10px; }
                .btn-refresh-r { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; cursor: pointer; transition: 0.3s; }
                .btn-refresh-r:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
                .spin-r { animation: spin 2s linear infinite; }
                @keyframes spin { from { rotate: 0deg; } to { rotate: 360deg; } }

                .admin-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .stats-card { padding: 32px; border-radius: 24px; position: relative; overflow: hidden; }
                .card-accent-red { position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: #ef4444; }
                .card-accent-blue { position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: #3b82f6; }
                .card-accent-gold { position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: #f59e0b; }
                .stats-val { font-size: 2.2rem; font-weight: 900; }
                .stats-lbl { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; font-weight: 700; margin: 8px 0; }
                .stats-sub { font-size: 0.75rem; color: rgba(255, 255, 255, 0.25); }

                .admin-tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .tool-card-p { padding: 35px; border-radius: 30px; cursor: pointer; transition: 0.4s; }
                .tool-card-p:hover { background: rgba(255, 255, 255, 0.05); transform: translateY(-5px); border-color: rgba(255, 255, 255, 0.15); }
                .icon-box-r { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .icon-box-r.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .icon-box-r.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .icon-box-r.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .icon-box-r.gold { background: rgba(234, 179, 8, 0.1); color: #eab308; }
                .tool-card-p h3 { font-size: 1.4rem; margin-bottom: 10px; }
                .tool-card-p p { color: rgba(255, 255, 255, 0.4); font-size: 0.9rem; line-height: 1.5; margin-bottom: 25px; }
                .btn-access-r { font-size: 0.8rem; font-weight: 800; color: #fff; text-transform: uppercase; }

                .admin-panel { padding: 35px; border-radius: 30px; }
                .panel-head-r { display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; }
                .head-info-r h2 { font-size: 1.8rem; margin-bottom: 5px; }
                .badge-r { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; color: rgba(255,255,255,0.4); font-weight: 700; }
                .btn-back-r { padding: 10px 20px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; }

                .premium-table-r { width: 100%; border-collapse: collapse; text-align: left; }
                .premium-table-r th { padding: 15px; font-size: 0.7rem; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.05); }
                .premium-table-r td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .initials-box-r { width: 40px; height: 40px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                .tag { padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; }
                .role.teacher { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .status.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .status.published { background: rgba(34, 211, 238, 0.1); color: #22d3ee; }
                .status.private { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .status.draft { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); }

                /* NEW BUTTON STYLES */
                .icon-action-btn {
                    padding: 8px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .icon-action-btn.edit {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
                .icon-action-btn.edit:hover {
                    background: #3b82f6;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .icon-action-btn.delete {
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .icon-action-btn.delete:hover {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .telemetry-grid-r { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .telemetry-card { padding: 30px; display: flex; gap: 20px; }
                .t-icon-r { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #3b82f6; }
                .p-bar-base-r { width: 200px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 100px; margin: 10px 0; }
                .p-bar-fill-r { height: 100%; border-radius: 100px; }
                .log-panel-p { grid-column: span 2; padding: 25px; height: 250px; overflow-y: auto; }
                .log-entry-r { font-family: monospace; font-size: 0.8rem; margin-bottom: 5px; }

                .p-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.3s ease-out; }
                .p-modal-card { width: 500px; padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); transform: scale(0.95); animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .modal-top-r { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .modal-top-r h3 { font-size: 1.5rem; font-weight: 800; color: #fff; }
                .modal-close-r { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
                .modal-close-r:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); transform: rotate(90deg); }

                .danger-modal { border-color: rgba(239, 68, 68, 0.3); background: linear-gradient(145deg, rgba(30, 20, 20, 0.95), rgba(10, 10, 10, 0.98)); }
                
                .modal-icon-wrapper { display: flex; justify-content: center; margin-bottom: 20px; }
                .danger-icon { color: #ef4444; filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.4)); animation: pulse 2s infinite; }
                
                .modal-title-center { text-align: center; font-size: 1.8rem; margin-bottom: 10px; color: #fff; }
                .modal-message-center { text-align: center; color: rgba(255,255,255,0.6); margin-bottom: 30px; line-height: 1.6; }

                .p-form { display: flex; flex-direction: column; gap: 20px; }
                .p-field label { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); margin-bottom: 8px; display: block; letter-spacing: 1px; }
                .p-field input, .p-field select { padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; outline: none; transition: 0.3s; }
                .p-field input:focus, .p-field select:focus { border-color: #3b82f6; background: rgba(255,255,255,0.08); }
                .p-field select option { background: #0f0f0f; color: #fff; padding: 10px; }
                
                .p-grid-r { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                .btn-final { padding: 15px; border-radius: 15px; font-weight: 800; cursor: pointer; border: none; transition: 0.2s; }
                .btn-final:hover { transform: translateY(-2px); filter: brightness(1.2); }
                .btn-final.submit { background: #3b82f6; color: #fff; flex: 2; }
                .btn-final.submit.danger-btn { background: #ef4444; box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3); }
                .btn-final.cancel { background: rgba(255,255,255,0.05); color: #fff; flex: 1; }

                .glassmorphism-p { background: rgba(15, 15, 15, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
                .entry-anim { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>
        </DashboardLayout>
    );
}
