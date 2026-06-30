<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index()
    {
        return Staff::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'personal_number' => 'nullable|string|max:20',
            'gender' => 'required|in:Male,Female',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email',
            'position' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:Active,On Leave,Inactive',
            'photo' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $staff = Staff::create($validated);

        return response()->json($staff, 201);
    }

    public function show(Staff $staff)
    {
        return $staff;
    }

    public function update(Request $request, Staff $staff)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'personal_number' => 'nullable|string|max:20',
            'gender' => 'sometimes|required|in:Male,Female',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email',
            'position' => 'sometimes|required|string|max:255',
            'department' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'sometimes|required|in:Active,On Leave,Inactive',
            'photo' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $staff->update($validated);

        return response()->json($staff);
    }

    public function destroy(Staff $staff)
    {
        $staff->delete();

        return response()->json([
            'message' => 'Staff member deleted successfully.'
        ]);
    }
}