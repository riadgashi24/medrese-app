<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Approval;
use App\Models\Document;
use App\Models\Staff;
use App\Models\Student;
use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function secretary()
    {
        $stats = [
            'total_students' => Student::count(),
            'pending_enrollments' => Student::where('status', 'pending')->count(),
            'class_assignments' => Student::whereNull('class_id')->count(),
            'documents' => Document::count(),
        ];

        $enrollmentByClass = Student::select(
            'class_id',
            DB::raw('COUNT(*) as students_count')
        )
            ->whereNotNull('class_id')
            ->with('class:id,name,section')
            ->groupBy('class_id')
            ->get()
            ->map(function ($item) {
                return [
                    'class' => trim($item->class->name . ' ' . $item->class->section),
                    'students' => $item->students_count,
                ];
            });

        $announcements = Announcement::with('author:id,name')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take(4)
            ->get()
            ->map(function ($announcement) {
                return [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'date' => $announcement->published_at?->format('d M Y'),
                    'author' => $announcement->author?->name ?? 'System',
                    'priority' => $announcement->priority,
                ];
            });

        return response()->json([
            'stats' => $stats,

            'charts' => [
                'enrollment_by_class' => $enrollmentByClass,
            ],

            'announcements' => $announcements,
        ]);
    }

    public function teacherSchedule(Request $request): JsonResponse
    {
        $user = $request->user();
        $academicYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');

        if (!$academicYearId) {
            return response()->json(['success' => false, 'message' => 'No active academic year.'], 404);
        }

        $slots = \App\Models\TimetableSlot::with(['class:id,name', 'subject:id,name'])
            ->where('teacher_user_id', $user->id)
            ->where('academic_year_id', $academicYearId)
            ->orderBy('day')
            ->orderBy('slot_number')
            ->get();

        $grouped = $slots->groupBy('day')->map(fn($daySlots) => [
            'day' => $daySlots->first()->day,
            'slots' => $daySlots->map(fn($slot) => [
                'id' => $slot->id,
                'slot_number' => $slot->slot_number,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'class_name' => $slot->class?->name,
                'subject_name' => $slot->subject?->name,
            ]),
        ])->values();

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }

    public function teacherToday(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->format('l');
        $academicYearId = \App\Models\AcademicYear::where('is_active', true)->value('id');

        $slots = \App\Models\TimetableSlot::with(['class:id,name', 'subject:id,name'])
            ->where('teacher_user_id', $user->id)
            ->where('day', $today)
            ->where('academic_year_id', $academicYearId)
            ->orderBy('slot_number')
            ->get()
            ->map(fn($slot) => [
                'id' => $slot->id,
                'slot_number' => $slot->slot_number,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'class_name' => $slot->class?->name,
                'class_id' => $slot->class_id,
                'subject_name' => $slot->subject?->name,
            ]);

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function principal()
    {
        $totalStudents = Student::count();

        $stats = [
            'total_students' => $totalStudents,
            'total_staff' => Staff::count(),
            'boarding' => Student::where('type', 'Boarding')->count(),
            'approvals' => class_exists(Approval::class) ? Approval::where('status', 'Pending')->count() : 0,
        ];

        // 1. Frekuentimi gjatë 7 ditëve të fundit (Save by Exception)
        $exceptions = AttendanceRecord::select(
            'date',
            DB::raw("COUNT(*) as total_exceptions")
        )
            ->whereDate('date', '>=', now()->subDays(6))
            ->groupBy('date')
            ->get()
            ->keyBy(function ($item) {
                // Sigurohemi që data është string YYYY-MM-DD
                return Carbon::parse($item->date)->toDateString();
            });

        $attendanceOverview = collect();

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dayName = now()->subDays($i)->format('D'); // e.g. Mon, Tue

            $row = $exceptions->get($date);
            $totalExceptions = $row ? $row->total_exceptions : 0;

            // Nëse nuk ka nxënës në shkollë, vendosim 100% ose 0% sipas rastit
            if ($totalStudents === 0) {
                $presentPercentage = 100;
            } else {
                $presentStudents = max(0, $totalStudents - $totalExceptions);
                $presentPercentage = round(($presentStudents / $totalStudents) * 100);
            }

            $attendanceOverview->push([
                'day' => $dayName,
                'present' => $presentPercentage,
            ]);
        }

        // 2. Frekuentimi i sotëm për PieChart (Save by Exception)
        $todayExceptions = AttendanceRecord::whereDate('date', today())
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $absentCount = (int) ($todayExceptions['Absent'] ?? 0);
        $lateCount = (int) ($todayExceptions['Late'] ?? 0);
        $excusedCount = (int) ($todayExceptions['Excused'] ?? 0);

        $totalTodayExceptions = $absentCount + $lateCount + $excusedCount;
        $presentTodayCount = max(0, $totalStudents - $totalTodayExceptions);

        $todayAttendanceChart = [
            ['name' => 'Pranishëm', 'value' => $presentTodayCount],
            ['name' => 'Mungesë', 'value' => $absentCount + $lateCount],
            ['name' => 'Me leje', 'value' => $excusedCount],
        ];

        // 3. Aktiviteti i fundit (Njoftimet)
        $recentActivity = Announcement::with('author:id,name')
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->take(5)
            ->get()
            ->map(function ($announcement) {
                return [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'time' => $announcement->published_at?->diffForHumans() ?? 'Së fundmi',
                    'user' => $announcement->author?->name ?? 'Sistemi',
                    'type' => 'announcement',
                ];
            });

        return response()->json([
            'stats' => $stats,
            'charts' => [
                'attendance_overview' => $attendanceOverview,
                'today_attendance' => $todayAttendanceChart,
            ],
            'recent_activity' => $recentActivity,
        ]);
    }
}