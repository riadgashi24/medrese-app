<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Http\Resources\StudentsResource;
use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentsController extends Controller
{
    /**
     * @var StudentService
     */
    protected $studentService;

    /**
     * Inject services via constructor (dependency injection)
     */
    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /**
     * List students with optional filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'type', 'status', 'class_id', 'per_page']);
        $perPage = $request->get('per_page', 15);

        $paginator = $this->studentService->getStudents($filters, $perPage);

        $resource = new StudentsResource($paginator);

        return $resource->toResponse($request);
    }

    /**
     * Create a new student.
     */
    public function store(CreateStudentRequest $request): JsonResponse
    {
        $student = $this->studentService->createStudent($request->validated());

        return (new StudentResource($student))
            ->toResponse($request)
            ->setStatusCode(201);
    }

    /**
     * Show a single student.
     */
    public function show(int $id): JsonResponse
    {
        $student = Student::with(['class', 'user'])->findOrFail($id);

        return (new StudentResource($student))
            ->toResponse(request());
    }

    /**
     * Update a student.
     */
    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        $student = $this->studentService->updateStudent($id, $request->validated());

        return (new StudentResource($student))
            ->toResponse(request());
    }

    /**
     * Delete a student.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->studentService->deleteStudent($id);

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Student deleted successfully.'],
        ]);
    }

    /**
     * Import students from CSV file.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $file = $request->file('file');
        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_map('trim', array_shift($rows));

        // Normalize rows to associative arrays
        $normalizedRows = array_map(function ($row) use ($header) {
            return array_combine($header, $row);
        }, $rows);

        $imported = $this->studentService->importStudents($normalizedRows);

        return response()->json([
            'success' => true,
            'data' => ['imported' => $imported],
        ]);
    }

    /**
     * Get payment info for a student.
     */
    public function payInfo(int $studentId): JsonResponse
    {
        $paymentInfo = $this->studentService->getPaymentInfo($studentId);

        return response()->json([
            'success' => true,
            'data' => $paymentInfo,
        ]);
    }

    /**
     * Reset student password to default.
     */
    public function resetPassword(int $id): JsonResponse
    {
        $success = $this->studentService->resetPassword($id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'No user attached to student.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password reset to default.',
        ]);
    }
}
