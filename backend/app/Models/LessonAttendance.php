<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonAttendance extends Model
{
    protected $guarded = ['id'];

    public function lessonSession()
    {
        return $this->belongsTo(LessonSession::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
