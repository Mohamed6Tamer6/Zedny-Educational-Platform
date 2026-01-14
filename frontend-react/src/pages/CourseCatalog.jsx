/**
 * =============================================================================
 * Course Catalog Page - LMS Feature
 * =============================================================================
 * Browse all published courses in the LMS.
 * Students can view course cards and enroll in courses.
 * 
 * Features:
 * - Grid layout with course cards
 * - Search by title
 * - Filter by category
 * - Enroll button
 * - Premium glassmorphism design
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { BookOpen, Users, Clock, Search, Filter, GraduationCap, ChevronRight } from 'lucide-react';
import '../styles/LMS.css';

const API_URL = '/api/v1';

export default function CourseCatalog() {
    const { token, user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const categories = ['All', 'Programming', 'Mathematics', 'Science', 'Languages', 'Business', 'Design'];

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchCourses(searchTerm);
        }, 500); // Debounce search

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const fetchCourses = async (query = '') => {
        try {
            setLoading(true);
            const url = query
                ? `${API_URL}/courses/?search=${encodeURIComponent(query)}`
                : `${API_URL}/courses/`;

            const res = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        if (!token) {
            showNotification('Please login to enroll in courses', 'warning');
            navigate('/login');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                showNotification('Successfully enrolled in course!', 'success');
                navigate(`/courses/${courseId}`);
            } else {
                const error = await res.json();
                showNotification(error.detail || 'Enrollment failed', 'error');
            }
        } catch (err) {
            showNotification('Network error', 'error');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.access_code && course.access_code.toUpperCase() === searchTerm.toUpperCase().trim());

        const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="lms-page">
            {/* Background Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            {/* Header */}
            <header className="lms-header">
                <Link to="/dashboard" className="lms-logo">
                    Zedny<span className="dot">.</span> <span className="lms-badge">LMS</span>
                </Link>
                <nav className="lms-nav">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/courses" className="active">Courses</Link>
                    {user?.role === 'TEACHER' && <Link to="/create-course">Create Course</Link>}
                </nav>
            </header>

            {/* Hero Section */}
            <section className="catalog-hero">
                <div className="hero-content">
                    <h1>
                        <GraduationCap size={48} className="hero-icon" />
                        Explore Courses
                    </h1>
                    <p>Discover new skills and advance your knowledge with our curated courses</p>
                </div>

                {/* Search Bar */}
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Pills */}
                <div className="category-pills">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`pill ${selectedCategory === cat || (cat === 'All' && selectedCategory === '') ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* Course Grid */}
            <section className="courses-grid">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading courses...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={64} />
                        <h3>No courses found</h3>
                        <p>Check back later or try a different search</p>
                    </div>
                ) : (
                    filteredCourses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-thumbnail">
                                {course.thumbnail_url ? (
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
                                    style={{
                                        display: course.thumbnail_url ? 'none' : 'flex',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}
                                >
                                    <div className="placeholder-content">
                                        <BookOpen size={40} className="opacity-20" />
                                        <span className="placeholder-letter">{course.title.charAt(0)}</span>
                                    </div>
                                </div>
                                <div className="course-badges-overlay">
                                    <span className="category-tag">{course.category || 'General'}</span>
                                    {course.status === 'private' && (
                                        <span className="private-tag">Private</span>
                                    )}
                                </div>
                            </div>
                            <div className="course-body">
                                <h3>{course.title}</h3>
                                <p className="teacher-name">by {course.teacher_name || 'Instructor'}</p>
                                <div className="course-meta">
                                    <span><BookOpen size={14} /> {course.lesson_count} lessons</span>
                                    <span><Users size={14} /> {course.enrollment_count} enrolled</span>
                                </div>
                            </div>
                            <div className="course-footer">
                                <button
                                    className="btn-enroll"
                                    onClick={() => handleEnroll(course.id)}
                                >
                                    Enroll Now <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )
                }
            </section >
        </div >
    );
}
