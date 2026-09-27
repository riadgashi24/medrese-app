<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    protected $fillable = [
        'user_id',
        'role',
        'first_name',
        'last_name',
        'personal_number',
        'employee_number',
        'gender',
        'birth_date',
        'place_of_birth',
        'phone',
        'personal_phone',
        'email',
        'position',
        'department',
        'education',
        'qualification',
        'specialization',
        'hire_date',
        'status',
        'photo',
        'address',
        'city',
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

    public function getNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}