<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DormRoom extends Model
{
    protected $fillable = ['code', 'dorm_block', 'capacity'];

    public function assignments(): HasMany
    {
        return $this->hasMany(DormAssignment::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(DormInspection::class);
    }
}
