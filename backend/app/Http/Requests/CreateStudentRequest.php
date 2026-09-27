<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],

            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'in:Male,Female'],

            'municipality' => ['required', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],

            'student_email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_phone' => ['required', 'string', 'max:255'],
            'parent_phone_secondary' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:Regular,Boarding'],
            'status' => ['sometimes', 'in:Active,Graduated,Transferred,Withdrawn'],
            'class_id' => ['sometimes', 'exists:classes,id'],
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],

        ];
    }
}
