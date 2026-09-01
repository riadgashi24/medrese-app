<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Support\Str;

/**
 * Service class for financial operations.
 * Implements payment, invoice, and fee calculation logic.
 *
 * Depends on:
 * - AcademicYear
 * - FeeStructure
 * - Invoice
 * - Payment
 * - Student
 */
class FeeService
{
    /**
     * Get dashboard overview statistics
     *
     * @return array
     */
    public function getOverview(): array
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $totalRevenue = Payment::where('status', 'Completed')->sum('amount');
        $totalPending = Payment::where('status', 'Pending')->sum('amount');
        $outstandingCount = 0;
        $activeStudents = collect();
        $feeStructures = collect();

        if ($academicYear) {
            $activeStudents = Student::query()
                ->select(['id', 'class_id', 'type'])
                ->where('status', 'Active')
                ->get();
            $feeStructures = FeeStructure::query()
                ->select(['fee_type_id', 'class_id', 'applies_to_type', 'amount'])
                ->where('academic_year_id', $academicYear->id)
                ->get();

            $paidByStudent = Payment::query()
                ->selectRaw('student_id, SUM(amount) as total_paid')
                ->where('status', 'Completed')
                ->whereIn('student_id', $activeStudents->pluck('id'))
                ->groupBy('student_id')
                ->pluck('total_paid', 'student_id');

            $outstandingCount = $activeStudents->filter(function ($student) use ($feeStructures, $paidByStudent) {
                $totalFees = $feeStructures
                    ->filter(
                        fn($structure) =>
                        ($structure->class_id === null || $structure->class_id === $student->class_id) &&
                        ($structure->applies_to_type === 'All' || $structure->applies_to_type === $student->type)
                    )
                    ->sum('amount');

                return $totalFees - (float) ($paidByStudent[$student->id] ?? 0) > 0;
            })->count();
        }

        $revenueByCategory = [];
        if ($academicYear) {
            $collectedByType = Payment::query()
                ->selectRaw('fee_type_id, SUM(amount) as collected')
                ->where('status', 'Completed')
                ->groupBy('fee_type_id')
                ->pluck('collected', 'fee_type_id');

            foreach ($feeStructures->load('feeType')->unique('fee_type_id') as $structure) {
                $revenueByCategory[] = [
                    'category' => $structure->feeType->name,
                    'collected' => (float) ($collectedByType[$structure->fee_type_id] ?? 0),
                ];
            }
        }

        return [
            'totalRevenue' => (float) $totalRevenue,
            'totalPending' => (float) $totalPending,
            'outstandingCount' => $outstandingCount,
            'revenueByCategory' => $revenueByCategory,
        ];
    }

    /**
     * Get paginated list of payments with optional filters
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getPayments(array $filters = [], int $perPage = 15)
    {
        $query = Payment::with(['student', 'feeType', 'createdBy']);

        if (!empty($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['from'])) {
            $query->where('paid_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $query->where('paid_at', '<=', $filters['to']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new payment
     *
     * @param array $data
     * @return Payment
     */
    public function createPayment(array $data): Payment
    {
        if (empty($data['paid_at']) && $data['status'] === 'Completed') {
            $data['paid_at'] = now()->toDateString();
        }

        $data['created_by_user_id'] = $data['created_by_user_id'] ?? null;

        $payment = Payment::create($data);
        $payment->load(['student', 'feeType']);

        return $payment;
    }

    /**
     * Get outstanding student balances
     *
     * @param array $filters
     * @return array
     */
    public function getOutstandingStudents(array $filters = []): array
    {
        $academicYear = $this->getActiveAcademicYear();
        if (!$academicYear) {
            return [];
        }

        $query = Student::query()
            ->select(['id', 'student_id', 'first_name', 'last_name', 'class_id', 'type'])
            ->with(['class:id,name'])
            ->where('status', 'Active');

        if (!empty($filters['class_id'])) {
            $query->where('class_id', $filters['class_id']);
        }

        $students = $query->get();
        $feeStructures = FeeStructure::query()
            ->select(['class_id', 'applies_to_type', 'amount'])
            ->where('academic_year_id', $academicYear->id)
            ->get();
        $paidByStudent = Payment::query()
            ->selectRaw('student_id, SUM(amount) as total_paid')
            ->where('status', 'Completed')
            ->whereIn('student_id', $students->pluck('id'))
            ->groupBy('student_id')
            ->pluck('total_paid', 'student_id');

        $students = $students
            ->filter(function ($student) use ($feeStructures, $paidByStudent) {
                $totalFees = $feeStructures
                    ->filter(
                        fn($structure) =>
                        ($structure->class_id === null || $structure->class_id === $student->class_id) &&
                        ($structure->applies_to_type === 'All' || $structure->applies_to_type === $student->type)
                    )
                    ->sum('amount');

                return $totalFees - (float) ($paidByStudent[$student->id] ?? 0) > 0;
            })
            ->map(fn($s) => [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'name' => $s->full_name,
                'class_name' => $s->class?->name,
                'type' => $s->type,
                'balance' => max(0, $feeStructures
                    ->filter(
                        fn($structure) =>
                        ($structure->class_id === null || $structure->class_id === $s->class_id) &&
                        ($structure->applies_to_type === 'All' || $structure->applies_to_type === $s->type)
                    )
                    ->sum('amount') - (float) ($paidByStudent[$s->id] ?? 0)),
            ])
            ->values()
            ->all();

        return $students;
    }

    /**
     * Get paginated fee structures
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getFeeStructures(array $filters = [], int $perPage = 50)
    {
        $query = FeeStructure::with(['feeType', 'class', 'academicYear']);

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new fee structure
     *
     * @param array $data
     * @return FeeStructure
     */
    public function createFeeStructure(array $data): FeeStructure
    {
        $structure = FeeStructure::create($data);
        $structure->load(['feeType', 'class', 'academicYear']);

        return $structure;
    }

    /**
     * Update an existing fee structure
     *
     * @param int $id
     * @param array $data
     * @return FeeStructure
     */
    public function updateFeeStructure(int $id, array $data): FeeStructure
    {
        $structure = FeeStructure::findOrFail($id);
        $structure->update($data);
        $structure->load(['feeType', 'class', 'academicYear']);

        return $structure;
    }

    /**
     * Get paginated invoices
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getInvoices(array $filters = [], int $perPage = 15)
    {
        $query = Invoice::with(['student', 'createdBy']);

        if (!empty($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Generate a new invoice
     *
     * @param array $data
     * @return Invoice
     */
    public function generateInvoice(array $data): Invoice
    {
        $invoice = Invoice::create([
            'invoice_no' => 'INV-' . strtoupper(Str::random(8)),
            'student_id' => $data['student_id'],
            'total_amount' => $data['total_amount'],
            'period_start' => $data['period_start'] ?? null,
            'period_end' => $data['period_end'] ?? null,
            'status' => 'Issued',
            'issued_at' => now()->toDateString(),
            'created_by_user_id' => $data['created_by_user_id'] ?? null,
        ]);

        return $invoice;
    }

    /**
     * Get revenue reports
     *
     * @return array
     */
    public function getReports(): array
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $monthly = Payment::where('status', 'Completed')
            ->selectRaw("strftime('%Y-%m', paid_at) as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        return [
            'monthly_revenue' => $monthly,
            'academic_year' => $academicYear?->label,
        ];
    }
}