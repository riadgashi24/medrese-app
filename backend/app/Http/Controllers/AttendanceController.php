<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Ruajmë VETËM mungesat/vonesat për të mos ngarkuar DB-në.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'records' => ['present', 'array'], // dërgohen vetëm nxënësit që MUNOJNË ose VONOJNË
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:Absent,Late,Excused'],
            'records.*.note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request) {
            // Fshijmë regjistrimet e mëparshme jo-prezent për këtë ditë/klasë që të bëjmë overwrite të pastër
            AttendanceRecord::where('class_id', $request->class_id)
                ->where('date', $request->date)
                ->delete();

            foreach ($request->records as $record) {
                AttendanceRecord::create([
                    'class_id' => $request->class_id,
                    'date' => $request->date,
                    'student_id' => $record['student_id'],
                    'status' => $record['status'],
                    'note' => $record['note'] ?? null,
                    'recorded_by_user_id' => $request->user()->id,
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Prezenca u ruajt me sukses!'], 201);
    }

    /**
     * Dashboard Overview API - Kalkulon gjithçka dinamikisht sipas përjashtimeve (Absences)
     */
    public function overview(Request $request): JsonResponse
    {
        $classId = $request->get('class_id');
        $class = ClassModel::withCount('students')->with('homeroomTeacher')->find($classId);

        if (!$class) {
            return response()->json(['success' => false, 'message' => 'Klasa nuk u gjet.'], 404);
        }

        $totalStudents = $class->students_count;
        if ($totalStudents === 0) {
            return response()->json(['success' => true, 'data' => null]);
        }

        $today = Carbon::today()->toDateString();

        // 1. Statistikat e Sotme
        $todayExceptions = AttendanceRecord::where('class_id', $classId)
            ->where('date', $today)
            ->get();

        $absentToday = $todayExceptions->where('status', 'Absent')->count();
        $lateToday = $todayExceptions->where('status', 'Late')->count();
        $excusedToday = $todayExceptions->where('status', 'Excused')->count();
        $presentToday = max(0, $totalStudents - ($absentToday + $lateToday + $excusedToday));

        // 2. Tërheqim të gjithë nxënësit dhe regjistrimet në 2 query (Eliminimi i N+1 Problem)
        $students = Student::where('class_id', $classId)->get();

        // Merrim të gjitha rekordet e kësaj klase në një query të vetme
        $allRecords = AttendanceRecord::where('class_id', $classId)
            ->get()
            ->groupBy('student_id');

        // Përcaktojmë numrin e ditëve mësimore të regjistruara deri sot
        $totalSchoolDays = AttendanceRecord::where('class_id', $classId)
            ->distinct('date')
            ->count('date') ?: 1;

        $studentStats = $students->map(function ($student) use ($allRecords, $totalSchoolDays) {
            $records = $allRecords->get($student->id, collect());

            $absent = $records->where('status', 'Absent')->count();
            $late = $records->where('status', 'Late')->count();
            $excused = $records->where('status', 'Excused')->count();
            $present = max(0, $totalSchoolDays - ($absent + $late + $excused));

            $attendanceRate = round(($present / $totalSchoolDays) * 100, 1);
            $lastRecord = $records->sortByDesc('date')->first();

            // 💡 Ndërtimi i emrit (fallback në rast se fusha nuk quhet thjesht 'name')
            $fullName = $student->name
                ?? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''))
                ?: ($student->user->name ?? 'Nxënës ' . $student->id);

            return [
                'id' => $student->id,
                'rollNumber' => $student->roll_number ?? (string) $student->id,
                'name' => $fullName,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'rate' => $attendanceRate,
                'lastDate' => $lastRecord ? $lastRecord->date : '-',
            ];
        });

        // 3. Students Requiring Attention (Nën 80% ose mungesa të shpeshta)
        $requiringAttention = $studentStats->filter(fn($s) => $s['rate'] < 80 || $s['absent'] >= 5)->values();

        // 4. Trendi i 30 ditëve të fundit
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

            $trend[] = [
                'date' => Carbon::parse($d)->format('d M'),
                'rate' => $rate,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'header' => [
                    'className' => $class->name,
                    'academicYear' => $class->academic_year ?? '2025/2026',
                    'homeroomTeacher' => $class->homeroomStaff->full_name ?? 'N/A',
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
            ]
        ]);
    }
}