<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\TimetableSlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicController extends Controller
{
    public function classes(): JsonResponse
    {
        $classes = ClassModel::with('academicYear')->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function subjects(): JsonResponse
    {
        $subjects = Subject::all();

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);
    }

    public function timetable(Request $request): JsonResponse
    {
        $query = TimetableSlot::with(['class', 'subject', 'teacher', 'academicYear']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('day')) {
            $query->where('day', $request->day);
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        $slots = $query->get();

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function academicYears(): JsonResponse
    {
        $years = AcademicYear::all();

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    public function academicYear(int $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $year->load(['classes', 'feeStructures']);

        return response()->json([
            'success' => true,
            'data' => $year,
        ]);
    }
}
