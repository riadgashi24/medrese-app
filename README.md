# 📚 Medrese School Management System (SMS)

> **A comprehensive school management platform purpose-built for Islamic educational institutions (Medreses).**
> Manages students, staff, academics, finance, dormitory, discipline, and extracurricular activities with role-based dashboards.

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Backend Documentation](#-backend-documentation)
   - [Setup & Installation](#backend-setup--installation)
   - [Environment Variables](#environment-variables)
   - [Authentication System](#authentication-system)
   - [API Endpoints Reference](#api-endpoints-reference)
   - [Database Schema](#database-schema)
   - [Services Layer](#services-layer)
5. [Frontend Documentation](#-frontend-documentation)
   - [Setup & Installation](#frontend-setup--installation)
   - [Project Structure](#project-structure)
   - [Component Architecture](#component-architecture)
   - [State Management](#state-management)
   - [Routing System](#routing-system)
   - [Key Pages & Features](#key-pages--features)
6. [Deployment Guide](#-deployment-guide)
7. [Project File Tree](#-project-file-tree)

---

## 🎯 Project Overview

The **Medrese School Management System (SMS)** is an end-to-end digital solution for managing the daily operations of a Medrese (Islamic school). It provides a centralized platform for:

- **Student Lifecycle Management**: From enrollment to graduation, including registration, profile management, document handling, and academic tracking.
- **Academic Administration**: Class management, subject assignment, timetable scheduling, grade entry, and assignment submissions.
- **Finance & Fee Management**: Fee structures, payment recording, invoice generation, and outstanding balance tracking.
- **Attendance Tracking**: Classroom attendance, Fajr (dawn prayer) attendance, and study hours monitoring.
- **Dormitory Management**: Room assignments, inspections, and boarding student oversight.
- **Discipline System**: Recording and tracking disciplinary actions, positive behavior recognition.
- **Extracurricular Activities**: Hifz (Quran memorization) programs, clubs, and activity enrollment.
- **Announcements & Communications**: School-wide notifications and document sharing.

The system features **role-based access control** with tailored dashboards for each role: Director, Secretary, Cashier, Teacher, Educator, Student, and Boarding Student. The UI is fully localized in Albanian (`sq`) with a modern, dark-themed interface.

---

## 🛠 Technology Stack

### Backend — Laravel 11

| Technology | Purpose |
|---|---|
| **PHP 8.2+** | Runtime |
| **Laravel 11** | MVC framework |
| **Laravel Sanctum** | API token authentication (SPA & mobile) |
| **SQLite** | Database engine (dev); PostgreSQL/MySQL for production |
| **Eloquent ORM** | Database abstraction & relationships |

### Frontend — React 19 + Vite

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **TanStack React Query 5** | Server state management & caching |
| **Recharts** | Data visualization (charts) |
| **Lucide React** | Icon library |
| **React Hook Form + Zod** | Form validation |
| **Radix UI** | Accessible headless UI primitives |
| **Class Variance Authority** | Component-style variants |
| **jsPDF + html2canvas** | PDF export / report generation |
| **xlsx** | Excel import/export |

### Dev Tools

| Tool | Purpose |
|---|---|
| **Laravel Sail** | Docker-based development environment |
| **Laravel Pint** | Code style fixer |
| **PHPUnit** | Backend testing |
| **Laravel Pail** | Log viewer |

---

## 🏗 Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │  ◄──►   │  Laravel API     │  ◄──►   │  Database   │
│  (React 19) │  HTTP   │  (Sanctum Auth)  │  ORM    │   (SQLite   │
│             │  JSON   │                  │  Eloqu. │   /MySQL)   │
└─────────────┘         └──────────────────┘         └─────────────┘
       │                        │
       │  Vite Dev Server       │  API Base: /api/v1
       │  (port 5173)           │  (port 8000)
```

### Data Flow

1. **Client → Server**: React SPA communicates with Laravel backend via RESTful JSON API calls.
2. **Authentication**: Bearer tokens issued by Sanctum upon login. Tokens are stored in `localStorage` and attached to every request via an `Authorization: Bearer <token>` header.
3. **Server → Client**: All responses follow a consistent JSON envelope. Protected routes are guarded by Sanctum's `auth:sanctum` middleware and custom `role` middleware.
4. **State Management**: TanStack React Query handles server state (caching, refetching, optimistic updates). Auth state is managed via React Context.

---

## 🔧 Backend Documentation

### Backend Setup & Installation

#### Prerequisites

- PHP 8.2 or higher
- Composer 2.x
- Node.js 20+ and npm
- SQLite (dev) or MySQL/PostgreSQL (production)

#### Installation Steps

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install PHP dependencies
composer install

# 3. Create environment file
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Configure database (default: SQLite)
#    For SQLite, just ensure database/database.sqlite exists:
touch database/database.sqlite

# 6. Run migrations
php artisan migrate

# 7. Seed the database with demo data
php artisan db:seed

# 8. (Optional) Create storage link for file uploads
php artisan storage:link

# 9. Start the development server
php artisan serve
#    → API runs at http://127.0.0.1:8000
```

#### Running in Development Mode (with all services)

```bash
composer run dev
# Runs: php artisan serve + queue:listen + pail (logs) + npm run dev
```

#### Running Tests

```bash
composer run test
# Or: php artisan test
```

---

### Environment Variables

Key environment variables in `.env`:

```env
APP_NAME=MedreseSMS
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite default)
DB_CONNECTION=sqlite
# DB_DATABASE=/absolute/path/to/database.sqlite

# For MySQL/PostgreSQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=medrese
# DB_USERNAME=root
# DB_PASSWORD=

# Sanctum stateful domains (SPA domains for cookie-based auth)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1

# Default student password for auto-generated accounts
DEFAULT_STUDENT_PASSWORD=medrese2026
```

> **Note**: The `medrese.php` config file exposes `default_student_password` as the default password assigned to newly created student user accounts.

---

### Authentication System

The system uses **Laravel Sanctum** for API authentication with a **token-based** approach.

#### How It Works

1. **Login**: User submits `email` + `password` to `POST /api/v1/auth/login`.
2. **Token Generation**: The `User` model uses `Laravel\Sanctum\HasApiTokens` trait. On successful login, a new Sanctum token is generated.
3. **Token Storage**: The frontend stores the token in `localStorage` under the key `medrese-token`.
4. **Authenticated Requests**: The `api.js` client automatically attaches the token via `Authorization: Bearer <token>` header.
5. **Middleware Stack**:
   - `auth:sanctum` — Verifies the bearer token on protected routes.
   - `role:director,secretary,...` — Custom middleware (`RoleMiddleware`) that checks the authenticated user's `role` field.
6. **Logout**: `POST /api/v1/auth/logout` deletes the current token.

#### Role System

| Role | Description |
|---|---|
| `director` | Full access — all modules, management, reports |
| `secretary` | Student registration, class assignments, read-only finance |
| `cashier` | Payment recording, invoices, fee structure, reports |
| `teacher` | Attendance, grades, assignments, class management |
| `educator` | Dormitory oversight, discipline, Fajr/study-hour attendance |
| `student` | Own grades, timetable, attendance, assignments, documents |
| `boarding` | Same as `student` + dormitory room info, inspection reports |

---

### API Endpoints Reference

**Base URL**: `http://127.0.0.1:8000/api/v1`

#### Authentication

| Method | Endpoint | Description | Auth | Roles |
|---|---|---|---|---|
| `POST` | `/auth/login` | Login with email & password | ❌ | Public |
| `POST` | `/auth/logout` | Logout (revoke token) | ✅ | Any |
| `GET` | `/auth/me` | Get current authenticated user | ✅ | Any |

**Request — Login**:
```json
{
  "email": "director@medrese.edu",
  "password": "demo123"
}
```

**Response — Login**:
```json
{
  "data": {
    "token": "1|abc123...",
    "user": {
      "id": 1,
      "name": "Ahmed Hassan",
      "email": "director@medrese.edu",
      "role": "director",
      "initials": "AH"
    }
  }
}
```

#### Students

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/students` | List students (with filters) | ✅ Any |
| `GET` | `/students/{id}` | Get student details | ✅ Any |
| `POST` | `/students` | Create a new student | director, secretary |
| `PUT` | `/students/{id}` | Update student | director, secretary |
| `DELETE` | `/students/{id}` | Delete student | director, secretary |
| `POST` | `/students/{id}/reset-password` | Reset student's password | director, secretary |
| `DELETE` | `/students/{id}/delete` | Soft delete student | director, secretary |
| `POST` | `/students/import` | Bulk import via Excel/CSV | director, secretary |
| `GET` | `/students/{studentId}/pay` | Get payment info for student | director, cashier, secretary |

**GET `/students` query parameters**:
- `search` — Search by name, student_id, parent name/phone, municipality
- `type` — Filter by `Regular` or `Boarding`
- `status` — Filter by `Active`, `Inactive`, `Graduated`
- `class_id` — Filter by class
- `per_page` — Pagination (default: 15)

#### Classes

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/classes` | List all classes | ✅ Any |
| `GET` | `/classes/{id}` | Get class details | ✅ Any |
| `POST` | `/classes` | Create a class | ✅ Any |
| `PUT` | `/classes/{id}` | Update a class | ✅ Any |
| `DELETE` | `/classes/{id}` | Delete a class | ✅ Any |
| `POST` | `/classes/{class}/assign-homeroom` | Assign homeroom teacher | director, secretary |
| `POST` | `/classes/{class}/assign-students` | Assign students to class | director, secretary |

#### Academic

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/academic/classes` | Get academic class list | ✅ Any |
| `GET` | `/academic/subjects` | List all subjects | ✅ Any |
| `POST` | `/academic/subjects` | Create a subject | ✅ Any |
| `PUT` | `/academic/subjects/{id}` | Update subject | ✅ Any |
| `DELETE` | `/academic/subjects/{id}` | Delete subject | ✅ Any |
| `GET` | `/academic/subjects/{id}/details` | Subject details with classes | ✅ Any |
| `GET` | `/academic/report/class/{classId}/subject/{subjectId}` | Get class-subject report | ✅ Any |
| `GET` | `/academic/timetable` | Get timetable data | ✅ Any |
| `GET` | `/academic-years` | List academic years | ✅ Any |
| `GET` | `/academic-years/{id}` | Get academic year | ✅ Any |

#### Finance

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/finance/overview` | Finance dashboard overview | director, cashier, secretary |
| `GET` | `/payments` | List payments | director, cashier, secretary |
| `POST` | `/payments` | Record a payment | director, cashier |
| `GET` | `/outstanding` | Outstanding balances | director, cashier, secretary |
| `GET` | `/finance/reports` | Revenue reports | director, cashier, secretary |
| `GET` | `/fee-structures` | List fee structures | director, cashier, secretary |
| `POST` | `/fee-structures` | Create fee structure | director, cashier |
| `PUT` | `/fee-structures/{id}` | Update fee structure | director, cashier |
| `GET` | `/invoices` | List invoices | director, cashier, secretary |
| `POST` | `/invoices/generate` | Generate invoice | director, cashier |

#### Attendance

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/attendance` | List attendance records | ✅ Any |
| `GET` | `/attendance/reports` | Attendance reports | ✅ Any |
| `GET` | `/attendance/overview` | Attendance overview | ✅ Any |
| `POST` | `/attendance` | Mark attendance | teacher, educator |
| `POST` | `/attendance/fajr` | Mark Fajr prayer attendance | educator |
| `POST` | `/attendance/study-hours` | Mark study hours | educator |
| `PUT` | `/attendance/{attendance}` | Update attendance record | teacher, educator, director, secretary |

#### Grades

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/classes/{classId}/grades` | Get class grades | ✅ Any |
| `PUT` | `/classes/{classId}/grades` | Update grades | ✅ Any |

#### Dormitory

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/dormitory` | Dormitory overview | director, educator, secretary |
| `GET` | `/dormitory/rooms` | List rooms | director, educator, secretary |
| `GET` | `/dormitory/inspections` | List inspections | director, educator, secretary |
| `POST` | `/dormitory/inspections` | Create inspection | educator |
| `GET` | `/dormitory/my-room` | Student's own room | student, boarding, educator |

#### Discipline

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/discipline/record` | Record discipline entry | teacher, educator, director |
| `GET` | `/discipline/history` | Discipline history | teacher, educator, director |
| `GET` | `/discipline/categories` | Discipline categories | teacher, educator, director |
| `GET` | `/discipline/my-record` | Student's own discipline record | student, boarding |

#### Others

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/announcements` | List announcements | ✅ Any |
| `POST` | `/announcements` | Create announcement | director, secretary |
| `GET` | `/documents` | List documents | ✅ Any |
| `GET` | `/documents/my-documents` | Student's own documents | student, boarding |
| `GET` | `/assignments` | List assignments | ✅ Any |
| `GET` | `/assignments/my` | Student's own assignments | student, boarding |
| `GET` | `/extracurricular` | List activities | ✅ Any |
| `GET` | `/extracurricular/my-enrollments` | Student's enrollments | student, boarding |
| `GET` | `/staff` | List staff members | ✅ Any |
| `GET` | `/settings/fee-structure` | Fee structure settings | director, cashier |

---

### Database Schema

The database consists of **25+ tables** covering all domains. Key tables:

| Table | Purpose |
|---|---|
| `users` | System users (all roles) |
| `students` | Student profiles (extends users) |
| `classes` | Class/section definitions |
| `subjects` | Academic subjects |
| `class_subject` | Pivot: subject-class assignments |
| `academic_years` | School year definitions |
| `timetable_slots` | Schedule entries |
| `fee_types` | Fee category definitions |
| `fee_structures` | Fee amount per class/type/year |
| `payments` | Payment transactions |
| `invoices` | Generated invoices |
| `attendance_records` | Daily attendance |
| `attendance_audits` | Attendance modification logs |
| `study_hours` | Study hour tracking |
| `dorm_rooms` | Dormitory rooms |
| `dorm_assignments` | Student-room assignments |
| `dorm_inspections` | Room cleanliness inspections |
| `discipline_categories` | Violation/positive categories |
| `discipline_records` | Discipline events |
| `announcements` | School announcements |
| `documents` | Shared documents |
| `student_documents` | Per-student documents |
| `assignments` | Class assignments/homework |
| `assignment_submissions` | Student submissions |
| `extracurricular_activities` | Activities (Hifz, sports, etc.) |
| `activity_enrollments` | Student enrollments |
| `day_supervisor` | Daily supervision roster |
| `grades` | Student grade records |
| `staff` | Staff profiles |
| `approvals` | Approval workflows |
| `personal_access_tokens` | Sanctum API tokens |

---

### Services Layer

The backend implements a **Service Layer pattern** for business logic:

- **`App\Services\FeeService`** — Financial operations: payment recording, fee structure management, invoice generation, revenue reports, outstanding balance calculation.
- **`App\Services\StudentService`** — Student management: CRUD operations, bulk import, balance calculation, auto-classification (Regular vs Boarding based on municipality).

---

## 🎨 Frontend Documentation

### Frontend Setup & Installation

#### Prerequisites

- Node.js 20+
- npm or yarn

#### Installation Steps

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
#    → Frontend runs at http://localhost:5173

# 4. Build for production
npm run build
#    → Output in frontend/dist/
```

#### Configuration

- **API Base URL**: Defined in `src/lib/api.js` — defaults to `http://127.0.0.1:8000/api/v1`.
- **Vite config**: Located at `frontend/vite.config.js` — includes `@` path alias, React plugin, Tailwind CSS plugin.

---

### Project Structure

```
frontend/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies & scripts
├── jsconfig.json               # Path alias configuration
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component with routing
    ├── index.css               # Global styles (Tailwind + theme)
    │
    ├── context/
    │   └── AuthContext.jsx     # Auth state, login/logout, theme
    │
    ├── lib/
    │   ├── api.js              # API client (fetch wrapper, auth headers)
    │   └── utils.js            # Utility functions (cn, etc.)
    │
    ├── data/
    │   ├── mockData.js         # Demo data & role constants
    │   └── navigation.js       # Role-based navigation tree
    │
    ├── i18n/
    │   └── index.js            # Internationalization (Albanian)
    │
    ├── locales/
    │   └── sq.json             # Albanian translations
    │
    ├── routes/
    │   └── ProtectedRoute.jsx  # Auth guard + layout wrapper
    │
    ├── components/
    │   ├── layout/
    │   │   └── AppShell.jsx    # Main layout: Sidebar + TopBar
    │   ├── ui/
    │   │   ├── Badge.jsx       # Status badge component
    │   │   ├── Button.jsx      # Styled button component
    │   │   ├── Card.jsx        # Reusable card component
    │   │   ├── ClassCard.jsx   # Class display card
    │   │   ├── DataTable.jsx   # Generic data table component
    │   │   ├── Input.jsx       # Form input components
    │   │   ├── Logo.jsx        # App logo component
    │   │   ├── PageHeader.jsx  # Page header/title component
    │   │   └── StatCard.jsx    # Statistic card for dashboards
    │   └── charts/
    │       └── Charts.jsx      # Recharts-based chart components
    │
    └── pages/
        ├── auth/
        │   └── LoginPage.jsx         # Login with demo shortcuts
        ├── dashboard/
        │   ├── DashboardPage.jsx     # Role-based dashboard router
        │   ├── DirectorDashboard.jsx
        │   ├── SecretaryDashboard.jsx
        │   ├── CashierDashboard.jsx
        │   ├── TeacherDashboard.jsx
        │   ├── EducatorDashboard.jsx
        │   └── StudentDashboard.jsx
        ├── students/
        │   ├── AllStudentsPage.jsx
        │   ├── ClassStudentsPage.jsx
        │   ├── StudentDetailPage.jsx
        │   ├── StudentFormPage.jsx
        │   └── StudentImportPage.jsx
        ├── finance/
        │   └── FinancePages.jsx      # All finance pages
        ├── modules/
        │   ├── ModulePages.jsx       # Misc module pages
        │   └── AcademicModules/
        │       ├── AcademicYearPage.jsx
        │       ├── GradesPage.jsx
        │       ├── Timetable.jsx
        │       ├── Attendance/
        │       │   ├── AttendancePage.jsx
        │       │   └── AttendancePages.jsx
        │       ├── classes/
        │       │   ├── ClassesPage.jsx
        │       │   ├── ClassDetail.jsx
        │       │   ├── ClassFormPage.jsx
        │       │   └── ModuleCard.jsx
        │       └── Subject/
        │           ├── SubjectsPage.jsx
        │           ├── SubjectDetailPage.jsx
        │           └── ClassSubjectReportPage.jsx
        └── users/
            └── UsersManagement.jsx
```

---

### Component Architecture

#### Layout Components

- **`AppShell`** — Wraps all authenticated pages. Contains:
  - **`Sidebar`** — Collapsible navigation menu. Renders role-specific items from `NAV_BY_ROLE` configuration. Supports nested sub-menus with expand/collapse.
  - **`TopBar`** — Header with menu toggle, user info, initials avatar, and logout button.
  - **`main`** — Content area wrapping the `<Outlet />`.

#### UI Components

| Component | Description |
|---|---|
| **`Button`** | Styled button with loading state, variants (primary, ghost, etc.) |
| **`Input`** | Form input with label wrapper |
| **`DataTable`** | Generic table with configurable columns, custom render functions, row click handler |
| **`Card`** | Glass-effect card container |
| **`StatCard`** | Metric display card (icon, label, value, trend) |
| **`ClassCard`** | Class display card with section and student count |
| **`Badge`** | Status badge (success, warning, error, info) |
| **`PageHeader`** | Page title, description, and action button |
| **`Logo`** | Application logo component |
| **`Charts`** | Bar chart, line chart, pie chart using Recharts |

---

### State Management

#### Auth Context (`AuthContext.jsx`)

- **Provider**: `AuthProvider` wraps the entire app.
- **State**: `user` object, `theme` (light/dark), `loading`, `isAuthenticated`.
- **Actions**: `login(email, password)`, `logout()`, `setTheme(theme)`.
- **Persistence**: Token stored in `localStorage` under `medrese-token`. User object under `medrese-user`. Theme per user under `medrese-theme:{userId}`.
- **On mount**: Validates existing token by calling `GET /auth/me`. Clears invalid tokens.

#### Server State (TanStack React Query)

- **`QueryClient`** instantiated at app root in `App.jsx`.
- API calls from `api.js` are wrapped in React Query hooks within pages.
- Automatic caching, background refetching, and cache invalidation.

---

### Routing System

#### Route Structure

```
/login                          # Public login page
/                               # Redirects to /dashboard

# Protected (wrapped in AppShell layout):
/dashboard                      # Role-based dashboard
/profile                        # User profile

# Students
/students                       # All students list
/students/new                   # Create student
/students/:id                   # Student detail
/students/:id/edit              # Edit student
/students/import                # Bulk import

# Staff
/staff                          # Staff list

# Academic
/timetable                      # Weekly timetable
/subjects                       # Subject list
/subjects/:id                   # Subject details
/subjects/:subjectId/class/:classId  # Class-subject report
/classes                        # Classes overview
/classes/:id                    # Class detail
/classes/:classId/students      # Students in class
/classes/new                    # Create class
/classes/:id/edit               # Edit class

# Finance
/finance                        # Overview
/finance/payments               # Payment history
/finance/payments/new           # Record payment
/finance/invoices               # Invoices
/finance/outstanding            # Outstanding balances
/finance/reports                # Finance reports
/finance/pay                    # Student payment status

# Dormitory
/dormitory                      # Overview
/dormitory/rooms                # Room list
/dormitory/inspections          # Inspections
/dormitory/my-room              # My room (student)

# Attendance
/classes/:id/attendance         # Mark/View attendance
/classes/:id/attendance/take    # Take attendance
/classes/:id/attendance/fajr    # Fajr attendance (educator)
/classes/:id/attendance/study-hours    # Study hours
/classes/:id/attendance/reports  # Attendance reports

# Grades
/classes/:id/grades             # Grade overview
/classes/:id/grades/entry       # Enter grades
/classes/:id/grades/exams       # Exam grades

# Discipline
/discipline                     # Discipline overview
/discipline/record              # Record incident
/discipline/history             # History
/discipline/my-record           # My record (student)

# Other
/extracurricular                # Activities
/announcements                  # Announcements
/settings                       # Settings
/settings/fee-structure         # Fee structure settings
/users                          # User management
```

#### Route Guards

- **`ProtectedRoute`** checks `isAuthenticated` from AuthContext. Redirects to `/login` if not authenticated.
- Wraps children in `AppShell` layout on successful authentication.
- **`RoleGuard`** uses `canAccessRoute()` from `navigation.js` to check if the current user's role has access to the current path.

---

### Key Pages & Features

| Page | Feature Highlights |
|---|---|
| **LoginPage** | Email/password form, quick-role-select buttons for all 7 demo roles |
| **DirectorDashboard** | Stats overview, revenue charts, attendance trends, class performance, recent activity feed |
| **SecretaryDashboard** | Registration stats, student overview, quick actions |
| **CashierDashboard** | Financial summary, pending payments, fee collection chart |
| **TeacherDashboard** | Daily schedule, class stats, attendance summary |
| **EducatorDashboard** | Dormitory stats, inspection scores, Fajr attendance trend |
| **StudentDashboard** | Own grades, timetable, attendance, announcements, payments due |
| **AllStudentsPage** | Filterable/searchable table, create/import actions |
| **StudentFormPage** | Full registration form (create/edit mode) |
| **ClassesPage** | Grid of class cards with student counts, manage actions |
| **FinancePages** | Overview, payments list, payment recording, invoices, outstanding |
| **AttendancePage** | Per-class attendance marking with status indicators |
| **GradesPage** | Grade entry, exam results, reports, transcripts |
| **SubjectsPage** | Subject CRUD with teacher assignments |
| **TimetablePage** | Weekly schedule view |

#### Theme System

- Default: **Dark theme** with a mesh gradient background.
- Light theme available via toggle.
- Theme is persisted per user in `localStorage`.
- CSS custom properties (`--app-bg`, `--app-text`, etc.) dynamically switch between themes.
- Smooth transitions between themes.

---

## 🚀 Deployment Guide

### Local Development

```bash
# Terminal 1 — Backend API
cd backend
php artisan serve
# → http://127.0.0.1:8000

# Terminal 2 — Frontend Dev Server
cd frontend
npm run dev
# → http://localhost:5173
```

Or use the combined dev command:
```bash
cd backend
composer run dev
```

### Production Build

#### Backend
```bash
cd backend

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set APP_ENV=production in .env
# Use PostgreSQL or MySQL in production
```

#### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
# Serve these files via Laravel's public/ directory or a separate web server (Nginx, Apache)
```

### Server Requirements

- **Web Server**: Nginx or Apache with PHP-FPM
- **PHP**: 8.2+
- **Database**: MySQL 8.0+ or PostgreSQL 15+ (SQLite for dev only)
- **Node.js**: 20+ (for build step only)
- **Composer**: 2.x

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name medrese.example.com;
    root /var/www/medrese/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 📁 Project File Tree

### Backend (`backend/`)

```
backend/
├── app/
│   ├── Models/               # Eloquent models (25+ models)
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Services/
│   │   ├── FeeService.php     # Financial business logic
│   │   └── StudentService.php # Student business logic
│   └── Http/
│       ├── Controllers/       # API controllers
│       ├── Middleware/
│       │   └── RoleMiddleware.php
│       └── Requests/          # Form request validation
├── bootstrap/
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── database.php
│   ├── sanctum.php
│   └── medrese.php           # Custom config
├── database/
│   ├── migrations/            # 30+ migration files
│   └── seeders/               # Database seeders
├── routes/
│   ├── api.php                # All API routes
│   ├── web.php
│   └── console.php
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── MyDocumentsTest.php
│   │   └── RoleGuardTest.php
│   └── TestCase.php
├── composer.json
└── package.json
```

### Frontend (`frontend/`)

```
frontend/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/
│   ├── lib/
│   ├── data/
│   ├── i18n/
│   ├── locales/
│   ├── routes/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── charts/
│   └── pages/
│       ├── auth/
│       ├── dashboard/
│       ├── students/
│       ├── finance/
│       ├── modules/
│       │   └── AcademicModules/
│       │       ├── classes/
│       │       ├── Subject/
│       │       └── Attendance/
│       └── users/
├── vite.config.js
└── package.json
```

---

## 📄 License

This project is developed for educational institution management. All rights reserved.

---

> **Maintained by**: The Medrese Development Team
> **Last updated**: July 2026
> **Tech Stack**: Laravel 11 + React 19 + Tailwind CSS 4 + SQLite/MySQL
