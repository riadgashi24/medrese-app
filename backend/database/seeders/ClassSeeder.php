<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Staff;
use Illuminate\Database\Seeder;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_active', true)->first();
        $staffMembers = Staff::all();

        $classesNames = ['12/1', '12/2', '12/3', '12/4', '11/1', '11/2', '11/3', '11/4', '11/5', '10/1', '10/2', '10/3', '10/4'];

        foreach ($classesNames as $index => $cName) {
            $assignedStaff = $staffMembers[$index % $staffMembers->count()];

            ClassModel::updateOrCreate(
                ['name' => $cName, 'academic_year_id' => $academicYear->id],
                [
                    'section' => substr($cName, -1),
                    'homeroom_staff_id' => $assignedStaff->id
                ]
            );
        }
    }
}