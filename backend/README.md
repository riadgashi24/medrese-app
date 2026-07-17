# Medrese App Backend (Laravel 11)

Backend API për Medrese School Management App, ndërtuar me Laravel 11 dhe REST conventions.

- **Autentikim**: Laravel Sanctum (token)
- **Autorizim**: role-based access control me middleware `role:*`

## Requirements

- PHP 8.2+
- Composer
- SQLite / MySQL / PostgreSQL

## Installation

```bash
composer install

cp .env.example .env
php artisan key:generate

# Konfiguro DB në .env (default: SQLite)
# DB_CONNECTION=sqlite

php artisan migrate
php artisan db:seed

php artisan serve
```

## Demo Credentials

Të gjitha demo llogaritë përdorin password: `demo123`

| Role | Email |
|------|-------|
| Director | director@medrese.edu |
| Secretary | secretary@medrese.edu |
| Cashier | cashier@medrese.edu |
| Teacher | teacher@medrese.edu |
| Educator | educator@medrese.edu |
| Student | student@medrese.edu |
| Boarding | boarding@medrese.edu |

## Authentication

Base URL (në `routes/api.php`): **`/api`**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login | Public |

> Routes të tjera janë brenda `middleware('auth:sanctum')` dhe kërkojnë token.

## API Endpoints

### Auth (me token)

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| POST | `/auth/logout` | Logout | (authenticated) |
| GET | `/auth/me` | Get current user | (authenticated) |

---

### Students (director/secretary)

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/students` | List students | All authenticated |
| GET | `/students/{id}` | Get student | All authenticated |
| POST | `/students` | Create student | director, secretary |
| PUT | `/students/{id}` | Update student | director, secretary |
| DELETE | `/students/{id}` | Delete student (API destroy) | director, secretary |
| POST | `/students/import` | Import CSV | director, secretary |
| POST | `/students/{id}/reset-password` | Reset password | director, secretary |
| DELETE | `/students/{id}/delete` | Soft delete | director, secretary |
| GET | `/students/{studentId}/pay` | Payment info | director, cashier, secretary |

---

### Staff

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET/POST/PUT/DELETE | `/staff` (apiResource) | Staff CRUD (varion sipas metodës) | (role/middleware varet nga implementimi i controllerit) |

> Nota: në `routes/api.php` përdoret `Route::apiResource('staff', StaffController::class);` brenda grupit `auth:sanctum`, por nuk ka `role:*` middleware specifik për resource.

---

### Approvals (apiResource)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/approval` (apiResource) | Approvals CRUD |

---

### Academic

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/academic/classes` | List classes | All authenticated |
| GET | `/academic/subjects` | List subjects | All authenticated |
| GET | `/academic/timetable` | Get timetable | All authenticated |
| GET | `/academic-years` | List academic years | All authenticated |
| GET | `/academic-years/{id}` | Get academic year | All authenticated |

---

### Dashboard

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/dashboard/secretary` | Secretary dashboard | Any authenticated (controller cakton çfarë i takon) |
| GET | `/dashboard/principal` | Principal dashboard | Any authenticated (controller cakton çfarë i takon) |

> Në `routes/api.php` këto janë brenda `auth:sanctum`.

---

### Finance

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/finance/overview` | Finance summary | director, cashier, secretary |
| GET | `/outstanding` | Outstanding balances | director, cashier, secretary |
| GET | `/finance/reports` | Finance reports | director, cashier, secretary |
| GET | `/payments` | List payments (query params p.sh. `student_id`, `status`)| director, cashier, secretary |
| POST | `/payments` | Create payment | director, cashier |
| GET | `/fee-structures` | List fee structures | director, cashier, secretary |
| POST | `/fee-structures` | Create fee structure | director, cashier |
| PUT | `/fee-structures/{id}` | Update fee structure | director, cashier |
| GET | `/invoices` | List invoices | director, cashier, secretary |
| POST | `/invoices/generate` | Generate invoice | director, cashier |

---

### Attendance

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| POST | `/attendance` | Record attendance | teacher, educator |
| GET | `/attendance` | List attendance | All authenticated |
| PUT | `/attendance/{attendance}` | Update attendance | teacher, educator, director, secretary |
| POST | `/attendance/fajr` | Record Fajr attendance | educator |
| POST | `/attendance/study-hours` | Record study hours | educator |
| GET | `/attendance/reports` | Attendance reports | (auth:sanctum + role sipas implementimit në controller/route; në routes s’ka role middleware specifik) |

---

### Dormitory

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/dormitory` | Overview | director, educator, secretary |
| GET | `/dormitory/rooms` | List rooms | director, educator, secretary |
| GET | `/dormitory/inspections` | List inspections | director, educator, secretary |
| POST | `/dormitory/inspections` | Create inspection | educator |
| GET | `/dormitory/my-room` | My room | student, boarding, educator |

---

### Discipline

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| POST | `/discipline/record` | Record discipline | teacher, educator, director |
| GET | `/discipline/history` | Discipline history | teacher, educator, director |
| GET | `/discipline/categories` | Discipline categories | teacher, educator, director |
| GET | `/discipline/my-record` | My discipline record | student, boarding |

---

### Announcements

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/announcements` | List announcements | All authenticated |
| POST | `/announcements` | Create announcement | director, secretary |

---

### Documents

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/documents` | List documents | All authenticated |
| GET | `/documents/my-documents` | My documents | student, boarding |

---

### Assignments

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/assignments` | List assignments | All authenticated |
| GET | `/assignments/my` | My assignments | student, boarding |

---

### Extracurricular

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/extracurricular` | List activities | All authenticated |
| GET | `/extracurricular/my-enrollments` | My enrollments | student, boarding |

---

### Settings

| Method | Endpoint | Description | Allowed roles |
|--------|----------|-------------|------------------|
| GET | `/settings/fee-structure` | Fee structure settings | director, cashier |

## Response Format

> Response format varet nga implementimi i controller-ve. Ky është një format i zakonshëm (mbajtur për referencë):

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
├── Models/
├── Services/
database/
├── migrations/
├── seeders/
routes/
└── api.php

tests/
└── Feature/
```

## Testing

```bash
php artisan test
php artisan test tests/Feature/AuthTest.php
```

## License

MIT

