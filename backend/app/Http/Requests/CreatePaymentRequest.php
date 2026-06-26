<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'fee_type_id' => ['required', 'exists:fee_types,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'in:Cash,Transfer,Online'],
            'status' => ['sometimes', 'in:Pending,Completed,Failed'],
            'paid_at' => ['nullable', 'date'],
        ];
    }
}
