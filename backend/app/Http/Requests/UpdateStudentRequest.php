<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'], // 👈 SHTUAR
            'gender' => ['sometimes', 'nullable', 'string', 'in:Male,Female'], // 👈 SHTUAR
            'municipality' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'student_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'parent_name' => ['sometimes', 'required', 'string', 'max:255'],
            'parent_phone' => ['sometimes', 'required', 'string', 'max:50'],
            'parent_phone_secondary' => ['sometimes', 'nullable', 'string', 'max:50'],
            'parent_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'class_id' => ['sometimes', 'exists:classes,id'],
            'type' => ['sometimes', 'in:Regular,Boarding'],
            'status' => ['sometimes', 'in:Active,Graduated,Transferred,Withdrawn'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}