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
use App\Http\Controllers\GradeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Të gjitha brenda Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/email', [ProfileController::class, 'updateEmail']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/photo', [ProfileController::class, 'photo']);
    Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto']);

    // Students (Menaxhimi nga drejtori/sekretari)
    Route::middleware('role:director,secretary')->group(function () {
        Route::post('/students', [StudentsController::class, 'store']);
        Route::put('/students/{id}', [StudentsController::class, 'update']);
        Route::delete('/students/{id}', [StudentsController::class, 'destroy']);
        Route::post('/students/import', [StudentsController::class, 'import']);
        Route::post('/students/{id}/reset-password', [StudentsController::class, 'resetPassword']);
        Route::delete('/students/{id}/delete', [StudentsController::class, 'softDelete']);
    });

    Route::get('/students', [StudentsController::class, 'index']);
    Route::get('/students/{id}', [StudentsController::class, 'show']);
    if (config('medrese.features.finance')) {
        Route::get('/students/{studentId}/pay', [StudentsController::class, 'payInfo'])
            ->middleware('role:director,cashier,secretary');
    }

    // Staff directory: staff is global; profile self-edit is handled in the controller.
    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/{staff}', [StaffController::class, 'show']);
    Route::post('/staff', [StaffController::class, 'store'])->middleware('role:director,secretary');
    Route::put('/staff/{staff}', [StaffController::class, 'update']);
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->middleware('role:director,secretary');
    Route::post('/staff/import', [StaffController::class, 'import'])->middleware('role:director,secretary');
    Route::post('/staff/{staff}/photo', [StaffController::class, 'photo']);
    Route::delete('/staff/{staff}/photo', [StaffController::class, 'deletePhoto']);

    // Approvals
    Route::apiResource('approval', ApprovalController::class);

    // Classes
    Route::apiResource('classes', ClassController::class);
    Route::post('/classes/{class}/assign-homeroom', [ClassController::class, 'assignHomeroom'])->middleware('role:director,secretary');
    Route::post('/classes/{class}/assign-students', [ClassController::class, 'assignStudents'])->middleware('role:director,secretary');

    /*
    |--------------------------------------------------------------------------
    | Academic & Subjects (Përputhur plotësisht me api.js e Frontend-it)
    |--------------------------------------------------------------------------
    */
    Route::get('/academic/classes', [AcademicController::class, 'classes']);

    Route::prefix('academic')->group(function () {
        // Subjects CRUD & Details
        Route::get('subjects', [AcademicController::class, 'subjects']);                        // GET /academic/subjects
        Route::post('subjects', [AcademicController::class, 'storeSubject']);                    // POST /academic/subjects
        Route::put('subjects/{id}', [AcademicController::class, 'updateSubject']);               // PUT /academic/subjects/{id}
        Route::delete('subjects/{id}', [AcademicController::class, 'destroySubject']);           // DELETE /academic/subjects/{id}
        Route::get('subjects/{id}/details', [AcademicController::class, 'showSubjectDetails']);  // GET /academic/subjects/{id}/details
        Route::get('subject-options', [AcademicController::class, 'subjectOptions']);
        Route::post('subject-assignments', [AcademicController::class, 'assignSubjectToClass'])->middleware('role:director,secretary');
        Route::put('subject-assignments/{assignmentId}', [AcademicController::class, 'updateSubjectAssignment'])->middleware('role:director,secretary');
        Route::delete('subject-assignments/{assignmentId}', [AcademicController::class, 'deleteSubjectAssignment'])->middleware('role:director,secretary');

        // Raporti i klasës për lëndën
        Route::get('report/class/{classId}/subject/{subjectId}', [AcademicController::class, 'getClassSubjectReport']); // GET /academic/report/class/{classId}/subject/{subjectId}

        // Orari
        Route::get('timetable', [AcademicController::class, 'timetable']);
        Route::put('day-supervisor', [AcademicController::class, 'updateDaySupervisor']);
        Route::post('timetable/slots', [AcademicController::class, 'saveTimetableSlot'])->middleware('role:director,secretary');
        Route::delete('timetable/slots/{id}', [AcademicController::class, 'deleteTimetableSlot'])->middleware('role:director,secretary');
    });

    Route::get('/academic-years', [AcademicController::class, 'academicYears']);
    Route::get('/academic-years/{id}', [AcademicController::class, 'academicYear']);
    Route::post('/academic-years', [AcademicController::class, 'storeAcademicYear'])->middleware('role:director,secretary');
    Route::post('/academic-years/initialize', [AcademicController::class, 'initializeAcademicYear'])->middleware('role:director,secretary');
    Route::post('/academic-years/promotion-preview', [AcademicController::class, 'previewPromotion'])->middleware('role:director,secretary');
    Route::put('/academic-years/{id}', [AcademicController::class, 'updateAcademicYear'])->middleware('role:director,secretary');
    Route::put('/academic-years/{id}/activate', [AcademicController::class, 'activateAcademicYear'])->middleware('role:director,secretary');
    Route::post('/academic-years/{id}/promote', [AcademicController::class, 'promoteAcademicYear'])->middleware('role:director,secretary');

    // Dashboard
    Route::middleware('role:student,boarding')->group(function () {
        Route::get('/student/portal', [\App\Http\Controllers\StudentPortalController::class, 'show']);
        Route::get('/student/notifications', [\App\Http\Controllers\StudentPortalController::class, 'inbox']);
        Route::post('/student/notifications/read', [\App\Http\Controllers\StudentPortalController::class, 'markRead']);
    });
    Route::middleware('role:director,secretary,teacher')->group(function () {
        Route::get('/portal/entries', [\App\Http\Controllers\StudentPortalController::class, 'manage']);
        Route::post('/portal/entries', [\App\Http\Controllers\StudentPortalController::class, 'store']);
        Route::delete('/portal/entries/{entry}', [\App\Http\Controllers\StudentPortalController::class, 'destroy']);
    });
    Route::middleware('role:secretary')->get('/dashboard/secretary', [DashboardController::class, 'secretary']);
    Route::middleware('role:director,principal')->get('/dashboard/principal', [DashboardController::class, 'principal']);

    // Finance: intentionally disabled until the school approves this module.
    if (config('medrese.features.finance')) {
        Route::middleware('role:director,cashier,secretary')->group(function () {
            Route::get('/finance/overview', [FinanceController::class, 'overview']);
            Route::get('/outstanding', [FinanceController::class, 'outstanding']);
            Route::get('/finance/reports', [FinanceController::class, 'reports']);
            Route::get('/payments', [FinanceController::class, 'payments']);
            Route::get('/fee-structures', [FinanceController::class, 'feeStructures']);
            Route::get('/invoices', [FinanceController::class, 'invoices']);
        });

        Route::middleware('role:director,cashier')->group(function () {
            Route::post('/payments', [FinanceController::class, 'storePayment']);
            Route::post('/fee-structures', [FinanceController::class, 'storeFeeStructure']);
            Route::put('/fee-structures/{id}', [FinanceController::class, 'updateFeeStructure']);
            Route::post('/invoices/generate', [FinanceController::class, 'generateInvoice']);
        });
    }

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::get('/attendance/reports', [AttendanceController::class, 'reports']);
    Route::get('/attendance/overview', [AttendanceController::class, 'overview']);

    Route::post('/attendance', [AttendanceController::class, 'store'])->middleware('role:teacher,educator');
    Route::post('/attendance/fajr', [AttendanceController::class, 'storeFajr'])->middleware('role:educator');
    Route::post('/attendance/study-hours', [AttendanceController::class, 'storeStudyHours'])->middleware('role:educator');
    Route::put('/attendance/{attendance}', [AttendanceController::class, 'update'])->middleware('role:teacher,educator,director,secretary');

    // Attendance review (homeroom teacher)
    Route::post('/attendance/review', [AttendanceController::class, 'reviewAbsence'])->middleware('role:teacher,educator,director,secretary');
    Route::post('/attendance/review-batch', [AttendanceController::class, 'batchReviewAbsences'])->middleware('role:teacher,educator,director,secretary');
    Route::get('/attendance/pending-review', [AttendanceController::class, 'pendingReview']);

    Route::get('/classes/{classId}/grades', [GradeController::class, 'getClassGrades']);
    Route::put('/classes/{classId}/grades', [GradeController::class, 'updateGrade']);

    Route::middleware('role:teacher,director,secretary')->prefix('homeroom')->group(function () {
        Route::get('/', [\App\Http\Controllers\HomeroomController::class, 'index']);
        Route::get('/{classId}', [\App\Http\Controllers\HomeroomController::class, 'show']);
        Route::get('/{classId}/history', [\App\Http\Controllers\HomeroomController::class, 'history']);
        Route::get('/{classId}/history/{historicalId}', [\App\Http\Controllers\HomeroomController::class, 'historicalReport']);
        Route::get('/{classId}/certificates', [\App\Http\Controllers\HomeroomController::class, 'certificates']);
        Route::put('/{classId}/settings', [\App\Http\Controllers\HomeroomController::class, 'settings']);
        Route::put('/{classId}/students/{studentId}', [\App\Http\Controllers\HomeroomController::class, 'student']);
        Route::put('/{classId}/grades', [\App\Http\Controllers\HomeroomController::class, 'grades']);
        Route::put('/{classId}/absences', [\App\Http\Controllers\HomeroomController::class, 'absences']);
        Route::put('/{classId}/hours', [\App\Http\Controllers\HomeroomController::class, 'hours']);
    });

    // Teacher dashboard - weekly schedule & lesson cards
    Route::middleware('role:teacher')->prefix('teacher/workspace')->group(function () {
        Route::get('/', [\App\Http\Controllers\TeacherWorkspaceController::class, 'index']);
        Route::get('/classes/{classId}/subjects/{subjectId}', [\App\Http\Controllers\TeacherWorkspaceController::class, 'show']);
        Route::put('/classes/{classId}/subjects/{subjectId}/grades', [\App\Http\Controllers\TeacherWorkspaceController::class, 'grade']);
        Route::put('/classes/{classId}/subjects/{subjectId}/grades-batch', [\App\Http\Controllers\TeacherWorkspaceController::class, 'batchGrades']);
        Route::post('/classes/{classId}/subjects/{subjectId}/publications', [\App\Http\Controllers\TeacherWorkspaceController::class, 'publish']);
        Route::patch('/classes/{classId}/subjects/{subjectId}/assignments/{assignment}', [\App\Http\Controllers\TeacherWorkspaceController::class, 'completeAssignment']);
        Route::post('/classes/{classId}/subjects/{subjectId}/lessons', [\App\Http\Controllers\TeacherWorkspaceController::class, 'saveLesson']);
        Route::put('/classes/{classId}/subjects/{subjectId}/lessons/{lessonId}', [\App\Http\Controllers\TeacherWorkspaceController::class, 'saveLesson']);
    });
    Route::get('/teacher/schedule', [DashboardController::class, 'teacherSchedule']);
    Route::get('/teacher/today', [DashboardController::class, 'teacherToday']);

    // Dormitory
    Route::middleware('role:director,educator,secretary')->group(function () {
        Route::get('/dormitory', [DormitoryController::class, 'overview']);
        Route::get('/dormitory/rooms', [DormitoryController::class, 'rooms']);
        Route::get('/dormitory/inspections', [DormitoryController::class, 'inspections']);
        Route::post('/dormitory/assign-room', [DormitoryController::class, 'assignRoom']);
        Route::post('/dormitory/unassign-room/{assignment}', [DormitoryController::class, 'unassignRoom']);
        Route::post('/dormitory/archive-year', [DormitoryController::class, 'archiveYear']);
    });
    Route::post('/dormitory/inspections', [DormitoryController::class, 'storeInspection'])->middleware('role:educator');
    Route::get('/dormitory/inspections/{id}', [DormitoryController::class, 'inspections'])->middleware('role:educator');
    Route::put('/dormitory/inspections/{id}', [DormitoryController::class, 'updateInspection'])->middleware('role:educator');
    Route::delete('/dormitory/inspections/{id}', [DormitoryController::class, 'destroyInspection'])->middleware('role:educator,director');
    Route::get('/dormitory/leaderboard', [DormitoryController::class, 'leaderboard']);
    Route::get('/dormitory/my-room', [DormitoryController::class, 'myRoom'])->middleware('role:student,boarding,educator');

    if (config('medrese.features.finance')) {
        Route::get('/student/finance', [FinanceController::class, 'studentFinance'])->middleware('role:student,boarding');
    }
    Route::get('/student/grades', [GradeController::class, 'studentGrades'])->middleware('role:student,boarding');
    Route::get('/student/attendance', [AttendanceController::class, 'studentAttendance'])->middleware('role:student,boarding');

    // Discipline
    Route::middleware('role:teacher,educator,director')->group(function () {
        Route::post('/discipline/record', [DisciplineController::class, 'store']);
        Route::get('/discipline/history', [DisciplineController::class, 'history']);
        Route::get('/discipline/categories', [DisciplineController::class, 'categories']);
    });
    Route::get('/discipline/my-record', [DisciplineController::class, 'myRecord'])->middleware('role:student,boarding');

    // Announcements
    Route::get('/announcements', [AnnouncementsController::class, 'index']);
    Route::post('/announcements', [AnnouncementsController::class, 'store'])->middleware('role:director,secretary');

    // Documents
    Route::get('/documents', [DocumentsController::class, 'index']);
    Route::get('/documents/my-documents', [DocumentsController::class, 'myDocuments'])->middleware('role:student,boarding');

    // Assignments
    Route::get('/assignments', [AssignmentsController::class, 'index']);
    Route::get('/assignments/my', [AssignmentsController::class, 'myAssignments'])->middleware('role:student,boarding');

    // Extracurricular
    Route::get('/extracurricular', [ExtracurricularController::class, 'index']);
    Route::get('/extracurricular/my-enrollments', [ExtracurricularController::class, 'myEnrollments'])->middleware('role:student,boarding');

    // Settings
    Route::get('/settings/fee-structure', [SettingsController::class, 'feeStructure'])->middleware('role:director,cashier');

}); // KËTU mbyllet i gjithë blloku i autentifikimit Sanctum siç duhet!
