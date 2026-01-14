"""
=============================================================================
LMS Courses Endpoints Module
=============================================================================
API endpoints for Learning Management System courses and lessons.

Endpoints:
- GET /courses/: List all published courses (public catalog)
- POST /courses/: Create a new course (Teacher)
- GET /courses/my-teaching: Get teacher's own courses
- GET /courses/my-enrollments: Get student's enrolled courses
- GET /courses/{id}: Get course detail with lessons
- PUT /courses/{id}: Update course (Owner)
- DELETE /courses/{id}: Delete course (Owner)
- POST /courses/{id}/lessons: Add lesson to course (Owner)
- PUT /courses/{id}/lessons/{lesson_id}: Update lesson (Owner)
- DELETE /courses/{id}/lessons/{lesson_id}: Delete lesson (Owner)
- POST /courses/{id}/enroll: Enroll in course (Student)
- POST /lessons/{id}/progress: Update lesson progress (Student)
- GET /courses/{id}/stats: Get course analytics (Owner)

Author: Zedny Development Team
=============================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.course import Course, Lesson, Enrollment, LessonProgress, CommunityMessage, EnrollmentStatus, LessonStatus, ContentType, CourseFeedback, CourseStatus
from app.schemas import course as schemas
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
import random
import string

def generate_access_code(length=8):
    """Generate a random alphanumeric access code for courses."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


# ============ COURSE CRUD ============

@router.get("/", response_model=List[schemas.CourseList])
async def list_courses(
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all published courses (public catalog).
    If a search term matches an access_code exactly, even draft courses are returned.
    """
    if search:
        # Search by title OR category (ONLY for published courses)
        # OR exact access_code (for PRIVATE courses)
        from sqlalchemy import or_
        query = select(Course).where(
            or_(
                and_(
                    Course.status == CourseStatus.PUBLISHED,
                    or_(
                        Course.title.ilike(f"%{search}%"),
                        Course.category.ilike(f"%{search}%")
                    )
                ),
                and_(
                    Course.status == CourseStatus.PRIVATE,
                    Course.access_code == search.strip().upper()
                )
            )
        )
    else:
        # Default: only published
        query = select(Course).where(Course.status == CourseStatus.PUBLISHED)
    
    if category and not search:
        query = query.where(Course.category == category)
    
    query = query.offset(skip).limit(limit)
    query = query.options(selectinload(Course.lessons), selectinload(Course.enrollments), selectinload(Course.teacher))
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return [
        {
            **{k: v for k, v in course.__dict__.items() if not k.startswith('_')},
            "teacher_name": course.teacher.full_name if course.teacher else None,
            "lesson_count": len(course.lessons),
            "enrollment_count": len(course.enrollments)
        }
        for course in courses
    ]


@router.post("/", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_in: schemas.CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course (Teachers only)."""
    if current_user.role not in [UserRole.TEACHER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
    
    # Create course
    db_course = Course(
        title=course_in.title,
        description=course_in.description,
        category=course_in.category,
        thumbnail_url=course_in.thumbnail_url,
        status=course_in.status,
        target_skills=course_in.target_skills,
        teacher_id=current_user.id
    )
    
    # Generate unique access code if PRIVATE (or optional for PUBLISHED)
    # Draft courses should not have an active access code reachable by others
    if course_in.status != CourseStatus.DRAFT:
        if not course_in.access_code:
            access_code = generate_access_code()
            # Verify uniqueness
            while True:
                existing = await db.execute(select(Course).where(Course.access_code == access_code))
                if not existing.scalar_one_or_none():
                    break
                access_code = generate_access_code()
            db_course.access_code = access_code
        else:
            db_course.access_code = course_in.access_code.strip().upper()
    else:
        # For drafts, we can still set the code if provided, otherwise it stays null/empty
        if course_in.access_code:
            db_course.access_code = course_in.access_code.strip().upper()
        else:
            db_course.access_code = f"DRAFT_{generate_access_code(4)}"


    db.add(db_course)
    await db.flush()
    
    # Add lessons if provided
    for idx, lesson_in in enumerate(course_in.lessons):
        db_lesson = Lesson(
            course_id=db_course.id,
            title=lesson_in.title,
            content_type=lesson_in.content_type,
            content_url=lesson_in.content_url,
            content_text=lesson_in.content_text,
            order_index=lesson_in.order_index or idx,
            duration_minutes=lesson_in.duration_minutes,
            linked_quiz_id=lesson_in.linked_quiz_id,
            quiz_code=lesson_in.quiz_code
        )
        db.add(db_lesson)
    
    await db.commit()
    
    # Refresh with relations
    query = select(Course).where(Course.id == db_course.id).options(selectinload(Course.lessons))
    result = await db.execute(query)
    return result.scalar_one()


@router.get("/my-teaching", response_model=List[schemas.CourseList])
async def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get courses created by the current teacher."""
    query = select(Course).where(Course.teacher_id == current_user.id).options(
        selectinload(Course.lessons),
        selectinload(Course.enrollments)
    )
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return [
        {
            **{k: v for k, v in course.__dict__.items() if not k.startswith('_')},
            "teacher_name": current_user.full_name,
            "lesson_count": len(course.lessons),
            "enrollment_count": len(course.enrollments)
        }
        for course in courses
    ]



@router.get("/my-enrollments", response_model=List[schemas.EnrollmentWithCourse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get courses the current student is enrolled in."""
    query = select(Enrollment).where(Enrollment.user_id == current_user.id).options(
        selectinload(Enrollment.course).selectinload(Course.lessons),
        selectinload(Enrollment.lesson_progress)
    )
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    return [
        {
            "id": e.id,
            "user_id": e.user_id,
            "course_id": e.course_id,
            "status": e.status,
            "progress_percent": e.progress_percent,
            "enrolled_at": e.enrolled_at,
            "completed_at": e.completed_at,
            "course_title": e.course.title,
            "total_lessons": len(e.course.lessons),
            "completed_lessons": len([lp for lp in e.lesson_progress if lp.status == LessonStatus.COMPLETED])
        }
        for e in enrollments
    ]


@router.get("/{course_id}", response_model=schemas.CourseDetail)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get course detail with lessons."""
    query = select(Course).where(Course.id == course_id).options(
        selectinload(Course.lessons),
        selectinload(Course.enrollments),
        selectinload(Course.teacher)
    )
    result = await db.execute(query)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if user is enrolled
    is_enrolled = any(e.user_id == current_user.id for e in course.enrollments)
    
    return {
        **{k: v for k, v in course.__dict__.items() if not k.startswith('_')},
        "lessons": course.lessons,
        "teacher_name": course.teacher.full_name if course.teacher else None,
        "enrollment_count": len(course.enrollments),
        "is_enrolled": is_enrolled
    }


@router.put("/{course_id}", response_model=schemas.Course)
async def update_course(
    course_id: int,
    course_in: schemas.CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a course (Owner only)."""
    try:
        # Get course with lessons
        query = select(Course).where(Course.id == course_id).options(selectinload(Course.lessons))
        result = await db.execute(query)
        course = result.scalar_one_or_none()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update main course fields
        update_data = course_in.model_dump(exclude_unset=True, exclude={'lessons'})
        for field, value in update_data.items():
            if field == "access_code" and value:
                value = value.strip().upper()
            setattr(course, field, value)
        
        # Ensure non-draft courses have an access code
        if course.status != CourseStatus.DRAFT and not course.access_code:
            access_code = generate_access_code()
            while True:
                existing = await db.execute(select(Course).where(Course.access_code == access_code))
                if not existing.scalar_one_or_none():
                    break
                access_code = generate_access_code()
            course.access_code = access_code
        
        # Update lessons if provided
        if course_in.lessons is not None:
            # Using the ORM collection is safer and handles cascades automatically
            course.lessons.clear()
            
            for idx, lesson_in in enumerate(course_in.lessons):
                db_lesson = Lesson(
                    course_id=course_id,
                    title=lesson_in.title,
                    content_type=lesson_in.content_type,
                    content_url=lesson_in.content_url,
                    content_text=lesson_in.content_text,
                    order_index=lesson_in.order_index or idx,
                    duration_minutes=lesson_in.duration_minutes,
                    linked_quiz_id=lesson_in.linked_quiz_id,
                    quiz_code=lesson_in.quiz_code
                )
                course.lessons.append(db_lesson)
        
        await db.commit()
        
        # Eager load lessons again for the response
        query = select(Course).where(Course.id == course_id).options(selectinload(Course.lessons))
        result = await db.execute(query)
        return result.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Update failed: {str(e)}"
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course (Owner only)."""
    course = await db.get(Course, course_id)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(course)
    await db.commit()


# ============ LESSONS ============

@router.post("/{course_id}/lessons", response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
async def add_lesson(
    course_id: int,
    lesson_in: schemas.LessonCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a lesson to a course (Owner only)."""
    course = await db.get(Course, course_id)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_lesson = Lesson(
        course_id=course_id,
        title=lesson_in.title,
        content_type=lesson_in.content_type,
        content_url=lesson_in.content_url,
        content_text=lesson_in.content_text,
        order_index=lesson_in.order_index,
        duration_minutes=lesson_in.duration_minutes,
        linked_quiz_id=lesson_in.linked_quiz_id,
        quiz_code=lesson_in.quiz_code
    )
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson


@router.delete("/{course_id}/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lesson from a course (Owner only)."""
    course = await db.get(Course, course_id)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    lesson = await db.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    await db.delete(lesson)
    await db.commit()


# ============ ENROLLMENT ============

@router.post("/{course_id}/enroll", response_model=schemas.Enrollment)
async def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll in a course (Students)."""
    course = await db.get(Course, course_id)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Allow enrollment if PUBLISHED or PRIVATE (if student has access code)
    # Draft courses are strictly for teachers.
    if course.status == CourseStatus.DRAFT:
        if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Course is in draft and only accessible by the teacher")
    
    # Check for existing enrollment
    # Must eager load lesson_progress to avoid MissingGreenlet during response serialization
    existing_result = await db.execute(
        select(Enrollment).where(
            and_(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        ).options(selectinload(Enrollment.lesson_progress))
    )
    existing_enrollment = existing_result.scalars().first()
    if existing_enrollment:
        # If already enrolled, return the existing enrollment successfully.
        # This allows the user to "enroll" multiple times (idempotency) without error,
        # effectively acting as a "Note: You are enrolled, proceed" action.
        return existing_enrollment
    
    try:
        enrollment = Enrollment(
            user_id=current_user.id,
            course_id=course_id,
            status=EnrollmentStatus.ACTIVE
        )
        db.add(enrollment)
        await db.commit()
        
        # Re-fetch with eager loading to avoid MissingGreenlet error during serialization
        # (db.refresh isn't enough for relationships in async)
        query = select(Enrollment).where(Enrollment.id == enrollment.id).options(
            selectinload(Enrollment.lesson_progress)
        )
        result = await db.execute(query)
        full_enrollment = result.scalar_one()
        
        return full_enrollment
    except Exception as e:
        await db.rollback()
        # Log the error (optional)
        print(f"Enrollment error: {str(e)}")
        # Return a proper JSON error 500
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


# ============ PROGRESS ============

@router.post("/lessons/{lesson_id}/progress", response_model=schemas.LessonProgressResponse)
async def update_lesson_progress(
    lesson_id: int,
    progress_in: schemas.LessonProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update lesson progress (Students)."""
    # Get lesson and validate
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Get the latest enrollment (in case of multiple enrollments)
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(Enrollment.user_id == current_user.id, Enrollment.course_id == lesson.course_id)
        ).order_by(Enrollment.enrolled_at.desc())
    )
    enrollment = enrollment_result.scalars().first()
    
    if not enrollment:
        raise HTTPException(status_code=400, detail="Not enrolled in this course")
    
    # Get or create progress
    progress_result = await db.execute(
        select(LessonProgress).where(
            and_(LessonProgress.enrollment_id == enrollment.id, LessonProgress.lesson_id == lesson_id)
        )
    )
    progress = progress_result.scalar_one_or_none()
    
    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id,
            status=progress_in.status,
            started_at=datetime.utcnow() if progress_in.status != LessonStatus.NOT_STARTED else None
        )
        db.add(progress)
    else:
        progress.status = progress_in.status
    
    if progress_in.time_spent_seconds:
        progress.time_spent_seconds += progress_in.time_spent_seconds
    
    if progress_in.status == LessonStatus.COMPLETED:
        progress.completed_at = datetime.utcnow()
    
    await db.commit()
    
    # Update enrollment progress percentage
    total_lessons = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == lesson.course_id)
    )
    total = total_lessons.scalar()
    
    completed_lessons = await db.execute(
        select(func.count(LessonProgress.id)).where(
            and_(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.status == LessonStatus.COMPLETED
            )
        )
    )
    completed = completed_lessons.scalar()
    
    enrollment.progress_percent = (completed / total * 100) if total > 0 else 0
    
    if enrollment.progress_percent >= 100:
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(progress)
    
    return progress


# ============ STATS ============

@router.get("/{course_id}/stats", response_model=schemas.CourseStats)
async def get_course_stats(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get course analytics (Owner only)."""
    course = await db.get(Course, course_id)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Count enrollments
    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.course_id == course_id)
    )
    enrollments = enrollments_result.scalars().all()
    
    total_enrollments = len(enrollments)
    active = len([e for e in enrollments if e.status == EnrollmentStatus.ACTIVE])
    completed = len([e for e in enrollments if e.status == EnrollmentStatus.COMPLETED])
    avg_progress = sum(e.progress_percent for e in enrollments) / total_enrollments if total_enrollments > 0 else 0
    
    # Count lessons
    lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == course_id)
    )
    total_lessons = lessons_result.scalar()
    
    return {
        "total_enrollments": total_enrollments,
        "active_students": active,
        "completed_students": completed,
        "average_progress": round(avg_progress, 1),
        "total_lessons": total_lessons
    }


# ============ COMMUNITY HUB ============

@router.get("/{course_id}/community/messages", response_model=List[schemas.Message])
async def get_community_messages(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages from the course community hub."""
    query = select(CommunityMessage).where(CommunityMessage.course_id == course_id).options(
        selectinload(CommunityMessage.user)
    ).order_by(CommunityMessage.created_at.asc())
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return [
        {
            "id": msg.id,
            "content": msg.content,
            "user_id": msg.user_id,
            "course_id": msg.course_id,
            "created_at": msg.created_at,
            "user_name": msg.user.full_name,
            "user_role": msg.user.role
        }
        for msg in messages
    ]


@router.post("/{course_id}/community/messages", response_model=schemas.Message)
async def post_community_message(
    course_id: int,
    message_in: schemas.MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Post a new message to the community hub."""
    db_message = CommunityMessage(
        content=message_in.content,
        user_id=current_user.id,
        course_id=course_id
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    return {
        "id": db_message.id,
        "content": db_message.content,
        "user_id": db_message.user_id,
        "course_id": db_message.course_id,
        "created_at": db_message.created_at,
        "user_name": current_user.full_name,
        "user_role": current_user.role
    }


# ============ FEEDBACK ============

@router.post("/{course_id}/feedback", response_model=schemas.FeedbackResponse)
async def post_feedback(
    course_id: int,
    feedback_in: schemas.FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit feedback for a course.
    Only enrolled students can submit feedback.
    Feedback is anonymous to the teacher.
    """
    try:
        # Check enrollment
        enrollment_query = select(Enrollment).where(
            and_(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        )
        result = await db.execute(enrollment_query)
        if not result.scalars().first():
            raise HTTPException(status_code=403, detail="Must be enrolled to give feedback")
        
        # Check if already submitted
        existing_query = select(CourseFeedback).where(
            and_(CourseFeedback.user_id == current_user.id, CourseFeedback.course_id == course_id)
        )
        res_existing = await db.execute(existing_query)
        if res_existing.scalars().first():
            raise HTTPException(status_code=400, detail="Feedback already submitted for this course")

        db_feedback = CourseFeedback(
            content=feedback_in.content,
            rating=feedback_in.rating,
            user_id=current_user.id,
            course_id=course_id
        )
        db.add(db_feedback)
        await db.commit()
        await db.refresh(db_feedback)
        
        return db_feedback
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{course_id}/feedback", response_model=List[schemas.FeedbackResponse])
async def get_feedback(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all feedback for a course.
    Only the teacher who owns the course can see this.
    Returned data is anonymous.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only the course owner can view feedback")
    
    query = select(CourseFeedback).where(CourseFeedback.course_id == course_id).order_by(CourseFeedback.created_at.desc())
    result = await db.execute(query)
    feedback_list = result.scalars().all()
    
    return feedback_list

# ============ STUDENTS ============

@router.get("/{course_id}/students", response_model=List[schemas.EnrollmentWithCourse])
async def get_course_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all students enrolled in a course with their progress.
    Only the course teacher can access this.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.teacher_id != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(Enrollment).where(Enrollment.course_id == course_id).options(
        selectinload(Enrollment.user),
        selectinload(Enrollment.course).selectinload(Course.lessons),
        selectinload(Enrollment.lesson_progress)
    )
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    # Aggregate by student email
    students_map = {}
    
    for e in enrollments:
        if not e.user: continue
        email = e.user.email
        
        # Calculate completed lessons for this specific enrollment
        comp_lessons = len([lp for lp in e.lesson_progress if lp.status == LessonStatus.COMPLETED])
        
        if email not in students_map:
            students_map[email] = {
                "data": e,
                "max_progress": e.progress_percent,
                "count": 1,
                "comp_lessons": comp_lessons
            }
        else:
            current = students_map[email]
            current["count"] += 1
            # Update to better progress if found
            if e.progress_percent > current["max_progress"]:
                current["max_progress"] = e.progress_percent
                current["data"] = e
                current["comp_lessons"] = comp_lessons
            # Keep latest status if progress is same? usually max progress implies best status
            
    # Convert back to list
    final_list = []
    for email, info in students_map.items():
        e = info["data"]
        # Determine strict status based on max progress
        final_status = e.status
        if info["max_progress"] >= 100:
            final_status = EnrollmentStatus.COMPLETED
            
        final_list.append({
            "id": e.id,
            "user_id": e.user_id,
            "course_id": e.course_id,
            "status": final_status,
            "progress_percent": info["max_progress"],
            "enrolled_at": e.enrolled_at,
            "completed_at": e.completed_at,
            "course_title": course.title,
            "total_lessons": len(course.lessons),
            "completed_lessons": info["comp_lessons"],
            "student_name": e.user.full_name,
            "student_email": e.user.email,
            "enrollment_count": info["count"]
        })
        
    return final_list

