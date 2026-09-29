<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortalEntry extends Model
{
    protected $guarded = ['id'];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function activity()
    {
        return $this->belongsTo(ExtracurricularActivity::class, 'activity_id');
    }

    public function scopeForStudent($query, Student $student)
    {
        return $query->where(function ($q) use ($student) {
            $q->whereNull('class_id');
            if ($student->class_id) {
                $q->orWhere('class_id', $student->class_id);
            }
        })->where(function ($q) use ($student) {
            $q->whereNull('activity_id')->orWhereIn('activity_id', ActivityEnrollment::where('student_id', $student->id)->select('activity_id'));
        });
    }
}
