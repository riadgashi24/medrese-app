<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\TimetableSlot;
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
        // Ndryshuam 'teacher' në 'teacher_user' që të përshtatet me Modelin dhe React-in
        $query = TimetableSlot::with(['class', 'subject', 'teacher_user', 'academicYear']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('day')) {
            $query->where('day', $request->day);
        }

        // Nëse vjen 'academic_year_id' nga fronti e filtrojmë sipas tij, 
        // përndryshe, automatikisht shfaqim vetëm orarin e vitit akademik që është aktiv
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        } else {
            $activeYear = AcademicYear::where('is_active', true)->first();
            if ($activeYear) {
                $query->where('academic_year_id', $activeYear->id);
            }
        }

        $slots = $query->get();

        // Kthejmë strukturen e saktë që React priste me success dhe data array
        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function academicYears(): JsonResponse
    {
        $years = AcademicYear::all();

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
}