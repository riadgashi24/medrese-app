<?php

namespace App\Http\Controllers;

use App\Models\ActivityEnrollment;
use App\Models\ExtracurricularActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExtracurricularController extends Controller
{
    public function index(): JsonResponse
    {
        $activities = ExtracurricularActivity::all();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    public function myEnrollments(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No student profile found.', 'code' => 'NOT_FOUND'],
            ], 404);
        }

        $enrollments = ActivityEnrollment::with('activity')
            ->where('student_id', $student->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $enrollments,
        ]);
    }
}
