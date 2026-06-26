<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreatePaymentRequest;
use App\Models\AcademicYear;
use App\Models\FeeStructure;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    public function overview(): JsonResponse
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $totalRevenue = Payment::where('status', 'Completed')->sum('amount');
        $totalPending = Payment::where('status', 'Pending')->sum('amount');
        $outstandingCount = Student::where('status', 'Active')
            ->get()
            ->filter(fn ($s) => $s->balance > 0)
            ->count();

        $revenueByCategory = [];
        if ($academicYear) {
            $structures = FeeStructure::with('feeType')
                ->where('academic_year_id', $academicYear->id)
                ->get();

            foreach ($structures as $structure) {
                $collected = Payment::where('fee_type_id', $structure->fee_type_id)
                    ->where('status', 'Completed')
                    ->sum('amount');
                $revenueByCategory[] = [
                    'category' => $structure->feeType->name,
                    'collected' => (float) $collected,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalPending' => (float) $totalPending,
                'outstandingCount' => $outstandingCount,
                'revenueByCategory' => $revenueByCategory,
            ],
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $query = Payment::with(['student', 'feeType', 'createdBy']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from')) {
            $query->where('paid_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('paid_at', '<=', $request->to);
        }

        $payments = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function storePayment(CreatePaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()->id;
        if (empty($data['paid_at']) && $data['status'] === 'Completed') {
            $data['paid_at'] = now()->toDateString();
        }

        $payment = Payment::create($data);
        $payment->load(['student', 'feeType']);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ], 201);
    }

    public function outstanding(Request $request): JsonResponse
    {
        $students = Student::with(['class'])
            ->where('status', 'Active')
            ->get()
            ->filter(fn ($s) => $s->balance > 0)
            ->map(fn ($s) => [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'name' => $s->full_name,
                'class_name' => $s->class?->name,
                'type' => $s->type,
                'balance' => $s->balance,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function feeStructures(Request $request): JsonResponse
    {
        $query = FeeStructure::with(['feeType', 'class', 'academicYear']);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        $structures = $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $structures->items(),
            'meta' => [
                'current_page' => $structures->currentPage(),
                'last_page' => $structures->lastPage(),
                'total' => $structures->total(),
            ],
        ]);
    }

    public function storeFeeStructure(\App\Http\Requests\CreateFeeStructureRequest $request): JsonResponse
    {
        $structure = FeeStructure::create($request->validated());
        $structure->load(['feeType', 'class', 'academicYear']);

        return response()->json([
            'success' => true,
            'data' => $structure,
        ], 201);
    }

    public function updateFeeStructure(Request $request, int $id): JsonResponse
    {
        $structure = FeeStructure::findOrFail($id);
        $structure->update($request->only([
            'fee_type_id', 'class_id', 'applies_to_type', 'amount', 'academic_year_id',
        ]));
        $structure->load(['feeType', 'class', 'academicYear']);

        return response()->json([
            'success' => true,
            'data' => $structure,
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $query = Invoice::with(['student', 'createdBy']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $invoices->items(),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    public function generateInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ]);

        $invoice = Invoice::create([
            'invoice_no' => 'INV-' . strtoupper(Str::random(8)),
            'student_id' => $request->student_id,
            'total_amount' => $request->total_amount,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'status' => 'Issued',
            'issued_at' => now()->toDateString(),
            'created_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ], 201);
    }

    public function reports(): JsonResponse
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $monthly = Payment::where('status', 'Completed')
            ->selectRaw("strftime('%Y-%m', paid_at) as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'monthly_revenue' => $monthly,
                'academic_year' => $academicYear?->label,
            ],
        ]);
    }
}
