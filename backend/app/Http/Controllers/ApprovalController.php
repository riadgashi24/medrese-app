<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index()
    {
        return Approval::with(['requester', 'approver'])
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|max:100',
            'reference_id' => 'nullable|integer',
            'requested_by' => 'required|exists:users,id',
        ]);

        $approval = Approval::create($validated);

        return response()->json($approval, 201);
    }

    public function show(Approval $approval)
    {
        return $approval->load(['requester', 'approver']);
    }

    public function update(Request $request, Approval $approval)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected',
            'comment' => 'nullable|string',
            'approved_by' => 'nullable|exists:users,id',
        ]);

        if ($validated['status'] !== 'Pending') {
            $validated['approved_at'] = now();
        }

        $approval->update($validated);

        return response()->json($approval);
    }

    public function destroy(Approval $approval)
    {
        $approval->delete();

        return response()->json([
            'message' => 'Approval deleted successfully.'
        ]);
    }
}