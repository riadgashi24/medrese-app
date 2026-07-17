<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API resource for Student model.
 * Handles the transformation of student data for API responses.
 */
class StudentResource extends ApiResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'student_id'    => $this->student_id,
            'first_name'    => $this->first_name,
            'last_name'     => $this->last_name,
            'full_name'     => $this->full_name,
            'date_of_birth' => $this->date_of_birth,
            'gender'        => $this->gender,
            'municipality'  => $this->municipality,
            'address'       => $this->address,
            'student_email' => $this->student_email,
            'parent_name'   => $this->parent_name,
            'parent_phone'  => $this->parent_phone,
            'parent_phone_secondary' => $this->parent_phone_secondary,
            'type'          => $this->type,
            'status'        => $this->status,
            'class_id'      => $this->class_id,
            'balance'       => $this->whenLoaded('class', $this->balance),
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}