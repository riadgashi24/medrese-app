<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\DaySupervisor;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\Student;
use App\Models\StudentAcademicEnrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicController extends Controller
{
    public function classes(): JsonResponse
    {
        $classes = ClassModel::with('academicYear')->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    // 1. Merr listën e lëndëve (përditësuar me kontroll për studentin)
    public function subjects(): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();

        // Nëse është student, kthejmë vetëm lëndët që i takojnë klasës së tij
        if ($user && $user->role === 'student') {
            $subjects = \App\Models\Subject::whereHas('schoolClasses', function ($query) use ($user) {
                $query->where('school_classes.id', $user->school_class_id);
            })->get();
        } else {
            // Për të tjerët kthehen të gjitha lëndët e rreshtuara sipas klasës dhe kategorisë
            $subjects = \App\Models\Subject::orderBy('level')->orderBy('category')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);
    }

    // 2. Ruaj lëndë të re (Vetëm Drejtori dhe Sekretari)
    public function storeSubject(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        if (!in_array(auth()->user()->role, ['director', 'secretary'])) {
            return response()->json(['success' => false, 'message' => 'Pa autorizim'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'level' => 'required|integer|in:10,11,12',
            'description' => 'nullable|string',
        ]);

        $subject = \App\Models\Subject::create($validated);

        return response()->json(['success' => true, 'data' => $subject]);
    }

    public function updateSubject(\Illuminate\Http\Request $request, $id): \Illuminate\Http\JsonResponse
    {
        if (!in_array(auth()->user()->role, ['director', 'secretary'])) {
            return response()->json(['success' => false, 'message' => 'Pa autorizim'], 403);
        }
        $subject = Subject::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'level' => 'required|integer|in:10,11,12',
            'description' => 'nullable|string',
        ]);
        $subject->update($validated);
        return response()->json(['success' => true, 'data' => $subject]);
    }

    public function destroySubject($id): \Illuminate\Http\JsonResponse
    {
        if (!in_array(auth()->user()->role, ['director', 'secretary'])) {
            return response()->json(['success' => false, 'message' => 'Pa autorizim'], 403);
        }
        Subject::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Lënda u fshi me sukses.']);
    }

    public function showSubjectDetails(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $academicYearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_active', true)->value('id');
        $subject = Subject::findOrFail($id);
        $classes = $subject->classes()
            ->when($academicYearId, fn($query) => $query->where('classes.academic_year_id', $academicYearId))
            ->withCount('students')
            ->when($academicYearId, fn($query) => $query->withCount(['academicEnrollments as academic_students_count' => fn($enrollments) => $enrollments->where('academic_year_id', $academicYearId)]))
            ->get();
        $teacherNames = User::whereIn('id', $classes->pluck('pivot.teacher_user_id')->filter()->unique())
            ->pluck('name', 'id');
        $classAssignments = $classes->map(function ($class) use ($teacherNames) {
            return [
                'assignment_id' => $class->pivot->id ?? null,
                'class_id' => $class->id,
                'class_name' => $class->name,
                'weekly_hours' => $class->pivot->weekly_hours,
                'teacher_name' => $teacherNames[$class->pivot->teacher_user_id] ?? 'I pacaktuar',
                'teacher_user_id' => $class->pivot->teacher_user_id,
                'students_count' => ($class->academic_students_count ?? 0) > 0 ? $class->academic_students_count : ($class->students_count ?? 0),
                'academic_year_id' => $class->academic_year_id,
            ];
        });
        return response()->json(['success' => true, 'data' => ['subject' => $subject, 'classes' => $classAssignments]]);
    }

    public function subjectOptions(Request $request): JsonResponse
    {
        $academicYearId = $request->integer('academic_year_id') ?: AcademicYear::where('is_active', true)->value('id');
        $classes = ClassModel::when($academicYearId, fn($query) => $query->where('academic_year_id', $academicYearId))
            ->orderBy('name')->orderBy('section')->withCount('students')
            ->when($academicYearId, fn($query) => $query->withCount(['academicEnrollments as academic_students_count' => fn($enrollments) => $enrollments->where('academic_year_id', $academicYearId)]))
            ->get(['id', 'name', 'section', 'academic_year_id']);
        $assignments = DB::table('class_subject')
            ->join('classes', 'class_subject.class_model_id', '=', 'classes.id')
            ->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')
            ->where('classes.academic_year_id', $academicYearId)
            ->select(
                'class_subject.teacher_user_id',
                'class_subject.subject_id',
                'subjects.name as subject_name',
                'class_subject.class_model_id as class_id',
                'classes.name as class_name',
                'classes.section'
            )
            ->orderBy('subjects.name')
            ->orderBy('classes.name')
            ->get();
        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $classes->map(fn($class) => ['id' => $class->id, 'name' => $class->name . ($class->section ? ' - ' . $class->section : ''), 'students_count' => ($class->academic_students_count ?? 0) > 0 ? $class->academic_students_count : $class->students_count, 'academic_year_id' => $class->academic_year_id]),
                'teachers' => User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']),
                'assignments' => $assignments,
                'academic_year_id' => $academicYearId,
            ]
        ]);
    }
    public function assignSubjectToClass(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_user_id' => 'required|exists:users,id',
            'weekly_hours' => 'required|integer|min:1|max:40',
        ]);
        $class = ClassModel::where('academic_year_id', $validated['academic_year_id'])->findOrFail($validated['class_id']);
        User::where('role', 'teacher')->findOrFail($validated['teacher_user_id']);
        DB::table('class_subject')->updateOrInsert(
            ['class_model_id' => $class->id, 'subject_id' => $validated['subject_id']],
            ['teacher_user_id' => $validated['teacher_user_id'], 'weekly_hours' => $validated['weekly_hours'], 'updated_at' => now(), 'created_at' => now()]
        );
        return response()->json(['success' => true, 'data' => DB::table('class_subject')->where('class_model_id', $class->id)->where('subject_id', $validated['subject_id'])->first()], 200);
    }

    public function updateSubjectAssignment(Request $request, int $assignmentId): JsonResponse
    {
        $validated = $request->validate(['teacher_user_id' => 'required|exists:users,id', 'weekly_hours' => 'required|integer|min:1|max:40']);
        User::where('role', 'teacher')->findOrFail($validated['teacher_user_id']);
        DB::table('class_subject')->where('id', $assignmentId)->firstOrFail();
        DB::table('class_subject')->where('id', $assignmentId)->update(['teacher_user_id' => $validated['teacher_user_id'], 'weekly_hours' => $validated['weekly_hours'], 'updated_at' => now()]);
        return response()->json(['success' => true, 'data' => DB::table('class_subject')->where('id', $assignmentId)->first()]);
    }

    public function deleteSubjectAssignment(int $assignmentId): JsonResponse
    {
        abort_if(!DB::table('class_subject')->where('id', $assignmentId)->delete(), 404);
        return response()->json(['success' => true]);
    }

    // 6. Raporti akademik i nxënësve për një kombinim Klasë-Lëndë (Notat, Pjesëmarrja)
    public function getClassSubjectReport($classId, $subjectId): \Illuminate\Http\JsonResponse
    {
        // Përdorim ClassModel dhe gjejmë klasën e saktë
        $class = \App\Models\ClassModel::with(['students'])->findOrFail($classId);
        $subject = \App\Models\Subject::findOrFail($subjectId);

        // Marrim nxënësit e asaj klase përmes modelit tënd Student
        $reportData = $class->students->map(function ($student) {
            return [
                'student_id' => $student->id,
                'student_name' => $student->name ?? ($student->user ? $student->user->name : 'Nxënës'), // Nëse emri vjen nga tabela e përdoruesit
                'grades' => [5, 4, 5], // Mund ta lidhni me tabelën tuaj të notave më vonë
                'average' => 4.67,
                'absences' => 2,       // Mund ta lidhni me tabelën tuaj të mungesave më vonë
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'class_name' => $class->name . ($class->section ? ' - ' . $class->section : ''),
                'subject_name' => $subject->name,
                'students' => $reportData,
            ]
        ]);
    }
    public function timetable(Request $request): JsonResponse
    {
        // 1. Përcaktimi i vitit aktiv akademik (Merr vetëm ID-në)
        $academicYearId = $request->input(
            'academic_year_id',
            fn() => AcademicYear::where('is_active', true)->value('id')
        );

        if (!$academicYearId) {
            return response()->json([
                'success' => false,
                'message' => 'Nuk u gjet asnjë vit akademik aktiv.'
            ], 404);
        }

        // 2. Marrja e KREJT orarit për të gjithë shkollën (Pa pagination)
        // Marrëveshja: Selektojmë vetëm fushat e nevojshme te relacioni për të kursyer RAM me mijëra rreshta
        $slots = TimetableSlot::with([
            'class:id,name',
            'subject:id,name',
            'teacherUser:id,name'
        ])
            ->where('academic_year_id', $academicYearId)
            ->orderBy('day_of_week')
            ->orderBy('slot_number')
            ->get();

        $slots = $slots->map(function ($slot) {
            $slot->setAttribute('day', (int) $slot->day_of_week);
            return $slot;
        });

        // 3. Kujdestarët e Ditës
        $supervisors = DaySupervisor::where('academic_year_id', $academicYearId)
            ->pluck('supervisor_names', 'day');

        // 4. Statistikat e Profesorëve (All-in-one me Laravel Collection)
        $teacherAssignments = DB::table('class_subject')
            ->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')
            ->join('classes', 'class_subject.class_model_id', '=', 'classes.id')
            ->where('classes.academic_year_id', $academicYearId)
            ->whereNotNull('class_subject.teacher_user_id')
            ->select(
                'class_subject.teacher_user_id',
                'users.name as teacher_name',
                'class_subject.subject_id',
                'subjects.name as subject_name',
                'class_subject.class_model_id as class_id',
                'classes.name as class_name',
                'class_subject.weekly_hours'
            )
            ->join('users', 'class_subject.teacher_user_id', '=', 'users.id')
            ->get();

        $scheduledHours = DB::table('timetable_slots')
            ->where('academic_year_id', $academicYearId)
            ->select('teacher_user_id', DB::raw('count(*) as scheduled_weekly_hours'))
            ->groupBy('teacher_user_id')
            ->pluck('scheduled_weekly_hours', 'teacher_user_id');

        // Grupimi për çdo profesor
        $teacherStats = $teacherAssignments
            ->groupBy('teacher_user_id')
            ->map(function ($assignments, $teacherId) use ($scheduledHours) {
                $expected = $assignments->sum(fn($a) => (int) $a->weekly_hours);
                $scheduled = (int) ($scheduledHours[$teacherId] ?? 0);
                return [
                    'teacher_name' => $assignments->first()->teacher_name,
                    'total_weekly_hours' => $expected,
                    'scheduled_weekly_hours' => $scheduled,
                    'workload_difference' => $scheduled - $expected,
                    'assignments' => $assignments->map(fn($a) => [
                        'subject_id' => $a->subject_id,
                        'subject_name' => $a->subject_name,
                        'class_id' => $a->class_id,
                        'class_name' => $a->class_name,
                    ])->values(),
                ];
            });

        $teacherSlots = $slots->groupBy('teacher_user_id');
        $teachers = $teacherAssignments->groupBy('teacher_user_id')->map(function ($assignments, $teacherId) use ($teacherSlots) {
            $totalHours = $assignments->sum(fn($assignment) => (int) $assignment->weekly_hours);
            $assignedHours = $teacherSlots->get($teacherId, collect())->count();

            return [
                'id' => (int) $teacherId,
                'name' => $assignments->first()->teacher_name,
                'total_hours' => $totalHours,
                'assigned_hours' => $assignedHours,
                'remaining_hours' => max(0, $totalHours - $assignedHours),
                'slots' => $teacherSlots->get($teacherId, collect())->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $slots,
                'supervisors' => $supervisors,
                'teacher_stats' => $teacherStats,
                'teachers' => $teachers,
                'active_academic_year_id' => $academicYearId
            ]
        ]);
    }

    // Ruajtja/Përditësimi i Kujdestarit të Ditës
    public function updateDaySupervisor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'day' => 'required|string',
            'supervisor_names' => 'required|string',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $supervisor = DaySupervisor::updateOrCreate(
            [
                'academic_year_id' => $validated['academic_year_id'],
                'day' => $validated['day'],
            ],
            [
                'supervisor_names' => $validated['supervisor_names'],
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $supervisor,
            'message' => 'Kujdestarët e ditës u përditësuan me sukses.'
        ]);
    }

    /**
     * Ruaj ose përditëso një slot orari (Nga modal-i i modifikimit)
     */
    public function saveTimetableSlot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_user_id' => 'required|exists:users,id',
            'day' => 'required|integer|min:1|max:5',
            'slot_number' => 'required|integer|min:1|max:7',
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'slot_id' => 'nullable|integer|exists:timetable_slots,id',
        ]);

        $class = ClassModel::where('academic_year_id', $validated['academic_year_id'])->findOrFail($validated['class_id']);
        $assignmentExists = DB::table('class_subject')
            ->where('class_model_id', $class->id)
            ->where('subject_id', $validated['subject_id'])
            ->where('teacher_user_id', $validated['teacher_user_id'])
            ->exists();
        abort_unless($assignmentExists, 422, 'Ky profesor nuk është caktuar për këtë lëndë dhe klasë.');

        $existingSlot = !empty($validated['slot_id'])
            ? TimetableSlot::where('academic_year_id', $validated['academic_year_id'])->findOrFail($validated['slot_id'])
            : null;

        $teacherConflict = TimetableSlot::where('academic_year_id', $validated['academic_year_id'])
            ->where('teacher_user_id', $validated['teacher_user_id'])
            ->where('day_of_week', $validated['day'])
            ->where('slot_number', $validated['slot_number'])
            ->when($existingSlot, fn($query) => $query->where('id', '!=', $existingSlot->id))
            ->exists();
        abort_if($teacherConflict, 422, 'Ky profesor ka tashmë një orë në këtë kohë.');

        $classConflict = TimetableSlot::where('academic_year_id', $validated['academic_year_id'])
            ->where('class_id', $class->id)
            ->where('day_of_week', $validated['day'])
            ->where('slot_number', $validated['slot_number'])
            ->when($existingSlot, fn($query) => $query->where('id', '!=', $existingSlot->id))
            ->exists();
        abort_if($classConflict, 422, 'Kjo klasë ka tashmë një lëndë në këtë kohë.');

        $result = DB::transaction(function () use ($validated, $existingSlot, $class) {
            User::whereKey($validated['teacher_user_id'])->lockForUpdate()->firstOrFail();

            $totalHours = (int) DB::table('class_subject')
                ->join('classes', 'class_subject.class_model_id', '=', 'classes.id')
                ->where('classes.academic_year_id', $validated['academic_year_id'])
                ->where('class_subject.teacher_user_id', $validated['teacher_user_id'])
                ->sum('class_subject.weekly_hours');
            $assignedHours = TimetableSlot::where('academic_year_id', $validated['academic_year_id'])
                ->where('teacher_user_id', $validated['teacher_user_id'])
                ->when($existingSlot, fn($query) => $query->where('id', '!=', $existingSlot->id))
                ->count();
            $sameTeacherEdit = $existingSlot && (int) $existingSlot->teacher_user_id === (int) $validated['teacher_user_id'];
            if (!$sameTeacherEdit && $assignedHours >= $totalHours) {
                return [
                    'error' => [
                        'total_hours' => $totalHours,
                        'assigned_hours' => $assignedHours,
                    ],
                ];
            }

            $slot = $existingSlot ?: new TimetableSlot();
            $slot->fill([
                'day_of_week' => $validated['day'],
                'slot_number' => $validated['slot_number'],
                'teacher_user_id' => $validated['teacher_user_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'class_id' => $class->id,
                'subject_id' => $validated['subject_id'],
            ]);
            $slot->save();

            return ['slot' => $slot];
        });

        if (isset($result['error'])) {
            return response()->json([
                'success' => false,
                'message' => 'Ky profesor i ka plotësuar të gjitha orët javore të caktuara.',
                'total_hours' => $result['error']['total_hours'],
                'assigned_hours' => $result['error']['assigned_hours'],
                'remaining_hours' => 0,
            ], 422);
        }

        $slot = $result['slot'];

        $slot->load(['class', 'subject', 'teacherUser']);
        $slot->setAttribute('day', (int) $slot->day_of_week);

        return response()->json([
            'success' => true,
            'data' => $slot,
            'message' => 'Orari u përditësua me sukses.'
        ]);
    }

    /**
     * Fshij një slot nga orari (Kliro qelizën)
     */
    public function deleteTimetableSlot($id): JsonResponse
    {
        $academicYearId = AcademicYear::where('is_active', true)->value('id');
        $slot = TimetableSlot::where('academic_year_id', $academicYearId)->findOrFail($id);
        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Orari u fshi nga kjo qelizë.'
        ]);
    }


    public function academicYears(): JsonResponse
    {
        $years = AcademicYear::withCount(['classes', 'feeStructures'])->get();

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    public function academicYear(int $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $year->load(['classes', 'feeStructures']);

        return response()->json([
            'success' => true,
            'data' => $year,
        ]);
    }

    public function storeAcademicYear(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255|unique:academic_years,label',
        ]);

        $hasActiveYear = AcademicYear::where('is_active', true)->exists();

        $year = AcademicYear::create([
            'label' => $validated['label'],
            'is_active' => !$hasActiveYear,
        ]);

        // Nëse ka një vit aktiv, promovo automatikisht
        if ($hasActiveYear) {
            $promoteRequest = new \Illuminate\Http\Request();
            $promoteResponse = $this->promoteAcademicYear($promoteRequest, $year->id);

            if (!$promoteResponse->getData()->success) {
                // Nëse promovimi dështon, fshij vitin e krijuar
                $year->delete();

                return response()->json([
                    'success' => false,
                    'message' => $promoteResponse->getData()->message ?? 'Promovimi dështoi.',
                ], 500);
            }
        }

        $year->loadCount(['classes', 'feeStructures']);

        return response()->json([
            'success' => true,
            'data' => $year,
            'message' => $hasActiveYear
                ? "Viti {$year->label} u krijua dhe u promovua automatikisht."
                : "Viti {$year->label} u krijua.",
        ], 201);
    }

    public function activateAcademicYear(int $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);

        DB::transaction(function () use ($year) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
            $year->update(['is_active' => true]);
        });

        $year->loadCount(['classes', 'feeStructures']);

        return response()->json([
            'success' => true,
            'data' => $year,
            'message' => "Viti {$year->label} u aktivizua.",
        ]);
    }

    /**
     * Përditëso etiketën e një viti akademik.
     */
    public function updateAcademicYear(Request $request, int $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);

        $validated = $request->validate([
            'label' => 'required|string|max:255|unique:academic_years,label,' . $id,
        ]);

        $year->update(['label' => $validated['label']]);
        $year->loadCount(['classes', 'feeStructures']);

        return response()->json([
            'success' => true,
            'data' => $year,
            'message' => "Viti {$year->label} u përditësua me sukses.",
        ]);
    }

    public function previewPromotion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'previous_academic_year_id' => 'nullable|exists:academic_years,id',
            'new_grade10_classes' => 'nullable|integer|min:0|max:50',
        ]);
        $previousYear = $this->resolvePreviousYear($validated['previous_academic_year_id'] ?? null);
        abort_if(!$previousYear, 422, 'Nuk ka vit paraprak të disponueshëm.');
        $oldClasses = ClassModel::where('academic_year_id', $previousYear->id)
            ->withCount(['students' => fn($query) => $query->where('status', 'Active')])
            ->orderBy('name')->get(['id', 'name', 'section']);
        $grade10Count = $validated['new_grade10_classes'] ?? $oldClasses->filter(fn($class) => $this->classGrade($class) === 10)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'previous_year' => $previousYear,
                'promotions' => $oldClasses->map(function ($class) {
                    $grade = $this->classGrade($class);
                    return ['from' => $class->name, 'to' => $grade === 12 ? 'Diplomohen' : ($grade > 0 && $grade < 12 ? $this->promotedClassName($class) : null), 'students_count' => $class->students_count];
                })->filter(fn($item) => $item['to'] !== null)->values(),
                'new_grade10_classes' => collect($grade10Count > 0 ? range(1, $grade10Count) : [])->map(fn($number) => ['name' => '10/' . $number, 'students_count' => 0]),
            ]
        ]);
    }

    public function initializeAcademicYear(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255|unique:academic_years,label',
            'previous_academic_year_id' => 'nullable|exists:academic_years,id',
            'new_grade10_classes' => 'nullable|integer|min:0|max:50',
            'copy_homeroom_teachers' => 'boolean',
        ]);
        $previousYear = $this->resolvePreviousYear($validated['previous_academic_year_id'] ?? null);
        $grade10Count = $validated['new_grade10_classes'] ?? null;
        $copyHomeroomTeachers = (bool) ($validated['copy_homeroom_teachers'] ?? false);

        try {
            $newYear = DB::transaction(function () use ($validated, $previousYear, $grade10Count, $copyHomeroomTeachers) {
                $newYear = AcademicYear::create(['label' => $validated['label'], 'is_active' => false]);
                if ($previousYear) {
                    $this->initializeFromPreviousYear($previousYear, $newYear, $grade10Count, $copyHomeroomTeachers);
                }
                $newYear->forceFill(['promoted_at' => $previousYear ? now() : null])->save();
                return $newYear;
            });
            $newYear->loadCount(['classes', 'feeStructures']);
            return response()->json(['success' => true, 'data' => $newYear, 'message' => $previousYear ? 'Viti i ri u krijua dhe klasat u promovuan me sukses.' : 'Viti i ri u krijua me sukses.'], 201);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Krijimi i vitit dështoi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Promovo nxënësit dhe klasat për vitin e ri akademik.
     *
     * - Klasat 10/X bëhen 11/X (nxënësit + kujdestari)
     * - Klasat 11/X bëhen 12/X (nxënësit + kujdestari)
     * - Nxënësit e klasës 12/X marrin status 'Graduated'
     * - Hapen klasat e reja 10/X me kujdestarët e ish-klaseve 12/X
     */
    public function promoteAcademicYear(Request $request, int $newAcademicYearId): JsonResponse
    {
        $newYear = AcademicYear::findOrFail($newAcademicYearId);
        if ($newYear->promoted_at || ClassModel::where('academic_year_id', $newYear->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Ky vit akademik është inicializuar tashmë.'], 400);
        }
        $previousYear = $this->resolvePreviousYear(null);
        abort_if(!$previousYear || $previousYear->id === $newYear->id, 400, 'Nuk ka vit paraprak të vlefshëm.');

        try {
            DB::transaction(function () use ($previousYear, $newYear) {
                $this->initializeFromPreviousYear($previousYear, $newYear, null, true);
                $newYear->forceFill(['promoted_at' => now()])->save();
            });
            return response()->json(['success' => true, 'data' => $newYear->fresh(), 'message' => 'Viti i ri u promovua me sukses.']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Promovimi dështoi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Krijon një klasë të promovuar në vitin e ri.
     * Përdor firstOrCreate për të parandaluar duplikatet.
     */
    private function resolvePreviousYear(?int $academicYearId): ?AcademicYear
    {
        return $academicYearId
            ? AcademicYear::find($academicYearId)
            : AcademicYear::where('is_active', true)->first();
    }

    private function classGrade(ClassModel $class): int
    {
        return (int) preg_replace('/[^0-9].*$/', '', (string) $class->name);
    }

    private function classParallel(ClassModel $class): string
    {
        $parts = explode('/', (string) $class->name, 2);
        return $parts[1] ?? ($class->section ?: '');
    }

    private function promotedClassName(ClassModel $class): string
    {
        return ($this->classGrade($class) + 1) . '/' . $this->classParallel($class);
    }

    private function initializeFromPreviousYear(
        AcademicYear $previousYear,
        AcademicYear $newYear,
        ?int $requestedGrade10Count,
        bool $copyHomeroomTeachers
    ): void {
        $oldClasses = ClassModel::where('academic_year_id', $previousYear->id)
            ->with(['students' => fn($query) => $query->where('status', 'Active')->select('students.id', 'students.class_id', 'students.status')])
            ->orderBy('name')
            ->get(['id', 'name', 'section', 'homeroom_staff_id']);

        $grade10Classes = $oldClasses->filter(fn($class) => $this->classGrade($class) === 10);
        $grade12Classes = $oldClasses->filter(fn($class) => $this->classGrade($class) === 12)->keyBy(fn($class) => $this->classParallel($class));
        $grade10Count = $requestedGrade10Count ?? $grade10Classes->count();

        foreach ($oldClasses as $oldClass) {
            $grade = $this->classGrade($oldClass);
            foreach ($oldClass->students as $student) {
                StudentAcademicEnrollment::updateOrCreate(
                    ['student_id' => $student->id, 'academic_year_id' => $previousYear->id],
                    ['class_id' => $oldClass->id, 'status' => 'active']
                );
            }

            if ($grade === 10 || $grade === 11) {
                $newClass = $this->createPromotedClass(
                    $newYear->id,
                    $this->promotedClassName($oldClass),
                    $this->classParallel($oldClass),
                    $copyHomeroomTeachers ? $oldClass->homeroom_staff_id : null
                );
                foreach ($oldClass->students as $student) {
                    StudentAcademicEnrollment::updateOrCreate(
                        ['student_id' => $student->id, 'academic_year_id' => $newYear->id],
                        ['class_id' => $newClass->id, 'status' => 'active']
                    );
                    $student->update(['class_id' => $newClass->id]);
                }
            } elseif ($grade === 12) {
                foreach ($oldClass->students as $student) {
                    StudentAcademicEnrollment::updateOrCreate(
                        ['student_id' => $student->id, 'academic_year_id' => $previousYear->id],
                        ['class_id' => $oldClass->id, 'status' => 'graduated']
                    );
                    $student->update(['class_id' => null, 'status' => 'Graduated']);
                }
            }
        }

        for ($parallel = 1; $parallel <= $grade10Count; $parallel++) {
            $oldGrade12 = $grade12Classes->get((string) $parallel);
            $this->createPromotedClass(
                $newYear->id,
                '10/' . $parallel,
                (string) $parallel,
                $copyHomeroomTeachers ? $oldGrade12?->homeroom_staff_id : null
            );
        }
    }

    private function createPromotedClass(int $academicYearId, string $name, string $section, ?int $homeroomStaffId): ClassModel
    {
        return ClassModel::firstOrCreate(
            [
                'academic_year_id' => $academicYearId,
                'name' => $name,
            ],
            [
                'section' => $section,
                'homeroom_staff_id' => $homeroomStaffId,
            ]
        );
    }

    /**
     * Lëviz nxënësit në një klasë të re.
     * Përdor chunked për performancë më të mirë me shumë nxënës.
     */
    private function moveStudentsToClass($students, int $newClassId): void
    {
        if ($students->isEmpty()) {
            return;
        }

        // Përdor chunked updates për të shmangur queries të mëdha me mijëra nxënës
        $studentIds = $students->pluck('id');
        $studentIds->chunk(100)->each(function ($chunk) use ($newClassId) {
            Student::whereIn('id', $chunk)
                ->update(['class_id' => $newClassId]);
        });

    }
}