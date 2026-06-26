<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\FeeStructure;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function feeStructure(): JsonResponse
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        if (! $academicYear) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $structures = FeeStructure::with(['feeType', 'class'])
            ->where('academic_year_id', $academicYear->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => $academicYear,
                'fee_structures' => $structures,
            ],
        ]);
    }
}
