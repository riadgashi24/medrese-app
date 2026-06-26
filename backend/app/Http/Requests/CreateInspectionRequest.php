<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dorm_room_id' => ['required', 'exists:dorm_rooms,id'],
            'inspection_date' => ['required', 'date'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'note' => ['nullable', 'string'],
        ];
    }
}
