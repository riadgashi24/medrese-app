<?php

namespace App\Http\Controllers;

use App\Models\TimetableSlot;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    /**
     * Merr të gjitha slotet e orarit për vitin akademik aktiv.
     */
    public function index(): JsonResponse
    {
        // Gjejmë vitin akademik që është aktiv aktualisht
        $activeYear = AcademicYear::where('is_active', true)->first();

        if (!$activeYear) {
            return response()->json([
                'message' => 'Nuk u gjet asnjë vit akademik aktiv.'
            ], 404);
        }

        // Marrim orarin e atij viti bashkë me klasën, lëndën dhe profesorin
        $timetable = TimetableSlot::with(['class', 'subject', 'teacher_user'])
            ->where('academic_year_id', $activeYear->id)
            ->get();

        return response()->json($timetable);
    }

    /**
     * Ruajtja e një sloti të ri në orar (Opsionale, nëse të duhet më vonë)
     */
    public function store(Request $request): JsonResponse
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $validated = $request->validate([
            'day' => 'required|string',
            'slot_number' => 'required|integer|between:1,7',
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_user_id' => 'required|exists:users,id',
        ]);

        $validated['academic_year_id'] = $activeYear->id;

        $slot = TimetableSlot::create($validated);

        return response()->json([
            'message' => 'Ora u shtua me sukses në orar.',
            'data' => $slot->load(['class', 'subject', 'teacher_user'])
        ], 210);
    }
}