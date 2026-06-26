<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtracurricularActivity extends Model
{
    protected $fillable = [
        'name',
        'description',
        'capacity',
        'enrolled',
        'fee',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
        ];
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ActivityEnrollment::class, 'activity_id');
    }
}
