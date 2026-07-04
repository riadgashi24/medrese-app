<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

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
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('parent_name', 'like', "%{$search}%")
                    ->orWhere('parent_phone', 'like', "%{$search}%")
                    ->orWhere('municipality', 'like', "%{$search}%");
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
        if ($data['municipality'] !== 'Prishtinë') {
            $data['type'] = 'Boarding';
        }
        $data['status'] = 'Active';

        // Create student
        $student = Student::create($data);

        // Automatically create a User for the student if not provided
        if (!$student->user_id) {

            $email = $data['student_email'] ?? null;

            if ($email) {
                $user = User::create([
                    'name' => $student->full_name,
                    'email' => $email,
                    'role' => 'student',
                    'password' => Hash::make(
                        config('medrese.default_student_password', 'medrese2026')
                    ),
                ]);
            }
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

        $data = $request->validated();

        $student->update($data);

        if (
            $student->user &&
            !empty($data['student_email'])
        ) {
            $student->user->update([
                'email' => $data['student_email'],
                'name' => $student->full_name,
            ]);
        }

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
                'municipality' => $data['municipality'] ?? null,
                'address' => $data['address'] ?? null,
                'student_email' => $data['student_email'] ?? null,
                'parent_name' => $data['parent_name'] ?? null,
                'parent_phone' => $data['parent_phone'] ?? null,
                'parent_phone_secondary' => $data['parent_phone_secondary'] ?? null,
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
