<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * API resource collection for Student model.
 * Handles the transformation of paginated student lists.
 */
class StudentsResource extends ResourceCollection
{
    /**
     * Meta information for pagination.
     */
    public $meta = null;

    /**
     * Transform the resource collection into an array.
     */
    public function toArray($request): array
    {
        $this->meta = [
            'current_page' => $this->currentPage(),
            'last_page'    => $this->lastPage(),
            'per_page'     => $this->perPage(),
            'total'        => $this->total(),
        ];

        return [
            'success' => true,
            'data'    => StudentResource::collection($this->collection),
            'meta'    => $this->meta,
        ];
    }
}