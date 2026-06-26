<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DormInspection extends Model
{
    protected $fillable = [
        'dorm_room_id',
        'inspection_date',
        'score',
        'note',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'inspection_date' => 'date',
            'score' => 'decimal:2',
        ];
    }

    public function dormRoom(): BelongsTo
    {
        return $this->belongsTo(DormRoom::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
