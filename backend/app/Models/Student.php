<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'class_id',
        'type',
        'status',
        'user_id',
        'municipality',
        'parent_email',
    ];

    protected static function booted(): void
    {
        static::creating(function (Student $student) {
            if (!$student->student_id) {
                $student->student_id = self::generateStudentId();
            }

            if (!$student->status) {
                $student->status = 'Active';
            }
        });
    }
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function studyHours(): HasMany
    {
        return $this->hasMany(StudyHour::class);
    }

    public function dormAssignments(): HasMany
    {
        return $this->hasMany(DormAssignment::class);
    }

    public function disciplineRecords(): HasMany
    {
        return $this->hasMany(DisciplineRecord::class);
    }

    public function studentDocuments(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function activityEnrollments(): HasMany
    {
        return $this->hasMany(ActivityEnrollment::class);
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getBalanceAttribute(): float
    {
        $academicYear = AcademicYear::where('is_active', true)->first();
        if (!$academicYear) {
            return 0;
        }

        $feeStructures = FeeStructure::where('academic_year_id', $academicYear->id)
            ->where(function ($query) {
                $query->whereNull('class_id')
                    ->orWhere('class_id', $this->class_id);
            })
            ->where(function ($query) {
                $query->where('applies_to_type', 'All')
                    ->orWhere('applies_to_type', $this->type);
            })
            ->get();

        $totalFees = $feeStructures->sum('amount');

        $totalPaid = $this->payments()
            ->where('status', 'Completed')
            ->sum('amount');

        return max(0, $totalFees - $totalPaid);
    }
    public static function generateStudentId(): string
    {
        $year = now()->year;

        $lastStudent = self::whereYear('created_at', $year)
            ->latest('id')
            ->first();

        $number = 1;

        if ($lastStudent && $lastStudent->student_id) {
            $number = ((int) substr($lastStudent->student_id, -4)) + 1;
        }

        return sprintf(
            'STD-%d-%04d',
            $year,
            $number
        );
    }
}
