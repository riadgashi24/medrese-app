<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonSession extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['lesson_date' => 'date', 'slot_number' => 'integer'];

    public function attendances()
    {
        return $this->hasMany(LessonAttendance::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
