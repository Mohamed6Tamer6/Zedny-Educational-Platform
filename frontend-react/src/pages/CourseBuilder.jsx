/**
 * =============================================================================
 * Course Builder Page - LMS Feature (Teacher Only)
 * =============================================================================
 * Create and edit courses with lessons.
 * 
 * Features:
 * - Course info form (title, description, category, thumbnail)
 * - Drag-and-drop lesson ordering
 * - Add lessons (video URL, text, PDF URL, quiz link)
 * - Publish/Unpublish toggle
 * - Premium design matching CreateQuiz
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
    Plus, Trash2, Save, ArrowLeft, Video, FileText,
    File, Link as LinkIcon, GripVertical, Eye, EyeOff
} from 'lucide-react';
import '../styles/LMS.css';

const API_URL = '/api/v1';

const CONTENT_TYPES = [
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'pdf', label: 'PDF URL', icon: File },
    { value: 'quiz_link', label: 'Quiz Link', icon: LinkIcon }
];

const CATEGORIES = ['Programming', 'Mathematics', 'Science', 'Languages', 'Business', 'Design', 'Other'];

export default function CourseBuilder() {
    const { id: editId } = useParams();
    const { token } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (file, type) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch(`${API_URL}/uploads/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.url;
            } else {
                showNotification(`Failed to upload ${type}`, 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showNotification('Network error during upload', 'error');
        } finally {
            setUploading(false);
        }
        return null;
    };
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: '',
        thumbnail_url: '',
        status: 'draft',
        access_code: ''
    });
    const [lessons, setLessons] = useState([]);
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [showQuizBrowser, setShowQuizBrowser] = useState(null); // stores lesson index
    const [skills, setSkills] = useState([]); // { name, level }

    useEffect(() => {
        if (editId) {
            fetchCourse();
        }
        fetchAvailableQuizzes();
    }, [editId]);

    // Listen for Quiz Creation Messages from Popup
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'QUIZ_CREATED') {
                const { code, lessonIndex } = event.data;
                if (code && lessonIndex !== undefined) {
                    // We need to use the functional update to ensure we have the latest lessons state
                    // However, updateLesson uses 'lessons' state directly. 
                    // To avoid stale closures in this event listener, we should likely check 'lessons' dependency or use functional state update.
                    // But 'updateLesson' might not be stable.
                    // Safest is to just call a state update here.
                    setLessons(prevLessons => {
                        const updated = [...prevLessons];
                        if (updated[lessonIndex]) {
                            updated[lessonIndex] = { ...updated[lessonIndex], quiz_code: code, content_type: 'quiz_link' };
                        }
                        return updated;
                    });
                    showNotification(`Quiz created and linked! Code: ${code}`, 'success');
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []); // Empty dependency array as we use setLessons functional update

    const fetchAvailableQuizzes = async () => {
        try {
            const res = await fetch(`${API_URL}/quizzes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAvailableQuizzes(await res.json());
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err);
        }
    };

    const fetchCourse = async () => {
        try {
            const res = await fetch(`${API_URL}/courses/${editId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourse({
                    title: data.title,
                    description: data.description || '',
                    category: data.category || '',
                    thumbnail_url: data.thumbnail_url || '',
                    status: data.status,
                    access_code: data.access_code || ''
                });
                setLessons(data.lessons || []);
                if (data.target_skills) {
                    try {
                        setSkills(JSON.parse(data.target_skills));
                    } catch (e) {
                        setSkills([]);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching course:', err);
        }
    };

    const addLesson = () => {
        setLessons([...lessons, {
            id: Date.now(), // Temp ID
            title: '',
            content_type: 'text',
            content_url: '',
            content_text: '',
            order_index: lessons.length,
            duration_minutes: 0,
            linked_quiz_id: null,
            isNew: true
        }]);
    };

    const updateLesson = (index, field, value) => {
        const updated = [...lessons];
        updated[index] = { ...updated[index], [field]: value };
        setLessons(updated);
    };

    const removeLesson = (index) => {
        setLessons(lessons.filter((_, i) => i !== index));
    };

    const saveCourse = async () => {
        if (!course.title.trim()) {
            showNotification('Please enter a course title', 'warning');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...course,
                target_skills: JSON.stringify(skills),
                lessons: lessons.map((l, idx) => ({
                    title: l.title,
                    content_type: l.content_type,
                    content_url: l.content_url,
                    content_text: l.content_text,
                    order_index: idx,
                    duration_minutes: parseInt(l.duration_minutes) || 0,
                    linked_quiz_id: l.linked_quiz_id,
                    quiz_code: l.quiz_code
                }))
            };

            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${API_URL}/courses/${editId}` : `${API_URL}/courses/`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification(editId ? 'Course updated!' : 'Course created!', 'success');
                navigate('/teacher-courses');
            } else {
                try {
                    const error = await res.json();
                    showNotification(error.detail || 'Save failed', 'error');
                } catch (jsonErr) {
                    showNotification(`Server error (${res.status})`, 'error');
                }
            }
        } catch (err) {
            console.error('Save error:', err);
            showNotification('Network error - check connection', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="lms-page course-builder-page">
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            {/* Top Bar */}
            <header className="builder-header">
                <div className="header-left">
                    <Link to="/teacher-dashboard" className="back-link">
                        <ArrowLeft size={20} /> Back
                    </Link>
                    <h1>{editId ? 'Edit Course' : 'Create Course'}</h1>
                </div>
                <div className="header-right">
                    <div className="status-selector-wrapper">
                        <select
                            className={`status-select ${course.status}`}
                            value={course.status}
                            onChange={(e) => setCourse({ ...course, status: e.target.value })}
                        >
                            <option value="published">Public</option>
                            <option value="private">Private (Code Only)</option>
                            <option value="draft">Draft (Me Only)</option>
                        </select>
                    </div>
                    <button
                        className="btn-save"
                        onClick={saveCourse}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Course'}
                    </button>
                </div>
            </header>

            <div className="builder-layout">
                {/* Course Info Panel */}
                <aside className="course-info-panel">
                    <h2>Course Details</h2>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={course.title}
                            onChange={(e) => setCourse({ ...course, title: e.target.value })}
                            placeholder="Enter course title"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={course.description}
                            onChange={(e) => setCourse({ ...course, description: e.target.value })}
                            placeholder="What will students learn?"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={course.category}
                            onChange={(e) => setCourse({ ...course, category: e.target.value })}
                        >
                            <option value="">Select category</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Thumbnail</label>
                        <div className="thumbnail-upload">
                            {course.thumbnail_url && (
                                <div className="thumb-preview">
                                    <img src={course.thumbnail_url} alt="Preview" />
                                    <button className="btn-remove-thumb" onClick={() => setCourse({ ...course, thumbnail_url: '' })}>×</button>
                                </div>
                            )}
                            <div className="thumb-inputs">
                                <input
                                    type="text"
                                    value={course.thumbnail_url}
                                    onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                                    placeholder="Image URL"
                                />
                                <span className="or-text">OR</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        const url = await handleFileUpload(file, 'Thumbnail');
                                        if (url) setCourse({ ...course, thumbnail_url: url });
                                    }}
                                    id="thumb-file-input"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn-browse-file"
                                    onClick={() => document.getElementById('thumb-file-input').click()}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Image'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {course.status !== 'draft' && (
                        <div className="form-group">
                            <label>Access Code</label>
                            <input
                                type="text"
                                value={course.access_code}
                                onChange={(e) => setCourse({ ...course, access_code: e.target.value.toUpperCase() })}
                                placeholder="e.g. MATH101"
                            />
                            <p className="field-hint">
                                {course.status === 'published' ? 'Optional code for direct access.' :
                                    'Required for students to find this course.'}
                            </p>
                        </div>
                    )}
                </aside>

                {/* Lessons Builder */}
                <main className="lessons-builder">
                    <div className="lessons-header">
                        <h2>Lessons ({lessons.length})</h2>
                        <button className="btn-add-lesson" onClick={addLesson}>
                            <Plus size={18} /> Add Lesson
                        </button>
                    </div>

                    {/* Course Skills Section */}
                    <div className="builder-card">
                        <div className="card-header">
                            <h3>Target Skills (Skills Graph)</h3>
                        </div>
                        <p className="card-subtitle">Define the skills students will gain. These will appear as a radar graph.</p>

                        <button className="btn-add-skill" style={{ marginTop: '10px', marginBottom: '20px' }} onClick={() => setSkills([...skills, { name: '', level: 90 }])}>
                            <Plus size={18} /> Add Skill
                        </button>

                        <div className="skills-builder-list">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="skill-builder-item">
                                    <input
                                        type="text"
                                        placeholder="Skill Name (e.g. React, Logic, Python)"
                                        value={skill.name}
                                        onChange={(e) => {
                                            const newSkills = [...skills];
                                            newSkills[idx].name = e.target.value;
                                            setSkills(newSkills);
                                        }}
                                    />
                                    <button className="btn-delete-lesson" onClick={() => setSkills(skills.filter((_, i) => i !== idx))}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {skills.length === 0 && (
                                <div className="empty-skills-state">
                                    <p>No skills added yet. Add at least 3 skills for a radar graph!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="builder-card lessons-card">
                        {lessons.length === 0 ? (
                            <div className="empty-lessons">
                                <FileText size={48} />
                                <p>No lessons yet. Click "Add Lesson" to start building your course.</p>
                            </div>
                        ) : (
                            lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="lesson-card">
                                    <div className="lesson-drag-handle">
                                        <GripVertical size={20} />
                                    </div>

                                    <div className="lesson-number">{idx + 1}</div>

                                    <div className="lesson-fields">
                                        <input
                                            type="text"
                                            className="lesson-title-input"
                                            value={lesson.title}
                                            onChange={(e) => updateLesson(idx, 'title', e.target.value)}
                                            placeholder="Lesson title"
                                        />

                                        <div className="lesson-config">
                                            <select
                                                value={lesson.content_type}
                                                onChange={(e) => updateLesson(idx, 'content_type', e.target.value)}
                                            >
                                                {CONTENT_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {lesson.content_type === 'text' ? (
                                                <div className="text-content-editor">
                                                    <div className="text-tools" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                                        <input
                                                            type="file"
                                                            accept=".txt,.md,.json"
                                                            id={`text-upload-${idx}`}
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => {
                                                                    updateLesson(idx, 'content_text', ev.target.result);
                                                                };
                                                                reader.readAsText(file);
                                                            }}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <button
                                                            className="btn-browse-file"
                                                            onClick={() => document.getElementById(`text-upload-${idx}`).click()}
                                                        >
                                                            <FileText size={14} style={{ marginRight: '4px' }} />
                                                            Import Text File
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={lesson.content_text}
                                                        onChange={(e) => updateLesson(idx, 'content_text', e.target.value)}
                                                        placeholder="Enter lesson content..."
                                                        rows={6}
                                                    />
                                                </div>
                                            ) : lesson.content_type === 'quiz_link' ? (
                                                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                                    <input
                                                        type="text"
                                                        value={lesson.quiz_code || ''}
                                                        onChange={(e) => updateLesson(idx, 'quiz_code', e.target.value)}
                                                        placeholder="Enter Quiz Code"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        className="btn-browse"
                                                        onClick={() => setShowQuizBrowser(idx)}
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Browse Quizzes
                                                    </button>
                                                    <button
                                                        className="btn-browse"
                                                        onClick={() => {
                                                            const width = 1200;
                                                            const height = 800;
                                                            const left = (window.screen.width - width) / 2;
                                                            const top = (window.screen.height - height) / 2;
                                                            window.open(
                                                                `/create-quiz?popup=true&lessonIndex=${idx}`,
                                                                'CreateQuizPopup',
                                                                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
                                                            );
                                                        }}
                                                        style={{ whiteSpace: 'nowrap', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                                                    >
                                                        <Plus size={14} style={{ marginRight: '4px' }} />
                                                        Create Quiz
                                                    </button>
                                                </div>
                                            ) : lesson.content_type === 'pdf' ? (
                                                <div className="file-upload-wrapper" style={{ flex: 1 }}>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        id={`pdf-upload-${idx}`}
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            const url = await handleFileUpload(file, 'PDF');
                                                            if (url) updateLesson(idx, 'content_url', url);
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        className="btn-browse"
                                                        onClick={() => {
                                                            const el = document.getElementById(`pdf-upload-${idx}`);
                                                            if (el) el.click();
                                                        }}
                                                        disabled={uploading}
                                                        style={{ width: '100%', padding: '10px' }}
                                                    >
                                                        {uploading ? 'Uploading...' : lesson.content_url ? 'PDF Uploaded ✓' : 'Browse PDF'}
                                                    </button>
                                                </div>
                                            ) : lesson.content_type === 'video' ? (
                                                <div className="file-upload-wrapper" style={{ flex: 1 }}>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        id={`video-upload-${idx}`}
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            const url = await handleFileUpload(file, 'Video');
                                                            if (url) updateLesson(idx, 'content_url', url);
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        className="btn-browse"
                                                        onClick={() => {
                                                            const el = document.getElementById(`video-upload-${idx}`);
                                                            if (el) el.click();
                                                        }}
                                                        disabled={uploading}
                                                        style={{ width: '100%', padding: '10px' }}
                                                    >
                                                        {uploading ? 'Uploading Video...' : lesson.content_url ? 'Video Selected ✓' : 'Browse Video'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={lesson.content_url}
                                                    onChange={(e) => updateLesson(idx, 'content_url', e.target.value)}
                                                    placeholder={`Enter ${lesson.content_type} URL`}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        className="btn-delete-lesson"
                                        onClick={() => removeLesson(idx)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div >

            {/* Quiz Browser Modal */}
            {
                showQuizBrowser !== null && (
                    <div className="modal-overlay" onClick={() => setShowQuizBrowser(null)}>
                        <div className="quiz-browser-modal glassmorphism-lms" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Select a Quiz</h3>
                                <button className="btn-close" onClick={() => setShowQuizBrowser(null)}>×</button>
                            </div>
                            <div className="quiz-list-scroll">
                                {availableQuizzes.length === 0 ? (
                                    <p className="empty-msg">No quizzes found. Please create a quiz first.</p>
                                ) : (
                                    availableQuizzes.map(quiz => (
                                        <div
                                            key={quiz.id}
                                            className="quiz-selection-item"
                                            onClick={() => {
                                                updateLesson(showQuizBrowser, 'quiz_code', quiz.access_code);
                                                setShowQuizBrowser(null);
                                            }}
                                        >
                                            <div className="quiz-info">
                                                <span className="quiz-title">{quiz.title}</span>
                                                <span className="quiz-code-badge">{quiz.access_code}</span>
                                            </div>
                                            <Plus size={18} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .modal-overlay {
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
                }
                .quiz-browser-modal {
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    background: #1e1b4b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .btn-close {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.5rem;
                    cursor: pointer;
                    opacity: 0.5;
                }
                .btn-close:hover { opacity: 1; }
                .quiz-list-scroll {
                    overflow-y: auto;
                    padding: 10px;
                }
                .quiz-selection-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.03);
                }
                .quiz-selection-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateX(5px);
                }
                .quiz-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .quiz-title {
                    font-weight: 600;
                    color: #fff;
                }
                .quiz-code-badge {
                    font-size: 0.75rem;
                    background: rgba(99, 102, 241, 0.2);
                    color: #818cf8;
                    padding: 2px 8px;
                    border-radius: 4px;
                    width: fit-content;
                }
                .empty-msg {
                    text-align: center;
                    padding: 40px;
                    color: rgba(255, 255, 255, 0.4);
                }
            `}</style>
        </div >
    );
}
