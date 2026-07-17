<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableSlot extends Model
{
    protected $fillable = [
        'day',
        'slot_number', // U shtua kjo fushë për numrin e orës (1-7)
        'start_time',
        'end_time',
        'class_id',
        'subject_id',
        'teacher_user_id',
        'academic_year_id',
    ];

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    // E emërojmë teacher_user që të përshtatet ekzaktësisht me `slot.teacher_user` në React
    public function teacher_user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}