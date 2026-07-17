<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Base API resource that enforces the standard response format:
 *
 * {
 *   "success": true,
 *   "data": <resource-data>,
 *   "meta": { ...optional... }
 * }
 *
 * All API resources should extend this class and implement the `toArray`
 * method normally. The `toResponse` method adds the wrapper automatically.
 */
class ApiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Child classes must implement this method (inherited from JsonResource).
     */
    // public function toArray($request) { ... }

    /**
     * Build the JSON response with the standard wrapper.
     */
    public function toResponse($request)
    {
        $data = $this->resolve($request);
        $response = [
            'success' => true,
            'data'    => $data,
        ];
        // If a child resource sets a `meta` property on the resource, include it.
        if (property_exists($this, 'meta') && $this->meta !== null) {
            $response['meta'] = $this->meta;
        }
        return response()->json($response);
    }
}
