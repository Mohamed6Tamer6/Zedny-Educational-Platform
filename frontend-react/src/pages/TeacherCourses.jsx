/**
 * =============================================================================
 * Teacher Courses Page - LMS Feature
 * =============================================================================
 * Manage courses created by the teacher (Publish/Unpublish/Edit/Delete).
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    Plus, Search, BookOpen, Edit, Trash2, Eye, EyeOff, LayoutGrid, Clock, Users, Play, Key
} from 'lucide-react';
import '../styles/LMS.css';

const API_Base_URL = '/api/v1';

export default function TeacherCourses() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStudents, setViewingStudents] = useState(null); // Course object
    const [studentList, setStudentList] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [editingCode, setEditingCode] = useState(null); // Course object
    const [newCode, setNewCode] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_Base_URL}/courses/my-teaching`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            } else {
                showNotification('Failed to fetch courses', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Server connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cycleStatus = async (course) => {
        const statuses = ['draft', 'private', 'published'];
        const currentIndex = statuses.indexOf(course.status || 'draft');
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];

        try {
            const res = await fetch(`${API_Base_URL}/courses/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                const updated = await res.json();
                setCourses(courses.map(c => c.id === course.id ? { ...c, status: updated.status } : c));
                showNotification(`Status updated to ${updated.status}`, 'success');
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (err) {
            showNotification('Error updating course', 'error');
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm('Are you sure? This will delete the course and all its lessons.')) return;

        try {
            const res = await fetch(`${API_Base_URL}/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCourses(courses.filter(c => c.id !== id));
                showNotification('Course deleted successfully', 'success');
            } else {
                showNotification('Failed to delete course', 'error');
            }
        } catch (err) {
            showNotification('Error deleting course', 'error');
        }
    };

    const handleUpdateCode = async () => {
        if (!editingCode || !newCode.trim()) return;

        try {
            const res = await fetch(`${API_Base_URL}/courses/${editingCode.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ access_code: newCode.toUpperCase().trim() })
            });

            if (res.ok) {
                const updated = await res.json();
                setCourses(courses.map(c => c.id === editingCode.id ? { ...c, access_code: updated.access_code } : c));
                showNotification('Access code updated!', 'success');
                setEditingCode(null);
            } else {
                const error = await res.json();
                showNotification(error.detail || 'Failed to update code', 'error');
            }
        } catch (err) {
            showNotification('Error updating code', 'error');
        }
    };

    const handleViewStudents = async (course) => {
        setViewingStudents(course);
        setLoadingStudents(true);
        try {
            const res = await fetch(`${API_Base_URL}/courses/${course.id}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudentList(data);
            }
        } catch (err) {
            console.error(err);
            showNotification('Failed to load student list', 'error');
        } finally {
            setLoadingStudents(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="teacher-courses-page lms-page">
                <header className="premium-header">
                    <div className="header-text-wrap">
                        <div className="badge-premium">
                            <BookOpen size={14} />
                            <span>Curriculum Manager</span>
                        </div>
                        <h1>My <span className="gradient-text-lms">Courses</span></h1>
                        <p>Track your curriculum and manage your educational content with architectural precision.</p>
                    </div>
                </header>

                <section className="courses-explorer-t">
                    <div className="explorer-header-t">
                        <div className="title-with-icon">
                            <LayoutGrid size={20} className="text-cyan-400" />
                            <h2>Academy Library ({courses.length})</h2>
                        </div>
                        <div className="header-controls-t">
                            <div className="search-box-premium-t">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Link to="/create-course" className="btn-new-course-premium">
                                <Plus size={20} />
                                <span>New Course</span>
                            </Link>
                        </div>
                    </div>

                    <div className="teacher-courses-grid">
                        {loading ? (
                            <div className="skeleton-grid">
                                {[1, 2, 3, 4].map(n => <div key={n} className="skeleton-item-block"></div>)}
                            </div>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map(course => (
                                <div key={course.id} className="course-block-card glassmorphism-lms">
                                    <div className="course-block-thumb">
                                        {course.thumbnail_url && !course.thumbnail_url.startsWith('C:') ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="course-img-obj"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="thumb-placeholder-full"
                                            style={{ display: (course.thumbnail_url && !course.thumbnail_url.startsWith('C:')) ? 'none' : 'flex' }}
                                        >
                                            <div className="placeholder-content">
                                                <BookOpen size={40} className="opacity-20" />
                                                <span className="placeholder-letter">{course.title.charAt(0)}</span>
                                            </div>
                                        </div>
                                        <div className="status-badge-floating">
                                            <span className={`status-pill ${course.status}`}>
                                                {course.status === 'published' ? 'Published' : course.status === 'private' ? 'Private' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="course-block-body">
                                        <h3>{course.title}</h3>
                                        <div className="course-block-meta">
                                            <span className="m-item"><BookOpen size={14} /> {course.lesson_count} Lessons</span>
                                            <span className="m-item"><Users size={14} /> {course.enrollment_count} Students</span>
                                        </div>
                                        {course.access_code && (
                                            <div className="course-code-display" onClick={() => { setEditingCode(course); setNewCode(course.access_code); }}>
                                                <Key size={12} className="text-yellow-400" />
                                                <span>Code: <span className="code-text">{course.access_code}</span></span>
                                                <Edit size={10} className="edit-mini-icon" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="course-block-footer">
                                        <div className="action-group-t">
                                            <button
                                                className="action-icon-t view"
                                                onClick={() => navigate(`/courses/${course.id}`)}
                                                title="View as Student"
                                            >
                                                <Play size={18} />
                                            </button>
                                            <button
                                                className={`action-icon-t toggle ${course.status}`}
                                                onClick={() => cycleStatus(course)}
                                                title={`Change Status (Current: ${course.status})`}
                                            >
                                                {course.status === 'published' ? <Eye size={18} /> : course.status === 'private' ? <Key size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            <button className="action-icon-t edit" onClick={() => navigate(`/edit-course/${course.id}`)} title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button className="action-icon-t delete" onClick={() => handleDeleteCourse(course.id)} title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                className="action-icon-t students"
                                                onClick={() => handleViewStudents(course)}
                                                title="View Students"
                                                style={{ marginLeft: '10px', color: '#cyan' }}
                                            >
                                                <Users size={18} />
                                            </button>
                                            <button
                                                className="action-icon-t code-edit"
                                                onClick={() => { setEditingCode(course); setNewCode(course.access_code || ''); }}
                                                title="Edit Access Code"
                                                style={{ color: '#fbbf24' }}
                                            >
                                                <Key size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-block glassmorphism-lms">
                                <BookOpen size={48} className="opacity-20" />
                                <p>No courses found. Time to share your knowledge!</p>
                                <Link to="/create-course" className="action-link-premium">Create Lesson Plan</Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Students Modal */}
            {viewingStudents && (
                <div className="modal-overlay" onClick={() => setViewingStudents(null)}>
                    <div className="student-modal glassmorphism-lms" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Students Enrolled in "{viewingStudents.title}"</h3>
                            <button className="btn-close" onClick={() => setViewingStudents(null)}>×</button>
                        </div>
                        <div className="student-list-content">
                            {loadingStudents ? (
                                <p className="loading-text">Loading students...</p>
                            ) : studentList.length === 0 ? (
                                <p className="empty-msg">No students enrolled yet.</p>
                            ) : (
                                <table className="student-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Enrollments</th>
                                            <th>Progress</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentList.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.student_name || 'Unknown'}</td>
                                                <td>{student.student_email || 'No Email'}</td>
                                                <td style={{ textAlign: 'center' }}>{student.enrollment_count}</td>
                                                <td>
                                                    <div className="progress-bar-wrapper">
                                                        <div className="progress-bar-fill" style={{ width: `${student.progress_percent}%` }}></div>
                                                        <span className="progress-text">{Math.round(student.progress_percent)}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${student.progress_percent >= 100 ? 'comp' : 'prog'}`}>
                                                        {student.progress_percent >= 100 ? 'Completed' : 'In Progress'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Access Code Modal */}
            {editingCode && (
                <div className="modal-overlay" onClick={() => setEditingCode(null)}>
                    <div className="code-modal glassmorphism-lms" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Access Code</h3>
                            <button className="btn-close" onClick={() => setEditingCode(null)}>×</button>
                        </div>
                        <div className="modal-body-p">
                            <p className="modal-subtitle">Course: {editingCode.title}</p>
                            <div className="input-group-premium">
                                <label>Access Code</label>
                                <input
                                    type="text"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                    placeholder="Enter new code..."
                                />
                                <span className="hint">Students can use this code to find and join the course even if it is not published.</span>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setEditingCode(null)}>Cancel</button>
                                <button className="btn-save-code" onClick={handleUpdateCode}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .teacher-courses-page {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    animation: fadeIn 0.8s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .badge-premium {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(34, 211, 238, 0.1);
                    border: 1px solid rgba(34, 211, 238, 0.2);
                    border-radius: 100px;
                    color: #22d3ee;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }

                .gradient-text-lms {
                    background: linear-gradient(135deg, #22d3ee, #818cf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .explorer-header-t {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .header-controls-t {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .search-box-premium-t {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 10px 16px;
                    border-radius: 14px;
                    width: 300px;
                }

                .search-box-premium-t input {
                    background: transparent;
                    border: none;
                    color: #fff;
                    width: 100%;
                    outline: none;
                    font-size: 0.9rem;
                }

                .btn-new-course-premium {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #06b6d4, #3b82f6);
                    color: #fff;
                    border-radius: 14px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: 0.3s;
                    box-shadow: 0 8px 15px rgba(6, 182, 212, 0.2);
                }

                .btn-new-course-premium:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px rgba(6, 182, 212, 0.3);
                }

                /* Grid Layout */
                .teacher-courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }

                .course-block-card {
                    display: flex;
                    flex-direction: column;
                    border-radius: 24px;
                    overflow: hidden;
                    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .course-block-card:hover {
                    transform: translateY(-8px);
                    border-color: rgba(34, 211, 238, 0.4);
                    background: rgba(255, 255, 255, 0.04);
                }

                .course-block-thumb {
                    height: 180px;
                    position: relative;
                    background: #0f172a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .course-img-obj {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: 0.5s;
                }

                .course-block-card:hover .course-img-obj {
                    transform: scale(1.1);
                }

                .thumb-placeholder-full {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1e1b4b, #312e81);
                }

                .placeholder-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .placeholder-letter {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                }

                .status-badge-floating {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                }

                .status-pill {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    backdrop-filter: blur(10px);
                }

                .status-pill.published { background: rgba(34, 211, 238, 0.2); color: #22d3ee; border: 1px solid rgba(34, 211, 238, 0.3); }
                .status-pill.private { background: rgba(168, 85, 247, 0.2); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); }
                .status-pill.draft { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); }

                .course-block-body {
                    padding: 24px;
                    flex-grow: 1;
                }

                .course-block-body h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    line-height: 1.4;
                    color: #fff;
                }

                .course-block-meta {
                    display: flex;
                    gap: 16px;
                }

                .m-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .course-block-footer {
                    padding: 20px 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: center;
                }

                .action-group-t {
                    display: flex;
                    gap: 12px;
                }

                .action-icon-t {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: 0.3s;
                }

                .action-icon-t:hover {
                    color: #fff;
                    transform: scale(1.1);
                }

                .action-icon-t.edit:hover { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #3b82f6; }
                .action-icon-t.delete:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }
                .action-icon-t.toggle.pub:hover { background: rgba(34, 197, 94, 0.2); border-color: #22c55e; color: #22c55e; }
                .action-icon-t.toggle.unp:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }

                .empty-state-block {
                    grid-column: 1 / -1;
                    padding: 80px;
                    text-align: center;
                    border-radius: 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .glassmorphism-lms {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .skeleton-item-block {
                    height: 350px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 24px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

                /* Student Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .student-modal {
                    width: 90%;
                    max-width: 800px;
                    background: #1e1b4b;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    max-height: 80vh;
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .btn-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .student-list-content {
                    padding: 20px;
                    overflow-y: auto;
                }
                .student-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: white;
                }
                .student-table th, .student-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .progress-bar-wrapper {
                    background: rgba(255,255,255,0.1);
                    height: 20px;
                    border-radius: 10px;
                    position: relative;
                    overflow: hidden;
                    width: 150px;
                }
                .progress-bar-fill {
                    background: #22d3ee;
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                }
                .status-badge.comp { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .status-badge.prog { background: rgba(234, 179, 8, 0.2); color: #eab308; }

                /* Access Code Styles */
                .course-code-display {
                    margin-top: 15px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .course-code-display:hover {
                    background: rgba(251, 191, 36, 0.2);
                    border-color: rgba(251, 191, 36, 0.4);
                }
                .code-text {
                    font-family: 'JetBrains Mono', Courier, monospace;
                    font-weight: 700;
                    color: #fbbf24;
                    letter-spacing: 1px;
                }
                .edit-mini-icon {
                    opacity: 0.4;
                }
                .course-code-display:hover .edit-mini-icon {
                    opacity: 1;
                }

                .code-modal {
                    width: 90%;
                    max-width: 450px;
                    background: #0f172a;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .modal-body-p {
                    padding: 30px;
                }
                .modal-subtitle {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.9rem;
                    margin-bottom: 24px;
                }
                .input-group-premium {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 24px;
                }
                .input-group-premium label {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                }
                .input-group-premium input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 1rem;
                    font-family: 'JetBrains Mono', monospace;
                    letter-spacing: 2px;
                    outline: none;
                }
                .input-group-premium input:focus {
                    border-color: #fbbf24;
                }
                .input-group-premium .hint {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    line-height: 1.4;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                }
                .btn-cancel {
                    flex: 1;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-save-code {
                    flex: 2;
                    padding: 12px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border: none;
                    border-radius: 12px;
                    color: #000;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-save-code:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                }
            `}</style>
        </DashboardLayout>
    );
}
