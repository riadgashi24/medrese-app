<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'class_id' => ['sometimes', 'exists:classes,id'],
            'type' => ['sometimes', 'in:Regular,Boarding'],
            'status' => ['sometimes', 'in:Active,Inactive'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
