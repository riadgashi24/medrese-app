<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\StudentDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Document::with('uploadedBy');

        // Filter by visibility based on user role
        if ($user->role === 'student' || $user->role === 'boarding') {
            $query->whereIn('visibility', ['All', 'Students']);
        }

        $documents = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $documents->items(),
            'meta' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'total' => $documents->total(),
            ],
        ]);
    }

    public function myDocuments(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No student profile found.', 'code' => 'NOT_FOUND'],
            ], 404);
        }

        $studentDocuments = StudentDocument::with(['document'])
            ->where('student_id', $student->id)
            ->latest('issued_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $studentDocuments,
        ]);
    }
}
