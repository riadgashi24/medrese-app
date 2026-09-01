<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceAudit;
use App\Models\ClassModel;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Ruajmë VETËM mungesat/vonesat. Nxënësit që NUK dërgohen, konsiderohen prezent.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'records' => ['present', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:Absent,Late,Excused'],
            'records.*.note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request) {
            AttendanceRecord::where('class_id', $request->class_id)
                ->where('date', $request->date)
                ->delete();

            foreach ($request->records as $record) {
                AttendanceRecord::create([
                    'class_id' => $request->class_id,
                    'date' => $request->date,
                    'student_id' => $record['student_id'],
                    'status' => $record['status'],
                    'absence_type' => 'Unjustified',
                    'note' => $record['note'] ?? null,
                    'recorded_by_user_id' => $request->user()->id,
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Prezenca u ruajt me sukses!'], 201);
    }

    /**
     * Update an attendance record (generic, used by existing PUT route)
     */
    public function update(Request $request, AttendanceRecord $attendance): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:Absent,Late,Excused'],
            'absence_type' => ['sometimes', 'in:Excused,Unexcused'],
            'note' => ['nullable', 'string'],
        ]);

        $attendance->update($validated);

        if (isset($validated['absence_type'])) {
            $attendance->update([
                'excused_by_user_id' => $request->user()->id,
                'excused_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $attendance->load('student'),
        ]);
    }

    /**
     * Homeroom teacher approves absence as Excused or Unexcused
     */
    public function reviewAbsence(Request $request): JsonResponse
    {
        $request->validate([
            'attendance_id' => 'required|exists:attendance_records,id',
            'absence_type' => 'required|in:Excused,Unexcused',
            'note' => 'nullable|string',
        ]);

        $record = AttendanceRecord::findOrFail($request->attendance_id);
        $oldType = $record->absence_type;

        $record->update([
            'absence_type' => $request->absence_type,
            'excused_by_user_id' => $request->user()->id,
            'excused_at' => now(),
            'note' => $request->note ?? $record->note,
        ]);

        AttendanceAudit::create([
            'attendance_record_id' => $record->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldType,
            'new_status' => $request->absence_type,
            'note' => $request->note,
        ]);

        return response()->json([
            'success' => true,
            'data' => $record->load('student'),
            'message' => 'Mungesa u rishikua.',
        ]);
    }

    /**
     * Batch review - homeroom teacher approves multiple at once
     */
    public function batchReviewAbsences(Request $request): JsonResponse
    {
        $request->validate([
            'records' => 'required|array',
            'records.*.id' => 'required|exists:attendance_records,id',
            'records.*.absence_type' => 'required|in:Excused,Unexcused',
            'records.*.note' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->records as $rec) {
                $record = AttendanceRecord::findOrFail($rec['id']);
                $oldType = $record->absence_type;

                $record->update([
                    'absence_type' => $rec['absence_type'],
                    'excused_by_user_id' => $request->user()->id,
                    'excused_at' => now(),
                    'note' => $rec['note'] ?? $record->note,
                ]);

                AttendanceAudit::create([
                    'attendance_record_id' => $record->id,
                    'changed_by_user_id' => $request->user()->id,
                    'old_status' => $oldType,
                    'new_status' => $rec['absence_type'],
                    'note' => $rec['note'] ?? null,
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Mungesat u rishikuan.']);
    }

    /**
     * Get pending absences for homeroom teacher approval
     */
    public function pendingReview(Request $request): JsonResponse
    {
        $user = $request->user();
        $class = ClassModel::where('homeroom_staff_id', $user->staff?->id)->first();

        if (!$class) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $records = AttendanceRecord::with(['student'])
            ->where('class_id', $class->id)
            ->where('absence_type', 'Unjustified')
            ->latest('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with(['student', 'recordedBy']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }
        if ($request->filled('from')) {
            $query->where('date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('date', '<=', $request->to);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest('date')->paginate($request->get('per_page', 50)),
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $classId = $request->get('class_id');
        $studentId = $request->get('student_id');

        $query = AttendanceRecord::query();
        if ($classId)
            $query->where('class_id', $classId);
        if ($studentId)
            $query->where('student_id', $studentId);

        $records = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_absences' => $records->where('status', 'Absent')->count(),
                'total_late' => $records->where('status', 'Late')->count(),
                'total_excused' => $records->whereIn('status', ['Absent', 'Late'])->where('absence_type', 'Excused')->count(),
                'total_unexcused' => $records->whereIn('status', ['Absent', 'Late'])->where('absence_type', 'Unexcused')->count(),
                'records' => $records,
            ],
        ]);
    }

    /**
     * Student's own attendance (read-only)
     */
    public function studentAttendance(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'No student profile.'], 404);
        }

        $records = AttendanceRecord::where('student_id', $student->id)
            ->latest('date')
            ->get();

        $totalAbsent = $records->where('status', 'Absent')->count();
        $totalLate = $records->where('status', 'Late')->count();
        $totalExcused = $records->whereIn('status', ['Absent', 'Late'])->where('absence_type', 'Excused')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_absences' => $totalAbsent,
                'total_late' => $totalLate,
                'total_excused' => $totalExcused,
                'total_unexcused' => ($totalAbsent + $totalLate) - $totalExcused,
                'records' => $records->map(fn($r) => [
                    'id' => $r->id,
                    'date' => $r->date,
                    'status' => $r->status,
                    'absence_type' => $r->absence_type,
                    'note' => $r->note,
                ]),
            ],
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $classId = $request->get('class_id');
        $class = ClassModel::withCount('students')->with('homeroomStaff')->find($classId);

        if (!$class) {
            return response()->json(['success' => false, 'message' => 'Klasa nuk u gjet.'], 404);
        }

        $totalStudents = $class->students_count;
        if ($totalStudents === 0) {
            return response()->json(['success' => true, 'data' => null]);
        }

        $today = Carbon::today()->toDateString();

        $todayExceptions = AttendanceRecord::where('class_id', $classId)
            ->where('date', $today)
            ->get();

        $absentToday = $todayExceptions->where('status', 'Absent')->count();
        $lateToday = $todayExceptions->where('status', 'Late')->count();
        $excusedToday = $todayExceptions->where('status', 'Excused')->count();
        $presentToday = max(0, $totalStudents - ($absentToday + $lateToday + $excusedToday));

        $students = Student::where('class_id', $classId)->get();
        $allRecords = AttendanceRecord::where('class_id', $classId)->get()->groupBy('student_id');
        $totalSchoolDays = AttendanceRecord::where('class_id', $classId)->distinct('date')->count('date') ?: 1;

        $studentStats = $students->map(function ($student) use ($allRecords, $totalSchoolDays) {
            $records = $allRecords->get($student->id, collect());
            $absent = $records->where('status', 'Absent')->count();
            $late = $records->where('status', 'Late')->count();
            $excused = $records->where('status', 'Excused')->count();
            $present = max(0, $totalSchoolDays - ($absent + $late + $excused));
            $attendanceRate = round(($present / $totalSchoolDays) * 100, 1);
            $lastRecord = $records->sortByDesc('date')->first();

            $fullName = $student->name
                ?? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''))
                ?: ($student->user->name ?? 'Nxënës ' . $student->id);

            return [
                'id' => $student->id,
                'rollNumber' => $student->student_id ?? (string) $student->id,
                'name' => $fullName,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'rate' => $attendanceRate,
                'lastDate' => $lastRecord ? $lastRecord->date : '-',
            ];
        });

        $requiringAttention = $studentStats->filter(fn($s) => $s['rate'] < 80 || $s['absent'] >= 5)->values();

        $thirtyDaysAgo = Carbon::today()->subDays(30);
        $trendRecords = AttendanceRecord::where('class_id', $classId)
            ->where('date', '>=', $thirtyDaysAgo)
            ->select('date', DB::raw('count(*) as total_exceptions'))
            ->groupBy('date')
            ->pluck('total_exceptions', 'date');

        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i)->format('Y-m-d');
            $exceptions = $trendRecords[$d] ?? 0;
            $presentCount = max(0, $totalStudents - $exceptions);
            $rate = round(($presentCount / $totalStudents) * 100, 1);
            $trend[] = ['date' => Carbon::parse($d)->format('d M'), 'rate' => $rate];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'header' => [
                    'className' => $class->name,
                    'academicYear' => $class->academicYear?->label ?? 'N/A',
                    'homeroomTeacher' => $class->homeroomStaff?->full_name ?? 'N/A',
                    'totalStudents' => $totalStudents,
                    'attendancePercentage' => round($studentStats->avg('rate'), 1),
                ],
                'stats' => [
                    'total' => $totalStudents,
                    'presentToday' => $presentToday,
                    'absentToday' => $absentToday,
                    'lateToday' => $lateToday,
                    'excusedToday' => $excusedToday,
                    'rateToday' => round(($presentToday / $totalStudents) * 100, 1),
                ],
                'trend' => $trend,
                'students' => $studentStats,
                'requiringAttention' => $requiringAttention,
                'totalSchoolDays' => $totalSchoolDays,
            ],
        ]);
    }
}