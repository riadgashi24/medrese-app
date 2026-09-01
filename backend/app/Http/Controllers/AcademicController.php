<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\DaySupervisor;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\Student;
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
        ]);

        $subject = \App\Models\Subject::create($validated);

        return response()->json([
            'success' => true,
            'data' => $subject,
        ]);
    }

    // 3. Ndrysho një lëndë (Vetëm Drejtori dhe Sekretari)
    public function updateSubject(\Illuminate\Http\Request $request, $id): \Illuminate\Http\JsonResponse
    {
        if (!in_array(auth()->user()->role, ['director', 'secretary'])) {
            return response()->json(['success' => false, 'message' => 'Pa autorizim'], 403);
        }

        $subject = \App\Models\Subject::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'level' => 'required|integer|in:10,11,12',
        ]);

        $subject->update($validated);

        return response()->json([
            'success' => true,
            'data' => $subject,
        ]);
    }

    // 4. Fshij një lëndë (Vetëm Drejtori dhe Sekretari)
    public function destroySubject($id): \Illuminate\Http\JsonResponse
    {
        if (!in_array(auth()->user()->role, ['director', 'secretary'])) {
            return response()->json(['success' => false, 'message' => 'Pa autorizim'], 403);
        }

        $subject = \App\Models\Subject::findOrFail($id);
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lënda u fshi me sukses.',
        ]);
    }

    // 5. Detajet specifike të një lënde (Klasat ku ligjërohet, Profesorët dhe orët javore)
    public function showSubjectDetails($id): \Illuminate\Http\JsonResponse
    {
        // Ngarkojmë lëndën duke marrë klasat (ClassModel) përmes lidhjes së saj
        $subject = \App\Models\Subject::with(['classes'])->findOrFail($id);

        // Formatojmë klasat me të dhënat ekzistuese nga tabela pivot
        $classes = $subject->classes->map(function ($class) {
            // Gjejmë profesorin nga tabela users përmes id-së në pivot
            $teacher = \App\Models\User::find($class->pivot->teacher_user_id);

            // Numërojmë studentët e kësaj klase duke përdorur lidhjen tënde: $class->students()
            $studentsCount = $class->students()->count();

            return [
                'class_id' => $class->id,
                'class_name' => $class->name . ($class->section ? ' - ' . $class->section : ''),
                'weekly_hours' => $class->pivot->weekly_hours,
                'teacher_name' => $teacher ? $teacher->name : 'I pacaktuar',
                'students_count' => $studentsCount,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'subject' => $subject,
                'classes' => $classes,
            ]
        ]);
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

        // 3. Kujdestarët e Ditës
        $supervisors = DaySupervisor::where('academic_year_id', $academicYearId)
            ->pluck('supervisor_names', 'day');

        // 4. Statistikat e Profesorëve (All-in-one me Laravel Collection)
        $teacherAssignments = DB::table('class_subject')
            ->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')
            ->join('classes', 'class_subject.class_model_id', '=', 'classes.id')
            ->whereNotNull('class_subject.teacher_user_id')
            ->select(
                'class_subject.teacher_user_id',
                'class_subject.subject_id',
                'subjects.name as subject_name',
                'class_subject.class_model_id as class_id',
                'classes.name as class_name',
                'class_subject.weekly_hours'
            )
            ->get();

        // Grupimi për çdo profesor
        $teacherStats = $teacherAssignments
            ->groupBy('teacher_user_id')
            ->map(fn($assignments) => [
                'total_weekly_hours' => $assignments->sum(fn($a) => (int) $a->weekly_hours),
                'assignments' => $assignments->map(fn($a) => [
                    'subject_id' => $a->subject_id,
                    'subject_name' => $a->subject_name,
                    'class_id' => $a->class_id,
                    'class_name' => $a->class_name,
                ])->values()
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $slots,
                'supervisors' => $supervisors,
                'teacher_stats' => $teacherStats,
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
            'day' => 'required|string',
            'slot_number' => 'required|integer|min:1|max:7',
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        // Përdorim updateOrCreate për të zëvendësuar ose krijuar slot-in e këtij profesori në këtë ditë/orë
        $slot = TimetableSlot::updateOrCreate(
            [
                'day' => $validated['day'],
                'slot_number' => $validated['slot_number'],
                'teacher_user_id' => $validated['teacher_user_id'],
                'academic_year_id' => $validated['academic_year_id'],
            ],
            [
                'class_id' => $validated['class_id'],
                'subject_id' => $validated['subject_id'],
            ]
        );

        $slot->load(['class', 'subject', 'teacher_user']);

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
        $slot = TimetableSlot::findOrFail($id);
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
        $activeYear = AcademicYear::where('is_active', true)->first();

        if (!$activeYear) {
            return response()->json([
                'success' => false,
                'message' => 'Nuk ka asnjë vit aktiv për të kryer promovimin.',
            ], 400);
        }

        if ($activeYear->id === $newYear->id) {
            return response()->json([
                'success' => false,
                'message' => 'Viti i ri nuk mund të jetë i njëjtë me vitin aktiv.',
            ], 400);
        }

        if ($newYear->promoted_at) {
            return response()->json([
                'success' => false,
                'message' => 'Ky vit akademik është promovuar tashmë. Promovimi mund të bëhet vetëm një herë.',
            ], 400);
        }

        // Parandalon promovimin e dyfishtë nëse viti ka tashmë klasa
        if (ClassModel::where('academic_year_id', $newAcademicYearId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ky vit akademik tashmë ka klasa. Promovimi mund të bëhet vetëm një herë.',
            ], 400);
        }

        try {
            DB::transaction(function () use ($activeYear, $newYear) {
                // 1. Merr të gjitha klasat nga viti aktiv (vetëm fushat e nevojshme)
                $oldClasses = ClassModel::where('academic_year_id', $activeYear->id)
                    ->select('id', 'name', 'homeroom_staff_id')
                    ->with('students:id,class_id')
                    ->get();

                $twelfthGradeTeachers = [];

                foreach ($oldClasses as $oldClass) {
                    // Shkëput emrin: p.sh. "10/1" → ['10', '1']
                    $parts = explode('/', $oldClass->name);
                    $grade = (int) ($parts[0] ?? 0);
                    $parallel = $parts[1] ?? '';

                    if ($grade === 10) {
                        // Klasa 10/X → 11/X
                        $newName = '11/' . $parallel;
                        $newClass = $this->createPromotedClass($newYear->id, $newName, $parallel, $oldClass->homeroom_staff_id);
                        $this->moveStudentsToClass($oldClass->students, $newClass->id);

                    } elseif ($grade === 11) {
                        // Klasa 11/X → 12/X
                        $newName = '12/' . $parallel;
                        $newClass = $this->createPromotedClass($newYear->id, $newName, $parallel, $oldClass->homeroom_staff_id);
                        $this->moveStudentsToClass($oldClass->students, $newClass->id);

                    } elseif ($grade === 12) {
                        // Nxënësit e klasës 12 marrin status 'Graduated'
                        Student::whereIn('id', $oldClass->students->pluck('id'))
                            ->update(['status' => 'Graduated']);

                        // Ruaj kujdestarët për klasat e reja 10
                        if ($oldClass->homeroom_staff_id) {
                            $twelfthGradeTeachers[] = [
                                'parallel' => $parallel,
                                'homeroom_staff_id' => $oldClass->homeroom_staff_id,
                            ];
                        }
                    }
                }

                // 3. Krijo klasat e reja 10/X me kujdestarët e ish-12
                foreach ($twelfthGradeTeachers as $teacher) {
                    $newName = '10/' . $teacher['parallel'];
                    $this->createPromotedClass($newYear->id, $newName, $teacher['parallel'], $teacher['homeroom_staff_id']);
                }

            });

            $newYear->loadCount(['classes', 'feeStructures']);

            return response()->json([
                'success' => true,
                'data' => $newYear,
                'message' => 'Viti i ri u promovua me sukses! Klasat 10→11, 11→12, 12→të diplomuar, 10-tat e reja u krijuan.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Promovimi dështoi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Krijon një klasë të promovuar në vitin e ri.
     * Përdor firstOrCreate për të parandaluar duplikatet.
     */
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