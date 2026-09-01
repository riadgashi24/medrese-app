<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\FeeStructure;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

/**
 * Service class for student management.
 * Implements all business logic previously inside the StudentsController.
 *
 * Depends on:
 * - AcademicYear
 * - FeeStructure
 * - Student model
 */
class StudentService
{
    /**
     * @var AcademicYear|null
     * - The current active academic year for calculations
     */
    private $academicYear;

    /**
     * @var int
     * - The ID of the current user's class
     * - Defaults to 1 for simplicity in current implementation
     */
    private $classId = 1;

    /**
     * @var array
     * - An array of raw student data from the database
     * - Used for bulk operations to avoid N+1 queries
     */
    public $rawStudents = [];

    /**
     * Instantiate the service
     */
    public function __construct()
    {
        $this->academicYear = AcademicYear::where('is_active', true)
            ->first();
    }

    /**
     * Get the active academic year
     */
    protected function getActiveAcademicYear(): ?AcademicYear
    {
        return $this->academicYear;
    }

    /**
     * Get all students with filters and pagination
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getStudents(array $filters = [], int $perPage = 15)
    {
        $query = Student::with(['class:id,name']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('parent_name', 'like', "%{$search}%")
                    ->orWhere('parent_phone', 'like', "%{$search}%")
                    ->orWhere('municipality', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['class_id'])) {
            $query->where('class_id', $filters['class_id']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new student
     *
     * @param array $data
     * @return Student
     */
    public function createStudent(array $data): Student
    {
        // Auto-determine type based on municipality
        if (isset($data['municipality']) && $data['municipality'] !== 'Prishtinë') {
            $data['type'] = 'Boarding';
        }
        $data['status'] = $data['status'] ?? 'Active';

        // Create student
        $student = Student::create($data);

        // Automatically create a User for the student if email provided and no user attached
        if (!$student->user_id && !empty($data['student_email'])) {
            $user = \App\Models\User::create([
                'name' => $student->full_name,
                'email' => $data['student_email'],
                'role' => 'student',
                'password' => \Illuminate\Support\Facades\Hash::make(
                    config('medrese.default_student_password', 'medrese2026')
                ),
            ]);
            $student->user_id = $user->id;
            $student->save();
        }

        return $student->load(['class', 'user']);
    }

    /**
     * Update an existing student
     *
     * @param int $id
     * @param array $data
     * @return Student
     */
    public function updateStudent(int $id, array $data): Student
    {
        $student = Student::findOrFail($id);

        // Update student
        $student->update($data);

        // Update associated user if email changed
        if ($student->user && !empty($data['student_email'])) {
            $student->user->update([
                'email' => $data['student_email'],
                'name' => $student->full_name,
            ]);
        }

        return $student->load(['class', 'user']);
    }

    /**
     * Delete a student
     *
     * @param int $id
     * @return bool
     */
    public function deleteStudent(int $id): bool
    {
        $student = Student::findOrFail($id);
        return $student->delete();
    }

    /**
     * Import students from CSV data
     *
     * @param array $rows
     * @return int Number of imported students
     */
    public function importStudents(array $rows): int
    {
        $imported = 0;

        foreach ($rows as $row) {
            if (count($row) < 4) {
                continue;
            }

            // Expect associative array with header keys
            if (!is_array($row) || !array_key_exists('first_name', $row)) {
                // Try to combine with header if it's indexed
                if (is_array($row) && isset($this->rawStudents[0])) {
                    $header = $this->rawStudents[0];
                    $row = array_combine($header, $row);
                }
            }

            $student = Student::create([
                'student_id' => $row['student_id'] ?? null,
                'first_name' => $row['first_name'] ?? null,
                'last_name' => $row['last_name'] ?? null,
                'class_id' => $row['class_id'] ?? 1,
                'type' => $row['type'] ?? 'Regular',
                'status' => $row['status'] ?? 'Active',
                'municipality' => $row['municipality'] ?? null,
                'address' => $row['address'] ?? null,
                'student_email' => $row['student_email'] ?? null,
                'parent_name' => $row['parent_name'] ?? null,
                'parent_phone' => $row['parent_phone'] ?? null,
                'parent_phone_secondary' => $row['parent_phone_secondary'] ?? null,
            ]);
            $imported++;
        }

        return $imported;
    }


    /**
     * Get payment info for a student
     *
     * @param int $studentId
     * @return array
     */
    public function getPaymentInfo(int $studentId): array
    {
        $student = Student::with(['class'])->findOrFail($studentId);

        $academicYear = $this->getActiveAcademicYear();
        $feeStructures = [];

        if ($academicYear) {
            $feeStructures = FeeStructure::with('feeType')
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

        return [
            'student' => $student,
            'fee_structures' => $feeStructures,
            'balance' => $student->balance,
        ];
    }

    /**
     * Reset student password to default
     *
     * @param int $id
     * @return bool
     */
    public function resetPassword(int $id): bool
    {
        $student = Student::with('user')->findOrFail($id);

        if (!$student->user) {
            return false;
        }

        $user = $student->user;
        $user->password = \Illuminate\Support\Facades\Hash::make(
            config('medrese.default_student_password', 'medrese2026')
        );
        $user->save();

        return true;
    }
}