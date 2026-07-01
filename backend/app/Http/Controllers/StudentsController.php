<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['class', 'user']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $students = $query->paginate($request->get('per_page', 15));

        $students->getCollection()->transform(function ($student) {
            return $student;
        });

        return response()->json([
            'success' => true,
            'data' => $students->items(),
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
        ]);
    }

    public function store(CreateStudentRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Validate business rule: if municipality is outside Prishtinë, student must be Boarding
        if (!empty($data['municipality']) && mb_strtolower(trim($data['municipality'])) !== mb_strtolower('Prishtinë') && ($data['type'] ?? '') !== 'Boarding') {
            return response()->json([
                'success' => false,
                'message' => 'Nxënësi duhet të jetë konviktor nëse komuna nuk është Prishtinë.',
            ], 422);
        }

        // Create student
        $student = Student::create($data);

        // Automatically create a User for the student if not provided
        if (!$student->user_id) {
            $email = $data['parent_email'] ?? null;

            if (!$email) {
                // fallback email using student id
                $email = strtolower(str_replace(' ', '.', $student->student_id)) . '@medrese.local';
            }

            $user = \App\Models\User::create([
                'name' => trim($student->first_name . ' ' . $student->last_name),
                'email' => $email,
                'role' => 'student',
                'password' => config('medrese.default_student_password', 'medrese2026'),
            ]);

            $student->user_id = $user->id;
            $student->save();
        }

        $student->load(['class', 'user']);

        return response()->json([
            'success' => true,
            'data' => $student,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $student = Student::with(['class', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $student,
        ]);
    }

    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->update($request->validated());
        $student->load(['class', 'user']);

        return response()->json([
            'success' => true,
            'data' => $student,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Student deleted successfully.'],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        // Minimal CSV import implementation
        $file = $request->file('file');
        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($rows);
        $imported = 0;

        foreach ($rows as $row) {
            if (count($row) < 4)
                continue;
            $data = array_combine($header, $row);
            Student::create([
                'student_id' => $data['student_id'] ?? null,
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'class_id' => $data['class_id'] ?? 1,
                'type' => $data['type'] ?? 'Regular',
                'status' => $data['status'] ?? 'Active',
            ]);
            $imported++;
        }

        return response()->json([
            'success' => true,
            'data' => ['imported' => $imported],
        ]);
    }

    public function payInfo(int $studentId): JsonResponse
    {
        $student = Student::with(['class'])->findOrFail($studentId);

        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $feeStructures = [];

        if ($academicYear) {
            $feeStructures = \App\Models\FeeStructure::with('feeType')
                ->where('academic_year_id', $academicYear->id)
                ->where(function ($query) use ($student) {
                    $query->whereNull('class_id')
                        ->orWhere('class_id', $student->class_id);
                })
                ->where(function ($query) use ($student) {
                    $query->where('applies_to_type', 'All')
                        ->orWhere('applies_to_type', $student->type);
                })
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $student,
                'fee_structures' => $feeStructures,
                'balance' => $student->balance,
            ],
        ]);
    }

    public function resetPassword(int $id): JsonResponse
    {
        $student = Student::with('user')->findOrFail($id);

        if (!$student->user) {
            return response()->json([
                'success' => false,
                'message' => 'No user attached to student.',
            ], 404);
        }

        $user = $student->user;
        $user->password = Hash::make(config('medrese.default_student_password', 'medrese2026'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password reset to default.',
        ]);
    }
}
