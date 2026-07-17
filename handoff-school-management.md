# SCHOOL MANAGEMENT SYSTEM (MEDRESE APP) - COMPLETE ARCHITECTURE HANDOFF

## Project Overview

This project is a complete School Management System built with:

Backend
- Laravel 13
- PHP 8.4+
- MySQL / MariaDB
- Sanctum Authentication
- Eloquent ORM

Frontend
- React
- Vite
- TailwindCSS
- shadcn/ui

The goal is NOT to rebuild the application.

The goal is to gradually refactor the existing architecture into a scalable and professional School Information System (SIS) while preserving existing functionality.

------------------------------------------------------------

# CURRENT STATUS

The project already contains:

✔ Authentication
✔ Users
✔ Students
✔ Classes
✔ Subjects
✔ Attendance
✔ Announcements
✔ Finance
✔ Dormitory
✔ Documents
✔ Dashboard
✔ Multiple Roles

Existing functionality must remain working.

Do NOT delete existing code unless there is a better replacement.

Always migrate gradually.

------------------------------------------------------------

# MAIN PROBLEM

The current database design is too tightly coupled.

Students currently contain:

class_id

This design creates multiple problems.

A student changes class every academic year.

The application must preserve the complete academic history.

Therefore students must NEVER permanently belong to a single class.

------------------------------------------------------------

# DESIGN PRINCIPLES

Always follow these principles.

• Database First
• Relationships First
• Eloquent First
• Reusable Services
• Clean Architecture
• SOLID
• Repository only if necessary
• API Resources
• Form Requests
• Policies
• Transactions
• Foreign Keys
• Indexes
• Composite Unique Constraints

------------------------------------------------------------

# SCHOOL YEARS

Create a dedicated model.

school_years

Fields

id
name
start_date
end_date
status
created_at
updated_at

Rules

Only ONE school year may be ACTIVE.

All academic records belong to a school year.

Examples

2025/2026

2026/2027

2027/2028

------------------------------------------------------------

# ENROLLMENTS

Replace direct student->class relation.

Create

enrollments

Fields

id
student_id
school_year_id
class_id
enrollment_date
exit_date
status
created_at
updated_at

Status

ACTIVE
PROMOTED
REPEATED
TRANSFERRED
GRADUATED
WITHDRAWN

Rules

Student hasMany Enrollments

Class hasMany Enrollments

SchoolYear hasMany Enrollments

Only ONE ACTIVE enrollment per student.

Never overwrite historical records.

------------------------------------------------------------

# CLASSES

Refactor classes table.

Fields

id
school_year_id
grade
parallel
name
guardian_id
capacity
status
created_at
updated_at

Example

10/1

10/2

11/3

12/1

------------------------------------------------------------

# SUBJECTS

Subjects remain independent.

Never duplicate subjects every year.

------------------------------------------------------------

# CLASS SUBJECT TEACHERS

Create pivot table.

class_subject_teacher

Fields

id
school_year_id
class_id
subject_id
teacher_id

Rules

One teacher teaches one subject to one class.

Everything else references this table.

------------------------------------------------------------

# TIMETABLE

timetable_slots

Fields

id
class_subject_teacher_id
day_of_week
lesson_number
start_time
end_time
room

Never duplicate teacher information.

------------------------------------------------------------

# ATTENDANCE

attendance_records

Fields

id
student_id
class_subject_teacher_id
attendance_date
lesson_number
status
remarks

Status

Present

Absent

Late

Excused

Everything references class_subject_teacher.

------------------------------------------------------------

# GRADES

grades

Fields

id
student_id
class_subject_teacher_id
assessment_type
score
max_score
weight
graded_at

Assessment Types

Homework

Quiz

Oral

Assignment

Exam

Final Exam

------------------------------------------------------------

# ANNOUNCEMENTS

May target

Entire School

Specific Class

Specific Role

Specific Student

------------------------------------------------------------

# DOCUMENTS

Separate

document_types

documents

student_documents

teacher_documents

------------------------------------------------------------

# DORMITORY

Keep separated from academic data.

Dormitory must never depend on class assignments.

------------------------------------------------------------

# FINANCE

Payments must belong to students.

Never depend on class_id.

------------------------------------------------------------

# PROMOTION SERVICE

Create PromotionService.

Responsibilities

Archive current enrollments

Create next year

Promote

Repeat

Graduate

Everything inside Database Transactions.

------------------------------------------------------------

# DASHBOARD

Create DashboardService.

Never place heavy queries inside controllers.

Use Cache when appropriate.

------------------------------------------------------------

# AUDIT LOG

Create audit_logs.

Fields

id
user_id
action
table_name
record_id
old_values
new_values
ip_address
created_at

------------------------------------------------------------

# AUTHORIZATION

Use

Laravel Policies

or

spatie/laravel-permission

Avoid hardcoded role checks.

------------------------------------------------------------

# API

Controllers must remain thin.

Controller

↓

Service

↓

Model

Validation

↓

Form Requests

Responses

↓

API Resources

------------------------------------------------------------

# MODELS TO REFACTOR

Student

Enrollment

SchoolYear

ClassModel

AttendanceRecord

Grade

Subject

ClassSubjectTeacher

TimetableSlot

Announcement

Payment

Dormitory

Document

------------------------------------------------------------

# CONTROLLERS TO REFACTOR

StudentsController

ClassesController

AttendanceController

GradesController

SchoolYearController

DashboardController

FinanceController

DormitoryController

------------------------------------------------------------

# SEEDERS

Create realistic data.

Administrator

Director

Secretary

Teachers (20+)

Guardians

Students (250+)

Parents

Subjects

School Years

Classes

Enrollments

Timetable

Attendance

Grades

Payments

Announcements

Dormitory Records

------------------------------------------------------------

# PERFORMANCE

Always

Eager Load

Indexes

Pagination

Transactions

Queues if needed

Cache Dashboard Statistics

------------------------------------------------------------

# CODE STYLE

Never break existing API.

Never remove functionality.

Refactor incrementally.

Every migration must be reversible.

Always update Models.

Always update Relationships.

Always update Seeders.

Always test migrations before continuing.

------------------------------------------------------------

# IMPLEMENTATION ORDER

STEP 1

Database redesign

STEP 2

Relationships

STEP 3

Models

STEP 4

Migrations

STEP 5

Seeders

STEP 6

Services

STEP 7

Controllers

STEP 8

Policies

STEP 9

API Resources

STEP 10

React Frontend Integration

------------------------------------------------------------

# IMPORTANT

Do NOT rewrite everything.

Preserve the existing project.

Refactor professionally.

Prioritize maintainability, scalability, performance and clean architecture.

The final goal is a production-ready School Information System suitable for a real educational institution.