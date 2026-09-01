<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentListResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'student_email' => $this->student_email,
            'parent_name' => $this->parent_name,
            'parent_phone' => $this->parent_phone,
            'type' => $this->type,
            'status' => $this->status,
            'class_id' => $this->class_id,
            'class_name' => $this->class?->name,
        ];
    }
}
