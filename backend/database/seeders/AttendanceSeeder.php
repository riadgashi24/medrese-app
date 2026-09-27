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
        $students = Student::where('status', 'Active')->whereNotNull('class_id')->get();
        if (!$recordedByUser) {
            $this->command?->warn('Nuk ka mësimdhënës për regjistrimin e mungesave demo.');
            return;
        }

        // 1. Mungesat historike për 30 ditët e kaluara
        for ($d = 30; $d >= 1; $d--) {
            $date = Carbon::today()->subDays($d);

            if ($date->isWeekend() || in_array($date->month, [7, 8])) {
                continue;
            }

            foreach ($students as $student) {
                if (($student->id + $date->dayOfYear) % 9 === 0) {
                    $status = $statuses[($student->id + $date->dayOfYear) % 3];

                    AttendanceRecord::firstOrCreate(
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
        if (Carbon::today()->isWeekend() || in_array(Carbon::today()->month, [7, 8])) return;
        $todayStr = Carbon::today()->toDateString();
        $classes = ClassModel::all();

        foreach ($classes as $classObj) {
            $classStudents = $students->where('class_id', $classObj->id);

            if ($classStudents->count() > 0) {
                $randomClassStudents = $classStudents->take(3);

                foreach ($randomClassStudents as $index => $student) {
                    $status = $statuses[$index % 3];

                    AttendanceRecord::firstOrCreate(
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