<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Assignment::with(['class', 'subject']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $assignments = $query->latest('due_date')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $assignments->items(),
            'meta' => [
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
                'total' => $assignments->total(),
            ],
        ]);
    }

    public function myAssignments(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No student profile found.', 'code' => 'NOT_FOUND'],
            ], 404);
        }

        $assignments = Assignment::with(['class', 'subject'])
            ->where('class_id', $student->class_id)
            ->latest('due_date')
            ->get();

        $submissions = AssignmentSubmission::query()
            ->where('student_id', $student->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->get()
            ->keyBy('assignment_id');

        $assignments->each(function ($assignment) use ($submissions) {
            $assignment->submission = $submissions->get($assignment->id);
        });

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }
}
