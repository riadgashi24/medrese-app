<?php

namespace App\Http\Controllers;


use App\Http\Controllers\Controller;
use App\Http\Requests\CreateClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Models\ClassModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    /**
     * Display a listing of classes.
     */
    public function index(Request $request): JsonResponse
    {
        $classes = ClassModel::with('academicYear')
            ->orderBy('name')
            ->orderBy('section')
            ->paginate(
                $request->integer('per_page', 15)
            );

        return response()->json([
            'success' => true,
            'data' => $classes->items(),
            'meta' => [
                'current_page' => $classes->currentPage(),
                'last_page' => $classes->lastPage(),
                'per_page' => $classes->perPage(),
                'total' => $classes->total(),
            ],
        ]);
    }

    /**
     * Store a newly created class.
     */
    public function store(CreateClassRequest $request): JsonResponse
    {
        $class = ClassModel::create($request->validated());

        $class->load('academicYear');

        return response()->json([
            'success' => true,
            'data' => $class,
        ], 201);
    }

    /**
     * Display the specified class.
     */
    public function show(ClassModel $class): JsonResponse
    {
        $class->load(['academicYear', 'students']);

        return response()->json([
            'success' => true,
            'data' => $class,
        ]);
    }

    /**
     * Update the specified class.
     */
    public function update(UpdateClassRequest $request, ClassModel $class): JsonResponse
    {
        $class->update($request->validated());

        $class->load('academicYear');

        return response()->json([
            'success' => true,
            'data' => $class,
        ]);
    }

    /**
     * Remove the specified class.
     */
    public function destroy(ClassModel $class): JsonResponse
    {
        if ($class->students()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a class that has students.',
            ], 422);
        }

        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Class deleted successfully.',
        ]);
    }
}