<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->profile($request->user(), $request)]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:Male,Female',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string|max:30',
            'personal_phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'qualification' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($user, $data) {
            $user->update(['name' => $data['name']]);
            unset($data['name']);
            if ($user->staff) {
                $user->staff->update(array_filter($data, static fn($value) => $value !== null));
            } elseif ($user->student) {
                $studentData = array_intersect_key($data, array_flip(['gender', 'birth_date', 'address', 'phone']));
                if (isset($studentData['phone']))
                    $studentData['parent_phone'] = $studentData['phone'];
                unset($studentData['phone']);
                $user->student->update($studentData);
            }
        });

        return response()->json(['success' => true, 'data' => $this->profile($user->fresh(['staff', 'student.class']), $request)]);
    }

    public function updateEmail(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate(['email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)], 'current_password' => 'required|string']);
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Fjalëkalimi aktual nuk është i saktë.'], 422);
        }
        $user->update(['email' => $data['email']]);
        return response()->json(['success' => true, 'data' => $this->profile($user->fresh(['staff', 'student.class']), $request)]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate(['current_password' => 'required|string', 'password' => 'required|string|min:8|confirmed']);
        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Fjalëkalimi aktual nuk është i saktë.'], 422);
        }
        $user->update(['password' => Hash::make($data['password'])]);
        return response()->json(['success' => true, 'message' => 'Fjalëkalimi u ndryshua me sukses.']);
    }

    public function photo(Request $request): JsonResponse
    {
        $request->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        $user = $request->user();
        $profile = $user->staff ?: $user;
        if ($profile->photo)
            Storage::disk('public')->delete($profile->photo);
        $path = $request->file('photo')->store('profiles', 'public');
        $profile->update(['photo' => $path]);
        return response()->json(['success' => true, 'data' => $this->profile($user->fresh(['staff', 'student.class']), $request)]);
    }

    public function deletePhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->staff ?: $user;
        if ($profile->photo)
            Storage::disk('public')->delete($profile->photo);
        $profile->update(['photo' => null]);
        return response()->json(['success' => true, 'data' => $this->profile($user->fresh(['staff', 'student.class']), $request)]);
    }

    private function profile(User $user, Request $request): array
    {
        $user->loadMissing(['staff', 'student.class']);
        $staff = $user->staff;
        $student = $user->student;
        $photo = $staff?->photo ?: $user->photo;
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $staff?->status ?: ($student?->status ?: 'Active'),
            'photo_url' => $photo ? $request->getSchemeAndHttpHost() . '/storage/' . ltrim($photo, '/') : null,
        ];
        if ($staff)
            $data = array_merge($data, $staff->only(['first_name', 'last_name', 'gender', 'birth_date', 'phone', 'personal_phone', 'address', 'city', 'education', 'qualification', 'specialization', 'position', 'department', 'hire_date', 'employee_number', 'notes']));
        if ($student)
            $data = array_merge($data, ['first_name' => $student->first_name, 'last_name' => $student->last_name, 'gender' => $student->gender, 'birth_date' => $student->date_of_birth, 'address' => $student->address, 'phone' => $student->parent_phone, 'student_id' => $student->student_id, 'class_name' => $student->class?->name, 'parent_name' => $student->parent_name, 'parent_phone' => $student->parent_phone, 'status' => $student->status]);
        if ($user->role === 'teacher' && $user->staff)
            $data['academic'] = $this->teacherAcademicData($user);
        return $data;
    }

    private function teacherAcademicData(User $user): array
    {
        $yearId = AcademicYear::where('is_active', true)->value('id');
        if (!$yearId)
            return ['academic_year' => null, 'total_hours' => 0, 'assignments' => [], 'timetable' => []];
        $assignments = DB::table('class_subject')->join('classes', 'class_subject.class_model_id', '=', 'classes.id')->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')->where('classes.academic_year_id', $yearId)->where('teacher_user_id', $user->id)->select('classes.name as class_name', 'subjects.name as subject_name', 'weekly_hours')->orderBy('classes.name')->get();
        $timetable = DB::table('timetable_slots')->join('classes', 'timetable_slots.class_id', '=', 'classes.id')->join('subjects', 'timetable_slots.subject_id', '=', 'subjects.id')->where('timetable_slots.academic_year_id', $yearId)->where('teacher_user_id', $user->id)->select('timetable_slots.id', 'day_of_week as day', 'slot_number as lesson_hour', 'classes.name as class_name', 'subjects.name as subject_name')->orderBy('day')->orderBy('lesson_hour')->get();
        return ['academic_year' => AcademicYear::find($yearId, ['id', 'label']), 'total_hours' => $assignments->sum('weekly_hours'), 'assignments' => $assignments, 'timetable' => $timetable];
    }
}
