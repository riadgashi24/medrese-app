<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordDisciplineRequest;
use App\Models\DisciplineRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisciplineController extends Controller
{
    public function store(RecordDisciplineRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()->id;

        $record = DisciplineRecord::create($data);
        $record->load(['student', 'category']);

        return response()->json([
            'success' => true,
            'data' => $record,
        ], 201);
    }

    public function history(Request $request): JsonResponse
    {
        $query = DisciplineRecord::with(['student', 'category', 'createdBy']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('from')) {
            $query->where('discipline_date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('discipline_date', '<=', $request->to);
        }

        $records = $query->latest('discipline_date')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function myRecord(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No student profile found.', 'code' => 'NOT_FOUND'],
            ], 404);
        }

        $records = DisciplineRecord::with(['category'])
            ->where('student_id', $student->id)
            ->latest('discipline_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }
}
