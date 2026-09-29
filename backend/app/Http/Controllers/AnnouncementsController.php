<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateAnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with('author')->latest('published_at');
        if (in_array($request->user()->role, ['student', 'boarding'], true)) {
            $query->whereNotNull('published_at')->where('published_at', '<=', now());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $announcements = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $announcements->items(),
            'meta' => [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'total' => $announcements->total(),
            ],
        ]);
    }

    public function store(CreateAnnouncementRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['author_user_id'] = $request->user()->id;
        if (empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $announcement = Announcement::create($data);
        $announcement->load('author');

        return response()->json([
            'success' => true,
            'data' => $announcement,
        ], 201);
    }
}
