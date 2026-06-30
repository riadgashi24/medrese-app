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

    public function principal()
    {
        $stats = [
            'total_students' => Student::count(),
            'total_staff' => Staff::count(),
            'boarding' => Student::where('type', 'Boarding')->count(),
            'approvals' => Approval::where('status', 'Pending')->count(),
        ];

        $attendance = AttendanceRecord::select(
            'date',
            DB::raw("COUNT(*) as total"),
            DB::raw("SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present")
        )
            ->whereDate('date', '>=', now()->subDays(6))
            ->groupBy('date')
            ->get()
            ->keyBy(function ($item) {
                return $item->date;
            });

        $attendanceOverview = collect();

        for ($i = 6; $i >= 0; $i--) {

            $date = now()->subDays($i)->toDateString();

            $row = $attendance->get($date);

            $attendanceOverview->push([

                'day' => now()->subDays($i)->format('D'),

                'present' => $row
                    ? round(($row->present / $row->total) * 100)
                    : 0,

            ]);
        }

        $todayAttendance = AttendanceRecord::select(

            'status',

            DB::raw('COUNT(*) as total')

        )
            ->whereDate('date', today())
            ->groupBy('status')
            ->pluck('total', 'status');

        $todayAttendanceChart = collect([
            [
                'name' => 'Present',
                'value' => (int) ($todayAttendance['Present'] ?? 0),
            ],
            [
                'name' => 'Absent',
                'value' => (int) ($todayAttendance['Absent'] ?? 0),
            ],
            [
                'name' => 'Excused',
                'value' => (int) ($todayAttendance['Excused'] ?? 0),
            ],
        ]);

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
                'attendance_overview' => $attendanceOverview,
                'today_attendance' => $todayAttendanceChart,
            ],

            'announcements' => $announcements,
        ]);
    }
}