<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_id' => ['required', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'kind' => ['sometimes', 'in:Regular,Fajr'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'exists:students,id'],
            'records.*.status' => ['required', 'in:Present,Absent,Excused'],
        ];
    }
}
