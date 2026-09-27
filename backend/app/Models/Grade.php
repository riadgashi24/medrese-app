<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'subject_id',
        'academic_year_id',
        'term_1_grade',
        'term_2_grade',
        'final_grade',
        'is_final_overridden',
    ];

    protected function casts(): array
    {
        return ['term_1_grade' => 'integer', 'term_2_grade' => 'integer', 'final_grade' => 'integer', 'is_final_overridden' => 'boolean'];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    // Llogaritja automatike e NP (me rrumbullakim lart për .5)
    public static function calculateFinalGrade(?int $term1, ?int $term2): ?int
    {
        if (is_null($term1) && is_null($term2))
            return null;
        if (is_null($term1))
            return $term2;
        if (is_null($term2))
            return $term1;

        $average = ($term1 + $term2) / 2;
        // round($average, 0, PHP_ROUND_HALF_UP) bën që 1.5 -> 2, 2.5 -> 3, 4.5 -> 5
        return (int) round($average, 0, PHP_ROUND_HALF_UP);
    }
}
