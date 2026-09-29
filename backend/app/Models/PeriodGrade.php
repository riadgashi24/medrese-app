<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodGrade extends Model
{
    public const PERIODS = [1 => 'Shtator–Tetor', 2 => 'Nëntor–Dhjetor', 3 => 'Janar–Shkurt', 4 => 'Mars–Prill', 5 => 'Maj–Qershor'];

    protected $guarded = ['id'];

    protected $casts = ['period' => 'integer', 'grade' => 'integer'];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
