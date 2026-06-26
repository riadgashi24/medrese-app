# Medrese App Backend - Laravel API

Backend API for the Medrese school management application, built with Laravel 11, Sanctum authentication, and REST API conventions.

## Features

- **Role-based access control** (director, secretary, cashier, teacher, educator, student, boarding)
- **Token-based authentication** via Laravel Sanctum
- **Complete student management** system
- **Finance module** (fees, payments, invoices, outstanding balances)
- **Attendance tracking** (regular and Fajr)
- **Dormitory management** (rooms, assignments, inspections)
- **Discipline records**
- **Announcements and documents**
- **Assignments and extracurricular activities**

## Requirements

- PHP 8.2+
- Composer
- SQLite/MySQL/PostgreSQL

## Installation

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env (default: SQLite)
# DB_CONNECTION=sqlite

# Run migrations
php artisan migrate

# Seed demo data
php artisan db:seed

# Start development server
php artisan serve
```

## Demo Credentials

All demo accounts use password: `demo123`

| Role | Email |
|------|-------|
| Director | director@medrese.edu |
| Secretary | secretary@medrese.edu |
| Cashier | cashier@medrese.edu |
| Teacher | teacher@medrese.edu |
| Educator | educator@medrese.edu |
| Student | student@medrese.edu |
| Boarding | boarding@medrese.edu |

## API Documentation

Base URL: `/api/v1`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login | Public |
| POST | `/auth/logout` | Logout | Required |
| GET | `/auth/me` | Get current user | Required |

### Students

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/students` | List students | All authenticated |
| GET | `/students/{id}` | Get student | All authenticated |
| POST | `/students` | Create student | director, secretary |
| PUT | `/students/{id}` | Update student | director, secretary |
| DELETE | `/students/{id}` | Delete student | director, secretary |
| POST | `/students/import` | Import CSV | director, secretary |
| GET | `/students/{id}/pay` | Payment info | director, cashier, secretary |

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff?role=teacher` | List staff by role |

### Academic

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/classes` | List classes |
| GET | `/subjects` | List subjects |
| GET | `/timetable?class_id=&day=` | Get timetable |
| GET | `/academic-years` | List academic years |
| GET | `/academic-years/{id}` | Get academic year |

### Finance

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/finance/overview` | Finance summary | director, cashier, secretary |
| GET | `/payments?student_id=&status=` | List payments | director, cashier, secretary |
| POST | `/payments` | Create payment | director, cashier |
| GET | `/outstanding` | Outstanding balances | director, cashier, secretary |
| GET | `/fee-structures` | List fee structures | director, cashier, secretary |
| POST | `/fee-structures` | Create fee structure | director, cashier |
| PUT | `/fee-structures/{id}` | Update fee structure | director, cashier |
| GET | `/invoices?student_id=&status=` | List invoices | director, cashier, secretary |
| POST | `/invoices/generate` | Generate invoice | director, cashier |
| GET | `/finance/reports` | Finance reports | director, cashier, secretary |

### Attendance

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/attendance` | Record attendance | teacher, educator |
| GET | `/attendance?class_id=&from=&to=` | List attendance | All authenticated |
| POST | `/attendance/fajr` | Record Fajr attendance | educator |
| POST | `/attendance/study-hours` | Record study hours | educator |
| GET | `/attendance/reports?scope=my|class` | Attendance reports | All authenticated |

### Dormitory

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/dormitory` | Overview | director, educator, secretary |
| GET | `/dormitory/rooms` | List rooms | director, educator, secretary |
| GET | `/dormitory/inspections` | List inspections | director, educator, secretary |
| POST | `/dormitory/inspections` | Create inspection | educator |
| GET | `/dormitory/my-room` | My room | student, boarding, educator |

### Discipline

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/discipline/record` | Record discipline | teacher, educator, director |
| GET | `/discipline/history` | Discipline history | teacher, educator, director |
| GET | `/discipline/my-record` | My discipline record | student, boarding |

### Announcements

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/announcements` | List announcements | All authenticated |
| POST | `/announcements` | Create announcement | director, secretary |

### Documents

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/documents` | List documents | All authenticated |
| GET | `/documents/my-documents` | My documents | student, boarding |

### Assignments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/assignments` | List assignments | All authenticated |
| GET | `/assignments/my` | My assignments | student, boarding |

### Extracurricular

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/extracurricular` | List activities | All authenticated |
| GET | `/extracurricular/my-enrollments` | My enrollments | student, boarding |

### Settings

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/settings/fee-structure` | Fee structure settings | director, cashier |

## Response Format

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

## Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/AuthTest.php
```

## Project Structure

```
app/
├── Http/
│   ├── Controllers/     # API controllers
│   ├── Middleware/      # Role middleware
│   └── Requests/        # Form requests
├── Models/              # Eloquent models
database/
├── migrations/          # Database migrations
├── seeders/             # Database seeders
routes/
└── api.php              # API routes
tests/
└── Feature/             # Feature tests
```

## License

MIT
