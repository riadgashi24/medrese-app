<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateFeeStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'fee_type_id' => ['required', 'exists:fee_types,id'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'applies_to_type' => ['sometimes', 'in:Regular,Boarding,All'],
            'amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
