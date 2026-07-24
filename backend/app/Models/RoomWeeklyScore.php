<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomWeeklyScore extends Model
{
    protected $fillable = [
        'dorm_room_id',
        'week_number',
        'year',
        'avg_score',
        'rank',
    ];

    protected function casts(): array
    {
        return [
            'avg_score' => 'decimal:2',
            'week_number' => 'integer',
            'year' => 'integer',
            'rank' => 'integer',
        ];
    }

    public function dormRoom(): BelongsTo
    {
        return $this->belongsTo(DormRoom::class);
    }
}
