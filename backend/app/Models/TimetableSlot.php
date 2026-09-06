<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'day_of_week',
        'slot_number',
        'start_time',
        'end_time',
        'class_id',
        'subject_id',
        'teacher_user_id',
        'academic_year_id',
    ];

    /**
     * Konvertimi automatik i tipave të të dhënave
     */
    protected $casts = [
        'day_of_week' => 'integer',
        'slot_number' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'teacher_user_id' => 'integer',
        'academic_year_id' => 'integer',
    ];

    /**
     * Relacionet që ngarkohen automatikisht kur kërkohet modeli (Opsionale, por e dobishme për React)
     * Heq nevojën për ->with() në Controller çdo herë.
     */
    protected $with = ['subject', 'class', 'teacherUser'];

    // --- RELACIONET ---

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Përdorim camelCase sipas standardit të Laravel.
     * Në React kjo do të jetë automatikisht e qasshme si `slot.teacher_user` ose `slot.teacherUser`
     */
    public function teacherUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_user_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}