<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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

            'municipality' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],

            'student_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'parent_name' => ['sometimes', 'string', 'max:255'],
            'parent_phone' => ['sometimes', 'string', 'max:255'],
            'parent_phone_secondary' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:Regular,Boarding'],
            'status' => ['sometimes', 'in:Active,Inactive'],
            'class_id' => ['sometimes', 'exists:classes,id'],
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],

        ];
    }
}
