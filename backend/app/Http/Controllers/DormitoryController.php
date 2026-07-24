<?php

namespace App\Http\Controllers;

use App\Models\DormAssignment;
use App\Models\DormInspection;
use App\Models\DormInspectionItem;
use App\Models\DormRoom;
use App\Models\RoomWeeklyScore;
use App\Models\Student;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DormitoryController extends Controller
{
    public function rooms(Request $request): JsonResponse
    {
        $query = DormRoom::withCount('assignments');
        
        if ($request->filled('floor')) {
            $query->where('floor', $request->floor);
        }
        
        $rooms = $query->orderBy('floor')->orderBy('code')->get();

        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }

    public function inspections(Request $request): JsonResponse
    {
        $query = DormInspection::with(['dormRoom', 'createdBy', 'items']);

        if ($request->filled('room_id')) {
            $query->where('dorm_room_id', $request->room_id);
        }

        if ($request->filled('from')) {
            $query->where('inspection_date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('inspection_date', '<=', $request->to);
        }

        if ($request->route('id')) {
            $inspection = $query->findOrFail($request->route('id'));
            return response()->json([
                'success' => true,
                'data' => $inspection,
            ]);
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

    public function destroyInspection(int $id): JsonResponse
    {
        $inspection = DormInspection::findOrFail($id);
        $roomId = $inspection->dorm_room_id;
        $inspection->delete();

        $this->recalculateWeeklyScore($roomId, now()->toDateString());

        return response()->json([
            'success' => true,
            'message' => 'Kontrolli u fshi.',
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

        // Get roommates
        $roommates = DormAssignment::with('student.user')
            ->where('dorm_room_id', $assignment->dorm_room_id)
            ->whereNull('assigned_to')
            ->where('student_id', '!=', $student->id)
            ->get()
            ->map(fn($a) => [
                'id' => $a->student->id,
                'name' => $a->student->full_name,
                'photo' => $a->student->photo,
            ]);

        $inspections = DormInspection::where('dorm_room_id', $assignment->dorm_room_id)
            ->latest('inspection_date')
            ->limit(10)
            ->get();

        // Get warnings (negative discipline records for this student)
        $warnings = \App\Models\DisciplineRecord::with('category')
            ->where('student_id', $student->id)
            ->latest('discipline_date')
            ->limit(5)
            ->get();

        // Get latest weekly score
        $weeklyScore = RoomWeeklyScore::where('dorm_room_id', $assignment->dorm_room_id)
            ->latest('year')
            ->latest('week_number')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'room' => $assignment->dormRoom,
                'assignment' => $assignment,
                'roommates' => $roommates,
                'recent_inspections' => $inspections,
                'warnings' => $warnings,
                'weekly_score' => $weeklyScore,
            ],
        ]);
    }

    public function overview(): JsonResponse
    {
        $rooms = DormRoom::withCount('assignments')->orderBy('floor')->orderBy('code')->get();
        $totalCapacity = $rooms->sum('capacity');
        $totalOccupied = $rooms->sum('assignments_count');

        // Group by floor
        $byFloor = $rooms->groupBy('floor')->map(fn($r, $floor) => [
            'floor' => (int) $floor,
            'rooms' => $r->map(fn($room) => [
                'id' => $room->id,
                'code' => $room->code,
                'capacity' => $room->capacity,
                'occupied' => $room->assignments_count,
            ]),
        ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'rooms' => $rooms,
                'by_floor' => $byFloor,
                'total_capacity' => $totalCapacity,
                'total_occupied' => $totalOccupied,
                'occupancy_rate' => $totalCapacity > 0 ? round(($totalOccupied / $totalCapacity) * 100, 2) : 0,
            ],
        ]);
    }

    public function storeInspection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dorm_room_id' => 'required|exists:dorm_rooms,id',
            'inspection_date' => 'required|date',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_key' => 'required|string',
            'items.*.item_label' => 'required|string',
            'items.*.passed' => 'required|boolean',
            'items.*.comment' => 'nullable|string',
        ]);

        $passedCount = count(array_filter($validated['items'], fn($i) => $i['passed']));
        $totalItems = count($validated['items']);
        $score = $totalItems > 0 ? round(($passedCount / $totalItems) * 10, 2) : 0;

        $inspection = null;

        DB::transaction(function () use ($validated, $score, $request, &$inspection) {
            $inspection = DormInspection::create([
                'dorm_room_id' => $validated['dorm_room_id'],
                'inspection_date' => $validated['inspection_date'],
                'score' => $score,
                'note' => $validated['note'] ?? null,
                'created_by_user_id' => $request->user()->id,
            ]);

            foreach ($validated['items'] as $item) {
                DormInspectionItem::create([
                    'inspection_id' => $inspection->id,
                    'item_key' => $item['item_key'],
                    'item_label' => $item['item_label'],
                    'passed' => $item['passed'],
                    'comment' => $item['comment'] ?? null,
                ]);
            }

            $this->recalculateWeeklyScore($validated['dorm_room_id'], $validated['inspection_date']);
        });

        $inspection?->load(['dormRoom', 'items']);

        return response()->json([
            'success' => true,
            'data' => $inspection,
        ], 201);
    }

    public function updateInspection(Request $request, $id): JsonResponse
    {
        $inspection = DormInspection::findOrFail($id);

        $validated = $request->validate([
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_key' => 'required|string',
            'items.*.item_label' => 'required|string',
            'items.*.passed' => 'required|boolean',
            'items.*.comment' => 'nullable|string',
        ]);

        $passedCount = count(array_filter($validated['items'], fn($i) => $i['passed']));
        $totalItems = count($validated['items']);
        $score = $totalItems > 0 ? round(($passedCount / $totalItems) * 10, 2) : 0;

        DB::transaction(function () use ($inspection, $validated, $score) {
            $inspection->update([
                'score' => $score,
                'note' => $validated['note'] ?? $inspection->note,
            ]);

            $inspection->items()->delete();
            foreach ($validated['items'] as $item) {
                DormInspectionItem::create([
                    'inspection_id' => $inspection->id,
                    'item_key' => $item['item_key'],
                    'item_label' => $item['item_label'],
                    'passed' => $item['passed'],
                    'comment' => $item['comment'] ?? null,
                ]);
            }

            $this->recalculateWeeklyScore($inspection->dorm_room_id, $inspection->inspection_date);
        });

        $inspection->load(['dormRoom', 'items']);

        return response()->json([
            'success' => true,
            'data' => $inspection,
        ]);
    }

    public function leaderboard(): JsonResponse
    {
        $currentWeek = now()->weekOfYear;
        $currentYear = now()->year;

        $weekly = RoomWeeklyScore::with('dormRoom')
            ->where('week_number', $currentWeek)
            ->where('year', $currentYear)
            ->orderBy('rank')
            ->orderByDesc('avg_score')
            ->limit(10)
            ->get();

        $monthly = DormInspection::select(
            'dorm_room_id',
            DB::raw('AVG(score) as avg_score'),
            DB::raw('COUNT(*) as inspections_count')
        )
            ->with('dormRoom')
            ->whereMonth('inspection_date', now()->month)
            ->whereYear('inspection_date', now()->year)
            ->groupBy('dorm_room_id')
            ->orderByDesc('avg_score')
            ->limit(10)
            ->get();

        $yearly = DormInspection::select(
            'dorm_room_id',
            DB::raw('AVG(score) as avg_score'),
            DB::raw('COUNT(*) as inspections_count')
        )
            ->with('dormRoom')
            ->whereYear('inspection_date', $currentYear)
            ->groupBy('dorm_room_id')
            ->orderByDesc('avg_score')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'weekly' => $weekly,
                'monthly' => $monthly,
                'yearly' => $yearly,
            ],
        ]);
    }

    public function assignRoom(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'dorm_room_id' => 'required|exists:dorm_rooms,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
        ]);

        $academicYearId = $validated['academic_year_id'] ?? AcademicYear::where('is_active', true)->value('id');

        DormAssignment::where('student_id', $validated['student_id'])
            ->whereNull('assigned_to')
            ->update(['assigned_to' => now()->subDay()->toDateString()]);

        $assignment = DormAssignment::create([
            'student_id' => $validated['student_id'],
            'dorm_room_id' => $validated['dorm_room_id'],
            'assigned_from' => now()->toDateString(),
            'created_by_user_id' => $request->user()->id,
        ]);

        $assignment->load(['student', 'dormRoom']);

        return response()->json([
            'success' => true,
            'data' => $assignment,
        ], 201);
    }

    public function unassignRoom(Request $request, $assignmentId): JsonResponse
    {
        $assignment = DormAssignment::findOrFail($assignmentId);
        $assignment->update(['assigned_to' => now()->toDateString()]);

        return response()->json([
            'success' => true,
            'message' => 'Nxënësi u largua nga dhoma.',
        ]);
    }

    public function archiveYear(): JsonResponse
    {
        $updated = DormAssignment::whereNull('assigned_to')
            ->update(['assigned_to' => now()->toDateString()]);

        return response()->json([
            'success' => true,
            'message' => "U arkivuan {$updated} caktime.",
        ]);
    }

    private function recalculateWeeklyScore(int $dormRoomId, string $date): void
    {
        $inspectionDate = \Carbon\Carbon::parse($date);
        $weekNumber = (int) $inspectionDate->format('W'); // SQLite-compatible week number
        $year = (int) $inspectionDate->year;

        // Calculate avg score from inspections in the same ISO week
        $inspections = DormInspection::where('dorm_room_id', $dormRoomId)
            ->whereYear('inspection_date', $year)
            ->get()
            ->filter(function ($i) use ($weekNumber) {
                return (int) \Carbon\Carbon::parse($i->inspection_date)->format('W') === $weekNumber;
            });

        $avgScore = $inspections->avg('score') ?? 0;

        RoomWeeklyScore::updateOrCreate(
            [
                'dorm_room_id' => $dormRoomId,
                'week_number' => $weekNumber,
                'year' => $year,
            ],
            [
                'avg_score' => round($avgScore, 2),
            ]
        );

        $scores = RoomWeeklyScore::where('week_number', $weekNumber)
            ->where('year', $year)
            ->orderByDesc('avg_score')
            ->get();

        $rank = 1;
        foreach ($scores as $score) {
            $score->update(['rank' => $rank]);
            $rank++;
        }
    }
}
