<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeType extends Model
{
    protected $fillable = ['code', 'name', 'default_amount', 'is_recurring'];

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'default_amount' => 'decimal:2',
        ];
    }

    public function feeStructures(): HasMany
    {
        return $this->hasMany(FeeStructure::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
