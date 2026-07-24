<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreatePaymentRequest;
use App\Http\Resources\FeeStructureResource;
use App\Http\Resources\FeeStructuresResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\PaymentsResource;
use App\Services\FeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    /**
     * @var FeeService
     */
    protected $feeService;

    /**
     * Inject services via constructor (dependency injection)
     */
    public function __construct(FeeService $feeService)
    {
        $this->feeService = $feeService;
    }

    /**
     * Get financial overview dashboard
     */
    public function overview(): JsonResponse
    {
        $overview = $this->feeService->getOverview();

        return response()->json([
            'success' => true,
            'data' => $overview,
        ]);
    }

    /**
     * List payments with filters and pagination
     */
    public function payments(Request $request): JsonResponse
    {
        $filters = $request->only(['student_id', 'status', 'from', 'to']);
        $perPage = $request->get('per_page', 15);

        $paginator = $this->feeService->getPayments($filters, $perPage);

        $resource = new PaymentsResource($paginator);

        return $resource->toResponse($request);
    }

    /**
     * Record a new payment
     */
    public function storePayment(CreatePaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()->id;

        $payment = $this->feeService->createPayment($data);

        return (new PaymentResource($payment))
            ->toResponse($request)
            ->setStatusCode(201);
    }

    /**
     * List students with outstanding balances
     */
    public function outstanding(Request $request): JsonResponse
    {
        $filters = $request->only(['class_id']);
        $students = $this->feeService->getOutstandingStudents($filters);

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    /**
     * List fee structures with pagination
     */
    public function feeStructures(Request $request): JsonResponse
    {
        $filters = $request->only(['academic_year_id']);
        $perPage = $request->get('per_page', 50);

        $paginator = $this->feeService->getFeeStructures($filters, $perPage);

        $resource = new FeeStructuresResource($paginator);

        return $resource->toResponse($request);
    }

    /**
     * Create a new fee structure
     */
    public function storeFeeStructure(CreateFeeStructureRequest $request): JsonResponse
    {
        $structure = $this->feeService->createFeeStructure($request->validated());

        return (new FeeStructureResource($structure))
            ->toResponse($request)
            ->setStatusCode(201);
    }

    /**
     * Update a fee structure
     */
    public function updateFeeStructure(Request $request, int $id): JsonResponse
    {
        $structure = $this->feeService->updateFeeStructure($id, $request->only([
            'fee_type_id', 'class_id', 'applies_to_type', 'amount', 'academic_year_id',
        ]));

        return (new FeeStructureResource($structure))
            ->toResponse($request);
    }

    /**
     * List invoices with filters and pagination
     */
    public function invoices(Request $request): JsonResponse
    {
        $filters = $request->only(['student_id', 'status']);
        $perPage = $request->get('per_page', 15);

        $paginator = $this->feeService->getInvoices($filters, $perPage);

        // Assuming we'll create InvoiceResource later, for now return raw
        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Generate a new invoice
     */
    public function generateInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ]);

        $data = $request->only(['student_id', 'total_amount', 'period_start', 'period_end']);
        $data['created_by_user_id'] = $request->user()->id;

        $invoice = $this->feeService->generateInvoice($data);

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ], 201);
    }

    /**
     * Get financial reports
     */
    public function reports(): JsonResponse
    {
        $reports = $this->feeService->getReports();

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Student's own financial view (read-only)
     */
    public function studentFinance(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'No student profile.'], 404);
        }

        $payments = \App\Models\Payment::with('feeType')
            ->where('student_id', $student->id)
            ->latest('paid_at')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'type' => $p->feeType?->name,
                'method' => $p->method,
                'status' => $p->status,
                'date' => $p->paid_at?->toDateString(),
            ]);

        $invoices = \App\Models\Invoice::where('student_id', $student->id)
            ->latest('issued_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $student->balance,
                'payments' => $payments,
                'invoices' => $invoices,
            ],
        ]);
    }
}
