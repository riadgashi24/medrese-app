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
            'class_id' => ['required', 'exists:classes,id'],
            'type' => ['required', 'in:Regular,Boarding'],
            'status' => ['sometimes', 'in:Active,Inactive'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
