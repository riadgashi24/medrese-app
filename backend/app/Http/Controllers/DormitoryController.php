<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateInspectionRequest;
use App\Models\DormAssignment;
use App\Models\DormInspection;
use App\Models\DormRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DormitoryController extends Controller
{
    public function rooms(): JsonResponse
    {
        $rooms = DormRoom::withCount('assignments')->get();

        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }

    public function inspections(Request $request): JsonResponse
    {
        $query = DormInspection::with(['dormRoom', 'createdBy']);

        if ($request->filled('room_id')) {
            $query->where('dorm_room_id', $request->room_id);
        }

        if ($request->filled('from')) {
            $query->where('inspection_date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('inspection_date', '<=', $request->to);
        }

        $inspections = $query->latest('inspection_date')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $inspections->items(),
            'meta' => [
                'current_page' => $inspections->currentPage(),
                'last_page' => $inspections->lastPage(),
                'total' => $inspections->total(),
            ],
        ]);
    }

    public function myRoom(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No student profile found.', 'code' => 'NOT_FOUND'],
            ], 404);
        }

        $assignment = DormAssignment::with('dormRoom')
            ->where('student_id', $student->id)
            ->whereNull('assigned_to')
            ->latest()
            ->first();

        if (! $assignment) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        $inspections = DormInspection::where('dorm_room_id', $assignment->dorm_room_id)
            ->latest('inspection_date')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'room' => $assignment->dormRoom,
                'assignment' => $assignment,
                'recent_inspections' => $inspections,
            ],
        ]);
    }

    public function overview(): JsonResponse
    {
        $rooms = DormRoom::withCount('assignments')->get();
        $totalCapacity = $rooms->sum('capacity');
        $totalOccupied = $rooms->sum('assignments_count');

        return response()->json([
            'success' => true,
            'data' => [
                'rooms' => $rooms,
                'total_capacity' => $totalCapacity,
                'total_occupied' => $totalOccupied,
                'occupancy_rate' => $totalCapacity > 0 ? round(($totalOccupied / $totalCapacity) * 100, 2) : 0,
            ],
        ]);
    }

    public function storeInspection(CreateInspectionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()->id;

        $inspection = DormInspection::create($data);
        $inspection->load(['dormRoom']);

        return response()->json([
            'success' => true,
            'data' => $inspection,
        ], 201);
    }
}
