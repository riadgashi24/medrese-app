<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DormInspectionItem extends Model
{
    protected $table = 'dorm_inspection_items';

    protected $fillable = [
        'inspection_id',
        'item_key',
        'item_label',
        'passed',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'passed' => 'boolean',
        ];
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(DormInspection::class, 'inspection_id');
    }
}
