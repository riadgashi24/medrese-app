<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'personal_number',
        'gender',
        'birth_date',
        'phone',
        'email',
        'position',
        'department',
        'hire_date',
        'status',
        'photo',
        'address',
        'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'hire_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}