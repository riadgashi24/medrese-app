<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordDisciplineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'category_id' => ['required', 'exists:discipline_categories,id'],
            'description' => ['required', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'discipline_date' => ['required', 'date'],
        ];
    }
}
