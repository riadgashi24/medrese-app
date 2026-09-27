<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassModel extends Model
{
    protected $table = 'classes';

    protected $fillable = ['name', 'section', 'academic_year_id', 'homeroom_staff_id'];

    public function getLevelAttribute(): ?int
    {
        if (preg_match('/^(10|11|12|XII|XI|X)(?=$|[^0-9IVX])/i', trim($this->name), $matches)) {
            return ['X' => 10, 'XI' => 11, 'XII' => 12][strtoupper($matches[1])] ?? (int) $matches[1];
        }
        return null;
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function academicEnrollments(): HasMany
    {
        return $this->hasMany(StudentAcademicEnrollment::class, 'class_id');
    }

    public function timetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class);
    }

    public function homeroomTeacher(): BelongsTo
    {
        // Nëse lidhet me modelin Staff përmes 'homeroom_staff_id':
        return $this->belongsTo(Staff::class, 'homeroom_staff_id');

        // Shënim: Nëse te ju lidhet direkt me User, përdor User::class
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'class_subject', 'class_model_id', 'subject_id')
            ->withPivot('id', 'teacher_user_id', 'weekly_hours');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function homeroomStaff()
    {
        return $this->belongsTo(Staff::class, 'homeroom_staff_id');
    }
}
