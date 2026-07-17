You are a senior Laravel 12 + React + Inertia + MySQL architect.

Goal:
Transform this demo project into a production-ready Medrese Management System.

Rules:
- DO NOT rewrite files unnecessarily.
- Modify ONLY files that require changes.
- Reuse existing architecture, components and patterns.
- Keep the UI modern and consistent.
- Add only short comments where the logic is difficult.
- Don't explain your decisions unless I ask.
- If a task requires backend + frontend, complete both.
- Finish one task completely before moving to the next.
- Keep code clean, scalable and production-ready.

Priority Tasks



## 6. Students Module

Hierarchy:

Classes

↓

Students of class

↓

Student Profile

Requirements:

Classes page.

Click class.

Open student cards:
- photo
- full name
- class
- status

Click card.

Open profile.

Secretary can edit student.

Password reset button.

---

## 7. Class Management

Secretary can:

- create class
- edit class
- assign students
- assign homeroom teacher

Homeroom teacher receives an extra dashboard for:

- own class
- student management
- absence approval
- class overview

---

## 8. Attendance

Database stores ONLY absences.

Teachers record absences.

Homeroom teacher later marks:

- Excused
- Unexcused

Do NOT store "present".

---

## 9. Teacher Dashboard

Weekly schedule.

Today's lessons.

Lesson card shows:

- period
- class
- subject

Click lesson:

Attendance page.

Grades page.

Every day contains 7 periods.

---

## 10. Dormitory

Structure:

Floor 2:
Rooms 201-220

Floor 3:
Rooms 301-320

Rooms can contain:
- 2 students
- 4 students

Every school year:

Archive previous assignments.

Create empty room assignments.

Dormitory educator assigns rooms.

Dormitory director approves:
- entering dormitory
- leaving dormitory

---

## 11. Student Portal

Student sees:

Academic
- grades
- absences
- timetable
- subjects

Financial
- payments
- debts
- payment history

Dormitory (if applicable)

Room info.

Roommates.

Room score.

Warnings.

Cleaning inspections.

Leaderboard.

Top 3 rooms.

Weekly points.

Monthly winner.

Yearly winner.

---

## 12. Room Inspection

Every Monday.

Educator completes editable checklist.

Examples:

- beds
- floor
- wardrobes
- trash
- study discipline
- lights
- noise

Checklist must be editable.

Educator changes room points.

History preserved.

Leaderboard updates automatically.

---

## 13. Finance

Cashier manages:

- payments
- debts
- balances

Student has read-only financial dashboard.

---

General Requirements

✔ Production-ready code.

✔ Proper validation.

✔ Authorization.

✔ Use existing Laravel policies if available.

✔ Reuse components.

✔ Responsive UI.

✔ No duplicated code.

✔ No hardcoded demo data.

✔ Connect every page to backend.

✔ Keep database normalized.

✔ Follow current project structure.

Workflow:

1. Inspect project.
2. Find existing models/controllers/routes.
3. Reuse before creating new.
4. Complete each task fully.
5. Continue automatically to next task until all are done.
6. If a file is needed, edit it directly instead of describing what should be done.
7. Never stop after partial implementation.