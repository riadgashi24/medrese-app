<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Approval;
use App\Models\Document;
use App\Models\Staff;
use App\Models\Student;
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
}