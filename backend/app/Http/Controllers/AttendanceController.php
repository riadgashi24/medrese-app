<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\StudyHour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function store(RecordAttendanceRequest $request): JsonResponse
    {
        $records = [];
        foreach ($request->records as $record) {
            $records[] = AttendanceRecord::create([
                'class_id' => $request->class_id,
                'date' => $request->date,
                'kind' => $request->get('kind', 'Regular'),
                'student_id' => $record['student_id'],
                'status' => $record['status'],
                'recorded_by_user_id' => $request->user()->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $records,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with(['student', 'class', 'recordedBy']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('from')) {
            $query->where('date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('date', '<=', $request->to);
        }

        if ($request->filled('kind')) {
            $query->where('kind', $request->kind);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $records = $query->latest('date')->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function storeFajr(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:Present,Absent,Excused'],
        ]);

        $records = [];
        foreach ($request->records as $record) {
            $records[] = AttendanceRecord::create([
                'class_id' => $request->class_id,
                'date' => $request->date,
                'kind' => 'Fajr',
                'student_id' => $record['student_id'],
                'status' => $record['status'],
                'recorded_by_user_id' => $request->user()->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $records,
        ], 201);
    }

    public function storeStudyHours(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'date' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0'],
        ]);

        $studyHour = StudyHour::create([
            'student_id' => $request->student_id,
            'date' => $request->date,
            'hours' => $request->hours,
            'recorded_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $studyHour,
        ], 201);
    }

    public function reports(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with(['student', 'class']);

        if ($request->scope === 'my') {
            $user = $request->user();
            $student = $user->student;
            if ($student) {
                $query->where('student_id', $student->id);
            }
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('from')) {
            $query->where('date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->where('date', '<=', $request->to);
        }

        if ($request->filled('kind')) {
            $query->where('kind', $request->kind);
        }

        $records = $query->latest('date')->paginate($request->get('per_page', 50));

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
}
