<?php

use App\Http\Controllers\AcademicController;
use App\Http\Controllers\AnnouncementsController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\AssignmentsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisciplineController;
use App\Http\Controllers\DocumentsController;
use App\Http\Controllers\DormitoryController;
use App\Http\Controllers\ExtracurricularController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentsController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Students (director, secretary)
    Route::middleware('role:director,secretary')->group(function () {
        Route::post('/students', [StudentsController::class, 'store']);
        Route::put('/students/{id}', [StudentsController::class, 'update']);
        Route::delete('/students/{id}', [StudentsController::class, 'destroy']);
        Route::post('/students/import', [StudentsController::class, 'import']);
        Route::post('/students/{id}/reset-password', [StudentsController::class, 'resetPassword']);
    });

    Route::get('/students', [StudentsController::class, 'index']);
    Route::get('/students/{id}', [StudentsController::class, 'show']);
    Route::get('/students/{studentId}/pay', [StudentsController::class, 'payInfo'])
        ->middleware('role:director,cashier,secretary');

    // Staff directory
    Route::apiResource('staff', StaffController::class);

    //Approvals
    Route::apiResource('approval', ApprovalController::class);

    Route::apiResource('classes', ClassController::class);
    Route::post('/classes/{class}/assign-homeroom', [ClassController::class, 'assignHomeroom'])->middleware('role:director,secretary');
    Route::post('/classes/{class}/assign-students', [ClassController::class, 'assignStudents'])->middleware('role:director,secretary');
    // Academic
    Route::get('/classes', [AcademicController::class, 'classes']);
    Route::get('/subjects', [AcademicController::class, 'subjects']);
    Route::get('/timetable', [AcademicController::class, 'timetable']);
    Route::get('/academic-years', [AcademicController::class, 'academicYears']);
    Route::get('/academic-years/{id}', [AcademicController::class, 'academicYear']);

    // Dashboard
    Route::middleware('auth:sanctum')->get(
        '/dashboard/secretary',
        [DashboardController::class, 'secretary']
    );
    Route::middleware('auth:sanctum')->get(
        '/dashboard/principal',
        [DashboardController::class, 'principal']
    );

    // Finance
    Route::middleware('role:director,cashier,secretary')->group(function () {
        Route::get('/finance/overview', [FinanceController::class, 'overview']);
        Route::get('/outstanding', [FinanceController::class, 'outstanding']);
        Route::get('/finance/reports', [FinanceController::class, 'reports']);
    });

    Route::get('/payments', [FinanceController::class, 'payments'])
        ->middleware('role:director,cashier,secretary');

    Route::post('/payments', [FinanceController::class, 'storePayment'])
        ->middleware('role:director,cashier');

    Route::get('/fee-structures', [FinanceController::class, 'feeStructures'])
        ->middleware('role:director,cashier,secretary');

    Route::post('/fee-structures', [FinanceController::class, 'storeFeeStructure'])
        ->middleware('role:director,cashier');

    Route::put('/fee-structures/{id}', [FinanceController::class, 'updateFeeStructure'])
        ->middleware('role:director,cashier');

    Route::get('/invoices', [FinanceController::class, 'invoices'])
        ->middleware('role:director,cashier,secretary');

    Route::post('/invoices/generate', [FinanceController::class, 'generateInvoice'])
        ->middleware('role:director,cashier');

    // Attendance
    Route::post('/attendance', [AttendanceController::class, 'store'])
        ->middleware('role:teacher,educator');

    Route::get('/attendance', [AttendanceController::class, 'index']);

    Route::put('/attendance/{attendance}', [AttendanceController::class, 'update'])
        ->middleware('role:teacher,educator,director,secretary');

    Route::post('/attendance/fajr', [AttendanceController::class, 'storeFajr'])
        ->middleware('role:educator');

    Route::post('/attendance/study-hours', [AttendanceController::class, 'storeStudyHours'])
        ->middleware('role:educator');

    Route::get('/attendance/reports', [AttendanceController::class, 'reports']);

    // Dormitory
    Route::middleware('role:director,educator,secretary')->group(function () {
        Route::get('/dormitory/rooms', [DormitoryController::class, 'rooms']);
        Route::get('/dormitory/inspections', [DormitoryController::class, 'inspections']);
        Route::get('/dormitory', [DormitoryController::class, 'overview']);
    });

    Route::post('/dormitory/inspections', [DormitoryController::class, 'storeInspection'])
        ->middleware('role:educator');

    Route::get('/dormitory/my-room', [DormitoryController::class, 'myRoom'])
        ->middleware('role:student,boarding,educator');

    // Discipline
    Route::post('/discipline/record', [DisciplineController::class, 'store'])
        ->middleware('role:teacher,educator,director');

    Route::get('/discipline/history', [DisciplineController::class, 'history'])
        ->middleware('role:teacher,educator,director');

    Route::get('/discipline/categories', [DisciplineController::class, 'categories'])
        ->middleware('role:teacher,educator,director');

    Route::get('/discipline/my-record', [DisciplineController::class, 'myRecord'])
        ->middleware('role:student,boarding');

    // Announcements
    Route::get('/announcements', [AnnouncementsController::class, 'index']);
    Route::post('/announcements', [AnnouncementsController::class, 'store'])
        ->middleware('role:director,secretary');

    // Documents
    Route::get('/documents', [DocumentsController::class, 'index']);
    Route::get('/documents/my-documents', [DocumentsController::class, 'myDocuments'])
        ->middleware('role:student,boarding');

    // Assignments
    Route::get('/assignments', [AssignmentsController::class, 'index']);
    Route::get('/assignments/my', [AssignmentsController::class, 'myAssignments'])
        ->middleware('role:student,boarding');

    // Extracurricular
    Route::get('/extracurricular', [ExtracurricularController::class, 'index']);
    Route::get('/extracurricular/my-enrollments', [ExtracurricularController::class, 'myEnrollments'])
        ->middleware('role:student,boarding');

    // Settings
    Route::get('/settings/fee-structure', [SettingsController::class, 'feeStructure'])
        ->middleware('role:director,cashier');
});
