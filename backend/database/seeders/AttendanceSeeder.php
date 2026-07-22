<?php

namespace Database\Seeders;

use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = ['Absent', 'Late', 'Excused'];
        $recordedByUser = User::where('role', 'teacher')->first();
        $students = Student::all();

        // 1. Mungesat historike për 30 ditët e kaluara
        for ($d = 30; $d >= 1; $d--) {
            $date = Carbon::today()->subDays($d);

            if ($date->isWeekend()) {
                continue;
            }

            foreach ($students as $student) {
                if (rand(1, 100) <= 12) {
                    $status = $statuses[array_rand($statuses)];

                    AttendanceRecord::updateOrCreate(
                        [
                            'class_id' => $student->class_id,
                            'student_id' => $student->id,
                            'date' => $date->toDateString(),
                        ],
                        [
                            'status' => $status,
                            'note' => $status === 'Excused' ? 'Me leje nga prindi' : null,
                            'recorded_by_user_id' => $recordedByUser->id,
                        ]
                    );
                }
            }
        }

        // 2. Mungesat e sotme
        $todayStr = Carbon::today()->toDateString();
        $classes = ClassModel::all();

        foreach ($classes as $classObj) {
            $classStudents = Student::where('class_id', $classObj->id)->get();

            if ($classStudents->count() > 0) {
                $randomClassStudents = $classStudents->random(min(3, $classStudents->count()));

                foreach ($randomClassStudents as $index => $student) {
                    $status = $statuses[$index % 3];

                    AttendanceRecord::updateOrCreate(
                        [
                            'class_id' => $classObj->id,
                            'student_id' => $student->id,
                            'date' => $todayStr,
                        ],
                        [
                            'status' => $status,
                            'note' => $status === 'Excused' ? 'Njoftim nga prindi' : null,
                            'recorded_by_user_id' => $recordedByUser->id,
                        ]
                    );
                }
            }
        }
    }
}