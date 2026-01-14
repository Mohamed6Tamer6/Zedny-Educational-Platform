# ZEDNY DATABASE ARCHITECTURE REPORT
# ═══════════════════════════════════════════

## 1. DATABASE OVERVIEW

### PostgreSQL Database Structure
The Zedny Educational Platform uses PostgreSQL with SQLAlchemy ORM (async) for database management.

**Connection Details:**
- Engine: PostgreSQL with asyncpg driver
- Session: Async session factory
- Base: Declarative Base for all models
- Migrations: Alembic for schema versioning

---

## 2. DATABASE TABLES & MODELS

### 2.1 User Management

#### **users** table
**Model:** `app.models.user.User`
**Purpose:** Store user authentication and profile data

| Column          | Type       | Constraints          | Description                |
|-----------------|------------|----------------------|----------------------------|
| id              | Integer    | PK, Index            | User ID                    |
| email           | String(255)| Unique, Index, NotNull| Email for login           |
| hashed_password | String(255)| NotNull              | Bcrypt hashed password     |
| full_name       | String(100)| Nullable             | Display name               |
| role            | Enum       | Default=STUDENT      | STUDENT/TEACHER/SUPER_ADMIN|
| is_active       | Boolean    | Default=True         | Account active status      |
| is_verified     | Boolean    | Default=False        | Email verification status  |
| created_at      | DateTime   | server_default=now() | Registration timestamp     |
| updated_at      | DateTime   | onupdate=now()       | Last update timestamp      |

**Relationships:**
- `quizzes` → Many Quiz (as teacher)
- `courses` → Many Course (as teacher)
- `enrollments` → Many Enrollment (as student)
- `attempts` → Many QuizAttempt
- `participations` → Many QuizParticipation

---

### 2.2 Quiz System

#### **quizzes** table
**Model:** `app.models.quiz.Quiz`
**Purpose:** Main quiz containers

| Column       | Type        | Constraints          | Description              |
|--------------|-------------|----------------------|--------------------------|
| id           | Integer     | PK, Index            | Quiz ID                  |
| title        | String(200) | NotNull              | Quiz title               |
| description  | Text        | Nullable             | Quiz description         |
| access_code  | String(10)  | Unique, Index, NotNull| Join code (e.g., ABC123)|
| is_public    | Boolean     | Default=False        | Public accessibility     |
| teacher_id   | Integer     | FK(users.id), NotNull| Creator teacher          |
| created_at   | DateTime    | server_default=now() | Creation timestamp       |
| updated_at   | DateTime    | onupdate=now()       | Last update timestamp    |

**Foreign Keys:**
- `teacher_id` → users.id

**Relationships:**
- `teacher` → User (many-to-one)
- `questions` → Many Question (cascade delete)
- `attempts` → Many QuizAttempt (cascade delete)
- `participations` → Many QuizParticipation (backref)

---

#### **questions** table
**Model:** `app.models.quiz.Question`
**Purpose:** Store quiz questions

| Column        | Type     | Constraints          | Description                |
|---------------|----------|----------------------|----------------------------|
| id            | Integer  | PK, Index            | Question ID                |
| text          | Text     | NotNull              | Question text              |
| question_type | Enum     | Default=multiple_choice| Question type           |
| points        | Integer  | Default=1000         | Points for correct answer  |
| time_limit    | Integer  | Default=30           | Time limit in seconds      |
| quiz_id       | Integer  | FK(quizzes.id), NotNull| Parent quiz             |

**Question Types:**
- `multiple_choice` - Single correct answer
- `true_false` - Boolean question
- `multiple_select` - Multiple correct answers

**Foreign Keys:**
- `quiz_id` → quizzes.id

**Relationships:**
- `quiz` → Quiz (many-to-one)
- `choices` → Many Choice (cascade delete)

---

#### **choices** table
**Model:** `app.models.quiz.Choice`
**Purpose:** Answer choices for questions

| Column      | Type        | Constraints          | Description            |
|-------------|-------------|----------------------|------------------------|
| id          | Integer     | PK, Index            | Choice ID              |
| text        | String(255) | NotNull              | Choice text            |
| is_correct  | Boolean     | Default=False        | Correct answer flag    |
| question_id | Integer     | FK(questions.id), NotNull| Parent question    |

**Foreign Keys:**
- `question_id` → questions.id

**Relationships:**
- `question` → Question (many-to-one)

---

#### **quiz_attempts** table
**Model:** `app.models.quiz.QuizAttempt`
**Purpose:** Track completed quiz attempts and scores

| Column          | Type     | Constraints          | Description                |
|-----------------|----------|----------------------|----------------------------|
| id              | Integer  | PK, Index            | Attempt ID                 |
| quiz_id         | Integer  | FK(quizzes.id), NotNull| Quiz taken              |
| user_id         | Integer  | FK(users.id), NotNull| Student                  |
| score           | Integer  | Default=0            | Total points earned        |
| total_questions | Integer  | NotNull              | Number of questions        |
| correct_answers | Integer  | Default=0            | Number correct             |
| rank            | String(50)| Nullable            | Performance rank           |
| completed_at    | DateTime | server_default=now() | Completion timestamp       |

**Foreign Keys:**
- `quiz_id` → quizzes.id
- `user_id` → users.id

**Relationships:**
- `quiz` → Quiz (many-to-one)
- `user` → User (many-to-one)

**Note:** Used to display performance history and statistics

---

#### **quiz_participations** table
**Model:** `app.models.quiz.QuizParticipation`
**Purpose:** Track every time a student enters/joins a quiz

| Column     | Type     | Constraints          | Description            |
|------------|----------|----------------------|------------------------|
| id         | Integer  | PK, Index            | Participation ID       |
| quiz_id    | Integer  | FK(quizzes.id), NotNull| Quiz joined         |
| user_id    | Integer  | FK(users.id), NotNull| Student              |
| entered_at | DateTime | server_default=now() | Entry timestamp        |

**Foreign Keys:**
- `quiz_id` → quizzes.id
- `user_id` → users.id

**Relationships:**
- `quiz` → Quiz (backref)
- `user` → User (backref)

**Note:** Used for teacher dashboard to show unique participants count

---

### 2.3 LMS (Learning Management System)

#### **courses** table
**Model:** `app.models.course.Course`
**Purpose:** Course containers created by teachers

| Column        | Type        | Constraints          | Description            |
|---------------|-------------|----------------------|------------------------|
| id            | Integer     | PK, Index            | Course ID              |
| title         | String(200) | NotNull              | Course title           |
| description   | Text        | Nullable             | Course description     |
| thumbnail_url | String(500) | Nullable             | Cover image URL        |
| category      | String(100) | Nullable             | Course category        |
| is_published  | Boolean     | Default=False        | Published status       |
| teacher_id    | Integer     | FK(users.id), NotNull| Creator teacher       |
| created_at    | DateTime    | server_default=now() | Creation timestamp     |
| updated_at    | DateTime    | onupdate=now()       | Last update timestamp  |

**Foreign Keys:**
- `teacher_id` → users.id

**Relationships:**
- `teacher` → User (backref)
- `lessons` → Many Lesson (cascade delete, ordered by order_index)
- `enrollments` → Many Enrollment (cascade delete)

---

#### **lessons** table
**Model:** `app.models.course.Lesson`
**Purpose:** Individual learning units within courses

| Column           | Type        | Constraints          | Description               |
|------------------|-------------|----------------------|---------------------------|
| id               | Integer     | PK, Index            | Lesson ID                 |
| title            | String(200) | NotNull              | Lesson title              |
| content_type     | Enum        | Default=TEXT         | Content type              |
| content_url      | String(500) | Nullable             | Video/PDF URL             |
| content_text     | Text        | Nullable             | Text content              |
| order_index      | Integer     | Default=0            | Display order             |
| duration_minutes | Integer     | Default=0            | Estimated duration        |
| course_id        | Integer     | FK(courses.id), NotNull| Parent course          |
| linked_quiz_id   | Integer     | FK(quizzes.id), Nullable| Optional quiz link     |
| quiz_code        | String(10)  | Nullable             | Quiz access code          |
| created_at       | DateTime    | server_default=now() | Creation timestamp        |

**Content Types:**
- `VIDEO` - Video lessons
- `TEXT` - Text-based lessons
- `PDF` - PDF documents
- `QUIZ_LINK` - Link to quiz

**Foreign Keys:**
- `course_id` → courses.id
- `linked_quiz_id` → quizzes.id (optional)

**Relationships:**
- `course` → Course (many-to-one)
- `linked_quiz` → Quiz (optional)
- `progress_records` → Many LessonProgress (cascade delete)

---

#### **enrollments** table
**Model:** `app.models.course.Enrollment`
**Purpose:** Student course subscriptions

| Column           | Type     | Constraints          | Description            |
|------------------|----------|----------------------|------------------------|
| id               | Integer  | PK, Index            | Enrollment ID          |
| user_id          | Integer  | FK(users.id), NotNull| Student               |
| course_id        | Integer  | FK(courses.id), NotNull| Course              |
| status           | Enum     | Default=ACTIVE       | Enrollment status      |
| progress_percent | Float    | Default=0.0          | Completion percentage  |
| enrolled_at      | DateTime | server_default=now() | Enrollment timestamp   |
| completed_at     | DateTime | Nullable             | Completion timestamp   |

**Enrollment Status:**
- `ACTIVE` - Currently enrolled
- `COMPLETED` - Course completed
- `DROPPED` - Student dropped course

**Foreign Keys:**
- `user_id` → users.id
- `course_id` → courses.id

**Relationships:**
- `user` → User (backref)
- `course` → Course (many-to-one)
- `lesson_progress` → Many LessonProgress (cascade delete)

---

#### **lesson_progress** table
**Model:** `app.models.course.LessonProgress`
**Purpose:** Track lesson completion for each student

| Column             | Type     | Constraints          | Description               |
|--------------------|----------|----------------------|---------------------------|
| id                 | Integer  | PK, Index            | Progress ID               |
| enrollment_id      | Integer  | FK(enrollments.id), NotNull| Enrollment         |
| lesson_id          | Integer  | FK(lessons.id), NotNull| Lesson                |
| status             | Enum     | Default=NOT_STARTED  | Lesson status             |
| time_spent_seconds | Integer  | Default=0            | Time spent on lesson      |
| started_at         | DateTime | Nullable             | Start timestamp           |
| completed_at       | DateTime | Nullable             | Completion timestamp      |

**Lesson Status:**
- `NOT_STARTED` - Not yet started
- `IN_PROGRESS` - Currently working on
- `COMPLETED` - Finished

**Foreign Keys:**
- `enrollment_id` → enrollments.id
- `lesson_id` → lessons.id

**Relationships:**
- `enrollment` → Enrollment (many-to-one)
- `lesson` → Lesson (many-to-one)

---

## 3. DATA RELATIONSHIPS SUMMARY

### Quiz System Flow:
```
User (Teacher) → creates → Quiz
Quiz → contains → Questions
Question → has → Choices
User (Student) → joins → Quiz → creates → QuizParticipation
User (Student) → completes → Quiz → creates → QuizAttempt
```

### LMS Flow:
```
User (Teacher) → creates → Course
Course → contains → Lessons (ordered)
Lesson → optionally links to → Quiz (via quiz_code or linked_quiz_id)
User (Student) → enrolls in → Course → creates → Enrollment
Enrollment → tracks → LessonProgress (for each lesson)
```

---

## 4. DATABASE INTEGRITY RULES

### Foreign Key Cascades:
1. **Quiz System:**
   - Delete Quiz → Cascade delete Questions, Choices, QuizAttempts
   - Delete User → Keep Quiz records (set NULL or restrict)

2. **LMS System:**
   - Delete Course → Cascade delete Lessons, Enrollments
   - Delete Enrollment → Cascade delete LessonProgress
   - Delete Lesson → Cascade delete LessonProgress

### Unique Constraints:
- `users.email` - Unique
- `quizzes.access_code` - Unique
- No composite unique keys currently defined

### Indexes:
- `users.email` - For fast login lookups
- `quizzes.access_code` - For fast quiz joining
- All primary keys automatically indexed

---

## 5. SCHEMAS & API VALIDATION

### Schema Layer Structure:
```
app/schemas/
├── user.py      - UserRegister, UserLogin, UserResponse, Token
├── quiz.py      - Quiz, Question, Choice, QuizAttempt schemas
└── course.py    - Course, Lesson, Enrollment, LessonProgress schemas
```

### Key Schema Features:
1. **Pydantic v2** with `from_attributes = True`
2. **Enum consistency** with models
3. **Optional fields** for updates
4. **Nested objects** for API responses (e.g., Quiz with Questions)

---

## 6. MIGRATION HISTORY

| Migration                         | Description                    |
|-----------------------------------|--------------------------------|
| e952c5297bcb_initial_check.py     | Initial setup                  |
| 401fb08bee0d_create_users_table.py| Create users table            |
| f015e4e77dbc_create_quiz_tables.py| Create quiz system tables     |
| 2cf3049dc27e_add_quiz_attempts.py | Add quiz attempt tracking     |
| 956f23533d4a_add_quizparticipation| Add participation tracking    |
| 0bdf70a1ee8b_add_lms_models.py    | Add LMS (courses/lessons)     |
| f0bdf127d5ef_add_quiz_code_to_lessons| Add quiz_code to lessons   |

---

## 7. POTENTIAL ISSUES & RECOMMENDATIONS

### ✓ Strengths:
1. Well-structured relationships with proper cascades
2. Consistent enum usage across models and schemas
3. Good use of timestamps for auditing
4. Proper async session management

### ⚠ Areas to Monitor:
1. **No composite indexes** - Consider adding for common queries:
   - `(quiz_id, user_id)` on quiz_attempts
   - `(course_id, user_id)` on enrollments
   - `(enrollment_id, lesson_id)` on lesson_progress

2. **Missing unique constraints** - Consider adding:
   - Unique constraint on `(quiz_id, user_id)` for quiz_participations to prevent duplicates

3. **Optional relationships** - `lessons.linked_quiz_id` is optional, needs null handling

4. **No soft deletes** - All deletes are hard deletes (may want to preserve history)

5. **Missing indexes** - Consider indexing:
   - `quizzes.teacher_id` for teacher dashboard queries
   - `courses.teacher_id` for course listing
   - `enrollments.user_id` for student dashboard

---

## 8. TESTING RECOMMENDATIONS

### Database Tests:
✓ Connection test
✓ Table existence
✓ Foreign key relationships
✓ Data consistency (orphaned records)
✓ Model-Schema alignment

### Integration Tests:
- Quiz creation → Questions → Choices flow
- Course enrollment → Progress tracking flow
- Quiz participation → Attempt completion flow

### Performance Tests:
- Large quiz with many questions
- Course with many lessons and students
- Dashboard query optimization

---

## 9. ENVIRONMENT SETUP

### Required Environment Variables:
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/zedny_db
SECRET_KEY=your-secret-key
DEBUG=True/False
```

### Database Initialization:
```bash
# Run migrations
alembic upgrade head

# Create super admin
python manage_admin.py
```

---

## 10. CONCLUSION

The Zedny database architecture is well-designed with:
- Clear separation between Quiz and LMS systems
- Proper relationships and cascades
- Good use of enums for type safety
- Async-ready with SQLAlchemy

**Status:** ✅ Production Ready (with recommended optimizations)

---

*Generated: 2026-01-07*
*Version: 1.0*
