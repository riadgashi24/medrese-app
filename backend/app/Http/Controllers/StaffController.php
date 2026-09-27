<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    private const ROLES = ['director', 'secretary', 'teacher', 'educator', 'cashier', 'other'];

    public function index(Request $request): JsonResponse
    {
        $yearId = AcademicYear::where('is_active', true)->value('id');
        $workload = $yearId
            ? DB::table('class_subject')->join('classes', 'class_subject.class_model_id', '=', 'classes.id')
                ->where('classes.academic_year_id', $yearId)->select('teacher_user_id', DB::raw('SUM(weekly_hours) as total_hours'))
                ->groupBy('teacher_user_id')->pluck('total_hours', 'teacher_user_id')
            : collect();
        $query = Staff::with('user')->latest();
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn($builder) => $builder->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")->orWhere('employee_number', 'like', "%{$search}%"));
        }
        if ($request->filled('role'))
            $query->where('role', $request->string('role'));
        if ($request->filled('status'))
            $query->where('status', $request->string('status'));
        return response()->json(['success' => true, 'data' => $query->get()->map(fn(Staff $staff) => $this->serializeStaff($staff, $workload, $request))]);
    }

    public function show(Staff $staff): JsonResponse
    {
        $yearId = AcademicYear::where('is_active', true)->value('id');
        $staff->load('user');
        $assignments = collect();
        $timetable = collect();
        if ($yearId && $staff->user_id) {
            $assignments = DB::table('class_subject')->join('classes', 'class_subject.class_model_id', '=', 'classes.id')->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')->where('classes.academic_year_id', $yearId)->where('teacher_user_id', $staff->user_id)->select('classes.id as class_id', 'classes.name as class_name', 'subjects.id as subject_id', 'subjects.name as subject_name', 'weekly_hours')->orderBy('classes.name')->get();
            $timetable = DB::table('timetable_slots')->join('classes', 'timetable_slots.class_id', '=', 'classes.id')->join('subjects', 'timetable_slots.subject_id', '=', 'subjects.id')->where('timetable_slots.academic_year_id', $yearId)->where('timetable_slots.teacher_user_id', $staff->user_id)->select('timetable_slots.id', 'day_of_week as day', 'slot_number as lesson_hour', 'classes.name as class_name', 'subjects.name as subject_name')->orderBy('day')->orderBy('lesson_hour')->get();
        }
        $data = $this->serializeStaff($staff, collect(), $request);
        $data['academic_year_id'] = $yearId;
        $data['assignments'] = $assignments;
        $data['timetable'] = $timetable;
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin();
        $validated = $this->validateProfile($request);
        $credentials = $request->validate([
            'account_email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);
        $staff = DB::transaction(function () use ($validated, $request) {
            $staff = Staff::create($validated);
            $accountEmail = $request->input('account_email') ?: $validated['email'];
            $accountEmail = $accountEmail ?: "staff-{$staff->id}@medrese.local";
            $password = $request->input('password') ?: config('medrese.default_staff_password', 'medrese2026');
            $user = User::create([
                'name' => $staff->name,
                'email' => $accountEmail,
                'password' => Hash::make($password),
                'role' => $validated['role'],
            ]);
            $staff->update(['user_id' => $user->id]);
            return $staff->load('user');
        });
        return response()->json(['success' => true, 'data' => $this->serializeStaff($staff->load('user'), collect(), $request)], 201);
    }

    public function update(Request $request, Staff $staff): JsonResponse
    {
        $isAdmin = in_array($request->user()->role, ['director', 'secretary'], true);
        if (!$isAdmin && $staff->user_id !== $request->user()->id)
            abort(403);
        $rules = $isAdmin ? $this->profileRules($staff->id) : ['phone' => 'nullable|string|max:30', 'personal_phone' => 'nullable|string|max:30', 'address' => 'nullable|string|max:255', 'city' => 'nullable|string|max:255', 'education' => 'nullable|string|max:255', 'qualification' => 'nullable|string|max:255', 'specialization' => 'nullable|string|max:255', 'notes' => 'nullable|string'];
        $updates = $request->validate($rules);
        DB::transaction(function () use ($staff, $updates, $isAdmin) {
            $staff->update($updates);
            if ($isAdmin && $staff->user) {
                $staff->user->update([
                    'name' => $staff->name,
                    'role' => $staff->role,
                ]);
            }
        });
        return response()->json(['success' => true, 'data' => $this->serializeStaff($staff->fresh('user'), collect(), $request)]);
    }

    public function destroy(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeAdmin();
        $inUse = DB::table('class_subject')->where('teacher_user_id', $staff->user_id)->exists() || DB::table('timetable_slots')->where('teacher_user_id', $staff->user_id)->exists();
        if ($inUse) {
            $staff->update(['status' => 'Inactive']);
            return response()->json(['success' => true, 'deactivated' => true, 'message' => 'Stafi u çaktivizua sepse ka të dhëna historike.']);
        }
        if ($staff->photo)
            Storage::disk('public')->delete($staff->photo);
        $staff->delete();
        return response()->json(['success' => true, 'message' => 'Stafi u fshi.']);
    }

    public function photo(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeSelfOrAdmin($request, $staff);
        $request->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        if ($staff->photo)
            Storage::disk('public')->delete($staff->photo);
        $staff->update(['photo' => $request->file('photo')->store('staff', 'public')]);
        return response()->json(['success' => true, 'data' => $this->serializeStaff($staff->fresh('user'), collect(), $request)]);
    }

    public function deletePhoto(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeSelfOrAdmin($request, $staff);
        if ($staff->photo)
            Storage::disk('public')->delete($staff->photo);
        $staff->update(['photo' => null]);
        return response()->json(['success' => true]);
    }

    public function import(Request $request): JsonResponse
    {
        $this->authorizeAdmin();
        $rows = $request->input('rows');
        if (!is_array($rows))
            return response()->json(['success' => false, 'message' => 'Rreshtat e importit mungojnë.'], 422);
        $errors = [];
        $seenEmails = [];
        $seenEmployees = [];
        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $validator = Validator::make($row, ['first_name' => 'required|string|max:255', 'last_name' => 'required|string|max:255', 'email' => 'nullable|email', 'role' => ['required', Rule::in(self::ROLES)], 'employee_number' => 'nullable|string|max:255', 'gender' => 'required|in:Male,Female', 'birth_date' => 'nullable|date', 'hire_date' => 'nullable|date', 'status' => 'required|in:Active,On Leave,Inactive', 'position' => 'required|string|max:255']);
            if ($validator->fails())
                $errors[$line] = $validator->errors()->all();
            if (!empty($row['email']) && (in_array($row['email'], $seenEmails, true) || Staff::where('email', $row['email'])->exists()))
                $errors[$line][] = 'Email-i ekziston tashmë.';
            if (!empty($row['employee_number']) && (in_array($row['employee_number'], $seenEmployees, true) || Staff::where('employee_number', $row['employee_number'])->exists()))
                $errors[$line][] = 'Numri i punëtorit ekziston tashmë.';
            if (!empty($row['email']))
                $seenEmails[] = $row['email'];
            if (!empty($row['employee_number']))
                $seenEmployees[] = $row['employee_number'];
        }
        if ($errors)
            return response()->json(['success' => false, 'message' => 'Disa rreshta nuk janë validë.', 'errors' => $errors], 422);
        DB::transaction(fn() => collect($rows)->each(function ($row) {
            $staff = Staff::create($row);
            $this->createLinkedUser($staff, $row['role'], $row['email'] ?? null);
        }));
        return response()->json(['success' => true, 'imported' => count($rows)]);
    }

    private function authorizeAdmin(): void
    {
        abort_unless(in_array(auth()->user()->role, ['director', 'secretary'], true), 403);
    }

    private function authorizeSelfOrAdmin(Request $request, Staff $staff): void
    {
        if (!in_array($request->user()->role, ['director', 'secretary'], true) && $staff->user_id !== $request->user()->id)
            abort(403);
    }

    private function validateProfile(Request $request): array
    {
        return $request->validate($this->profileRules(null));
    }

    private function createLinkedUser(Staff $staff, string $role, ?string $email = null): User
    {
        $accountEmail = $email ?: "staff-{$staff->id}@medrese.local";
        $user = User::create([
            'name' => $staff->name,
            'email' => $accountEmail,
            'password' => Hash::make(config('medrese.default_staff_password', 'medrese2026')),
            'role' => $role,
        ]);
        $staff->update(['user_id' => $user->id]);
        return $user;
    }

    private function profileRules(?int $staffId): array
    {
        return ['role' => ['required', Rule::in(self::ROLES)], 'first_name' => 'required|string|max:255', 'last_name' => 'required|string|max:255', 'personal_number' => 'nullable|string|max:20', 'employee_number' => ['nullable', 'string', 'max:255', Rule::unique('staff', 'employee_number')->ignore($staffId)], 'gender' => 'required|in:Male,Female', 'birth_date' => 'nullable|date', 'place_of_birth' => 'nullable|string|max:255', 'phone' => 'nullable|string|max:30', 'personal_phone' => 'nullable|string|max:30', 'email' => ['nullable', 'email', Rule::unique('staff', 'email')->ignore($staffId)], 'position' => 'required|string|max:255', 'department' => 'nullable|string|max:255', 'education' => 'nullable|string|max:255', 'qualification' => 'nullable|string|max:255', 'specialization' => 'nullable|string|max:255', 'hire_date' => 'nullable|date', 'status' => 'required|in:Active,On Leave,Inactive', 'address' => 'nullable|string|max:255', 'city' => 'nullable|string|max:255', 'notes' => 'nullable|string'];
    }

    private function serializeStaff(Staff $staff, $workload, Request $request): array
    {
        $role = in_array($staff->user?->role, self::ROLES, true)
            ? $staff->user->role
            : ($staff->role ?: $this->roleFromPosition($staff->position));
        $photoUrl = $staff->photo ? $request->getSchemeAndHttpHost() . '/storage/' . ltrim($staff->photo, '/') : null;
        $total = (int) ($workload[$staff->user_id] ?? 0);
        return array_merge($staff->toArray(), ['name' => $staff->name, 'email' => $staff->email ?: $staff->user?->email, 'role' => $role, 'photo_url' => $photoUrl, 'total_hours' => $role === 'teacher' ? $total : null]);
    }

    private function roleFromPosition(?string $position): string
    {
        $position = mb_strtolower((string) $position);
        return str_contains($position, 'drejtor') ? 'director' : (str_contains($position, 'sekretar') ? 'secretary' : (str_contains($position, 'arkatar') ? 'cashier' : (str_contains($position, 'edukator') ? 'educator' : 'teacher')));
    }
}
