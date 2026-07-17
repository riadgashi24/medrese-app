<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    protected $fillable = ['name', 'category', 'level'];

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_subject', 'subject_id', 'class_model_id')
            ->withPivot('teacher_user_id', 'weekly_hours')
            ->withTimestamps();
    }
}