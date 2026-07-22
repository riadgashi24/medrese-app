<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\DaySupervisor;
use Illuminate\Database\Seeder;

class DaySupervisorSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $supervisorsData = [
            'E hënë' => 'B JAHA / VIOLINA & ERBLINA',
            'E martë' => 'Dëfrim BRAJSHORI / Shaha M.',
            'E mërkurë' => 'I SEJDIU / SHAHA & GRANITA',
            'E enjte' => 'M. Stublla / Valbona A.',
            'E premte' => 'Kujtim J. / Hatixhe J.',
        ];

        foreach ($supervisorsData as $day => $names) {
            DaySupervisor::updateOrCreate(
                ['academic_year_id' => $academicYear->id, 'day' => $day],
                ['supervisor_names' => $names]
            );
        }
    }
}