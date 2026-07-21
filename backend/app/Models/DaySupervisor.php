<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DaySupervisor extends Model
{
    protected $fillable = ['academic_year_id', 'day', 'supervisor_names'];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}