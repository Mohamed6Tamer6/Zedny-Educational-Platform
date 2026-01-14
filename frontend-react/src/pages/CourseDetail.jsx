/**
 * =============================================================================
 * Course Detail Page - LMS Feature
 * =============================================================================
 * View course details, lessons, and track progress.
 * 
 * Features:
 * - Course overview with description
 * - Lesson list with progress indicators
 * - Enrollment status display
 * - Start/Continue learning button
 * - Teacher info
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
    BookOpen, Users, Clock, Play, Check, Lock,
    ChevronLeft, User, PlayCircle, FileText, Video, File, MessageSquare, Shield, Heart, Target
} from 'lucide-react';
import CourseCommunity from '../components/CourseCommunity';
import CourseFeedback from '../components/CourseFeedback';
import SkillsGraph from '../components/SkillsGraph';
import '../styles/LMS.css';

const API_URL = '/api/v1';

export default function CourseDetail() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isCommunityOpen, setIsCommunityOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`${API_URL}/courses/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            } else if (res.status === 404) {
                showNotification('Course not found', 'error');
                navigate('/courses');
            }
        } catch (err) {
            console.error('Error fetching course:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!token) {
            showNotification('Please login to enroll', 'warning');
            navigate('/login');
            return;
        }

        setEnrolling(true);
        try {
            const res = await fetch(`${API_URL}/courses/${id}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                showNotification('Successfully enrolled!', 'success');
                fetchCourse(); // Refresh to update enrollment status
            } else {
                const error = await res.json();
                showNotification(error.detail || 'Enrollment failed', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        } finally {
            setEnrolling(false);
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={18} />;
            case 'pdf': return <File size={18} />;
            case 'quiz_link': return <PlayCircle size={18} />;
            default: return <FileText size={18} />;
        }
    };

    if (loading) {
        return (
            <div className="lms-page">
                <div className="loading-state" style={{ height: '100vh' }}>
                    <div className="spinner"></div>
                    <p>Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const isOwner = user && course.teacher_id === user.id;

    return (
        <div className="lms-page">
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            {/* Header */}
            <header className="lms-header">
                <Link to="/courses" className="back-link">
                    <ChevronLeft size={20} /> Back to Courses
                </Link>
                {isOwner && (
                    <Link to={`/edit-course/${id}`} className="btn-edit-course">
                        Edit Course
                    </Link>
                )}
            </header>

            {/* Course Hero */}
            <section className="course-hero">
                <div className="hero-thumbnail" style={{
                    backgroundImage: course.thumbnail_url ? `url(${course.thumbnail_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    {course.category && <span className="category-tag">{course.category}</span>}
                </div>
                <div className="hero-info">
                    <h1>{course.title}</h1>
                    <p className="description">{course.description || 'No description provided'}</p>

                    <div className="course-stats">
                        <span><User size={16} /> {course.teacher_name || 'Instructor'}</span>
                        <span><BookOpen size={16} /> {course.lessons?.length || 0} Lessons</span>
                        <span><Users size={16} /> {course.enrollment_count} Students</span>
                    </div>

                    {isOwner ? (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link
                                to={`/courses/${id}/lessons/${course.lessons?.[0]?.id || 1}`}
                                className="btn-start-learning admin-btn"
                            >
                                <Shield size={20} /> View as Admin
                            </Link>
                            <button
                                className="btn-start-learning"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setIsFeedbackOpen(true)}
                            >
                                <MessageSquare size={20} /> View Reviews
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {course.is_enrolled ? (
                                <Link
                                    to={`/courses/${id}/lessons/${course.lessons?.[0]?.id || 1}`}
                                    className="btn-start-learning"
                                >
                                    <Play size={20} /> Continue Learning
                                </Link>
                            ) : (
                                <button
                                    className="btn-start-learning"
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                >
                                    {enrolling ? 'Enrolling...' : 'Enroll Now - Free'}
                                </button>
                            )}

                            {course.is_enrolled && (
                                <button
                                    className="btn-start-learning"
                                    style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', color: '#ff6b6b' }}
                                    onClick={() => setIsFeedbackOpen(true)}
                                >
                                    <Heart size={20} /> Course Review
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Skills Graph Section */}
            {course.target_skills && (
                <section className="skills-insight-section">
                    <div className="section-header">
                        <div className="title-wrap">
                            <Target className="text-blue-400" />
                            <h2>Skills You Will Master</h2>
                        </div>
                        <p>Targeted learning outcomes for this curriculum.</p>
                    </div>

                    <div className="skills-graph-card glassmorphism">
                        {(() => {
                            try {
                                const skillsData = JSON.parse(course.target_skills);
                                if (skillsData.length > 0) {
                                    return <SkillsGraph skills={skillsData} size={window.innerWidth < 768 ? 250 : 350} />;
                                }
                            } catch (e) {
                                return null;
                            }
                            return null;
                        })()}
                    </div>
                </section>
            )}

            {/* Lessons List */}
            <section className="lessons-section">
                <h2>Course Content</h2>
                <div className="lessons-list">
                    {course.lessons && course.lessons.length > 0 ? (
                        course.lessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                className={`lesson-item ${!course.is_enrolled && !isOwner ? 'locked' : ''}`}
                                onClick={() => {
                                    if (course.is_enrolled || isOwner) {
                                        navigate(`/courses/${id}/lessons/${lesson.id}`);
                                    } else {
                                        showNotification('Enroll to access lessons', 'warning');
                                    }
                                }}
                            >
                                <div className="lesson-index">{idx + 1}</div>
                                <div className="lesson-icon">
                                    {getContentIcon(lesson.content_type)}
                                </div>
                                <div className="lesson-info">
                                    <h4>{lesson.title}</h4>
                                    <span className="lesson-type">{lesson.content_type?.toUpperCase()}</span>
                                </div>
                                <div className="lesson-duration">
                                    {lesson.duration_minutes > 0 ? `${lesson.duration_minutes} min` : '--'}
                                </div>
                                <div className="lesson-status">
                                    {!course.is_enrolled && !isOwner ? (
                                        <Lock size={16} />
                                    ) : (
                                        <Play size={16} />
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-lessons">
                            <BookOpen size={48} />
                            <p>No lessons added yet</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Community FAB */}
            {(course.is_enrolled || isOwner) && (
                <button
                    className="community-fab"
                    onClick={() => setIsCommunityOpen(true)}
                    title="Course Community"
                >
                    <MessageSquare size={28} />
                    <span className="fab-label">Community</span>
                </button>
            )}

            {/* Community Hub Modal */}
            <CourseCommunity
                isOpen={isCommunityOpen}
                onClose={() => setIsCommunityOpen(false)}
                courseId={id}
                courseTitle={course.title}
            />

            {/* Course Feedback Modal */}
            <CourseFeedback
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                courseId={id}
                isOwner={isOwner}
            />

            <style jsx>{`
                .community-fab {
                    position: fixed;
                    right: 40px;
                    bottom: 40px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 0 24px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 100;
                }

                .community-fab:hover {
                    transform: scale(1.05) translateY(-5px);
                    box-shadow: 0 15px 35px rgba(59, 130, 246, 0.5);
                }

                .fab-label {
                    font-weight: 600;
                    font-size: 1rem;
                }

                @media (max-width: 768px) {
                    .community-fab {
                        right: 20px;
                        bottom: 20px;
                        width: 60px;
                        height: 60px;
                        padding: 0;
                        justify-content: center;
                        border-radius: 20px;
                    }
                    .fab-label { display: none; }
                }
            `}</style>
        </div>
    );
}
