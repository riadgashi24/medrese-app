<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Përdoruesit bazë të sistemit
        $director = User::updateOrCreate(['email' => 'director@medrese.edu'], ['name' => 'Drejtor', 'password' => Hash::make('demo123'), 'role' => 'director']);
        $secretary = User::updateOrCreate(['email' => 'secretary@medrese.edu'], ['name' => 'Sekretar', 'password' => Hash::make('demo123'), 'role' => 'secretary']);
        $cashier = User::updateOrCreate(['email' => 'cashier@medrese.edu'], ['name' => 'Arkatar', 'password' => Hash::make('demo123'), 'role' => 'cashier']);
        $educator = User::updateOrCreate(['email' => 'educator@medrese.edu'], ['name' => 'Edukator', 'password' => Hash::make('demo123'), 'role' => 'educator']);

        // 2. Viti Akademik
        $academicYear = AcademicYear::updateOrCreate(
            ['label' => '2025-2026'],
            ['is_active' => true]
        );

        // 3. Krijimi i Profesorëve
        $teachersData = [
            ['name' => 'Jakup Çunaku', 'email' => 'jakup.cunaku@medrese.edu', 'dept' => 'Kuran/Tefsir'],
            ['name' => 'Shemsi Rrahimi', 'email' => 'shemsi.rrahimi@medrese.edu', 'dept' => 'Gj.turke/Hist.'],
            ['name' => 'Xh Rusinovci', 'email' => 'xh.rusinovci@medrese.edu', 'dept' => 'Gj.angleze'],
            ['name' => 'M Tërnava', 'email' => 'm.ternava@medrese.edu', 'dept' => 'Akaid'],
            ['name' => 'Samir Ahmeti', 'email' => 'samir.ahmeti@medrese.edu', 'dept' => 'Histori'],
            ['name' => 'Rrahim Aliu', 'email' => 'rrahim.aliu@medrese.edu', 'dept' => 'Hadith/Akaid'],
            ['name' => 'Adnan Simnica', 'email' => 'adnan.simnica@medrese.edu', 'dept' => 'Tefsir/Shk. Kuranit'],
            ['name' => 'Driton Arifi', 'email' => 'driton.arifi@medrese.edu', 'dept' => 'Fikh/Kuran/Dave'],
            ['name' => 'Ekrem Maqedonci', 'email' => 'ekrem.maqedonci@medrese.edu', 'dept' => 'Kuran/Fikh/Usul'],
            ['name' => 'Hysni Beka', 'email' => 'hysni.beka@medrese.edu', 'dept' => 'Gj. arabe'],
            ['name' => 'Shkelzen Hoxha', 'email' => 'shkelzen.hoxha@medrese.edu', 'dept' => 'Gj. arabe'],
            ['name' => 'Kujtim Jashanica', 'email' => 'kujtim.jashanica@medrese.edu', 'dept' => 'Gj. arabe'],
            ['name' => 'Besnik Jaha', 'email' => 'besnik.jaha@medrese.edu', 'dept' => 'Gj.shqipe'],
            ['name' => 'Xhevdet Podrimja', 'email' => 'xhevdet.podrimja@medrese.edu', 'dept' => 'Fizikë'],
        ];

        $teachersUsers = [];
        $teachersStaff = [];

        foreach ($teachersData as $t) {
            $user = User::updateOrCreate(
                ['email' => $t['email']],
                ['name' => $t['name'], 'password' => Hash::make('demo123'), 'role' => 'teacher']
            );

            $staff = Staff::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => explode(' ', $t['name'])[0],
                    'last_name' => explode(' ', $t['name'])[1] ?? '',
                    'email' => $user->email,
                    'position' => 'Profesor',
                    'department' => $t['dept'],
                    'gender' => 'Male',
                    'status' => 'Active',
                    'hire_date' => now()->subYears(2)->toDateString()
                ]
            );

            $teachersUsers[$t['name']] = $user;
            $teachersStaff[$t['name']] = $staff;
        }

        // 4. Krijimi i Klasave
        $classesData = ['12/1', '12/2', '12/3', '12/4', '11/1', '11/2', '11/3', '11/4', '11/5', '10/1', '10/2', '10/3', '10/4'];
        $classes = [];
        foreach ($classesData as $index => $cName) {
            $assignedStaff = array_values($teachersStaff)[$index % count($teachersStaff)];

            $classes[$cName] = ClassModel::updateOrCreate(
                ['name' => $cName, 'academic_year_id' => $academicYear->id],
                [
                    'section' => substr($cName, -1),
                    'homeroom_staff_id' => $assignedStaff->id
                ]
            );
        }

        // 5. Definitat e Lëndëve
        $subjects_10 = [
            ['name' => 'Gjuhë amtare', 'category' => 'Gjuhët dhe komunikimi', 'level' => 10],
            ['name' => 'Gjuhë angleze', 'category' => 'Gjuhët dhe komunikimi', 'level' => 10],
            ['name' => 'Gjuhë arabe', 'category' => 'Gjuhët dhe komunikimi', 'level' => 10],
            ['name' => 'Gjuhë turke', 'category' => 'Gjuhët dhe komunikimi', 'level' => 10],
            ['name' => 'Kuran', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 10],
            ['name' => 'Fikh', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 10],
            ['name' => 'Akaid', 'category' => 'Bazat e fesë', 'level' => 10],
            ['name' => 'Matematikë', 'category' => 'Matematikë', 'level' => 10],
            ['name' => 'Biologji', 'category' => 'Shkencat e natyrës', 'level' => 10],
            ['name' => 'Fizikë', 'category' => 'Shkencat e natyrës', 'level' => 10],
            ['name' => 'Kimi', 'category' => 'Shkencat e natyrës', 'level' => 10],
            ['name' => 'Gjeografi', 'category' => 'Shkencat e natyrës', 'level' => 10],
            ['name' => 'Histori', 'category' => 'Shoqëria dhe mjedisi', 'level' => 10],
            ['name' => 'TIK', 'category' => 'Jeta dhe mjedisi', 'level' => 10],
            ['name' => 'Ed. Fizike, sporte', 'category' => 'Ed. fizike, sporte', 'level' => 10],
        ];

        $subjects_11 = [
            ['name' => 'Gjuhë amtare', 'category' => 'Gjuhët dhe komunikimi', 'level' => 11],
            ['name' => 'Gjuhë angleze', 'category' => 'Gjuhët dhe komunikimi', 'level' => 11],
            ['name' => 'Gjuhë arabe', 'category' => 'Gjuhët dhe komunikimi', 'level' => 11],
            ['name' => 'Kuran', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 11],
            ['name' => 'Fikh', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 11],
            ['name' => 'Akaid', 'category' => 'Bazat e fesë', 'level' => 11],
            ['name' => 'Shkencat e Kuranit', 'category' => 'Bazat e fesë', 'level' => 11],
            ['name' => 'Shkencat e Hadithit', 'category' => 'Bazat e fesë', 'level' => 11],
            ['name' => 'Etikë (Ahlak)', 'category' => 'Bazat e fesë', 'level' => 11],
            ['name' => 'Matematikë', 'category' => 'Matematikë', 'level' => 11],
            ['name' => 'Fizikë', 'category' => 'Shkencat e natyrës', 'level' => 11],
            ['name' => 'Histori', 'category' => 'Shoqëria dhe mjedisi', 'level' => 11],
            ['name' => 'Psikologji', 'category' => 'Shoqëria dhe mjedisi', 'level' => 11],
            ['name' => 'TIK', 'category' => 'Jeta dhe mjedisi', 'level' => 11],
            ['name' => 'Ed. Fizike, sporte', 'category' => 'Ed. fizike, sporte', 'level' => 11],
        ];

        $subjects_12 = [
            ['name' => 'Gjuhë amtare', 'category' => 'Gjuhët dhe komunikimi', 'level' => 12],
            ['name' => 'Gjuhë angleze', 'category' => 'Gjuhët dhe komunikimi', 'level' => 12],
            ['name' => 'Gjuhë arabe', 'category' => 'Gjuhët dhe komunikimi', 'level' => 12],
            ['name' => 'Kuran', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 12],
            ['name' => 'Fikh', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 12],
            ['name' => 'Usuli fikh', 'category' => 'Kurani dhe jurisprudenca islame', 'level' => 12],
            ['name' => 'Akaid', 'category' => 'Bazat e fesë', 'level' => 12],
            ['name' => 'Komentimi i Kuranit', 'category' => 'Bazat e fesë', 'level' => 12],
            ['name' => 'Komentimi i Hadithit', 'category' => 'Bazat e fesë', 'level' => 12],
            ['name' => 'Thirrje - Imamat', 'category' => 'Bazat e fesë', 'level' => 12],
            ['name' => 'Matematikë', 'category' => 'Matematikë', 'level' => 12],
            ['name' => 'Histori', 'category' => 'Shoqëria dhe mjedisi', 'level' => 12],
            ['name' => 'Filozofi', 'category' => 'Shoqëria dhe mjedisi', 'level' => 12],
            ['name' => 'Sociologji', 'category' => 'Shoqëria dhe mjedisi', 'level' => 12],
            ['name' => 'TIK', 'category' => 'Jeta dhe mjedisi', 'level' => 12],
            ['name' => 'Ed. Fizike, sporte', 'category' => 'Ed. fizike, sporte', 'level' => 12],
        ];

        $createdSubjects = [];
        foreach (array_merge($subjects_10, $subjects_11, $subjects_12) as $s) {
            $subjectObj = Subject::updateOrCreate(
                ['name' => $s['name'], 'level' => $s['level']],
                ['category' => $s['category']]
            );
            $createdSubjects[$s['name'] . '_' . $s['level']] = $subjectObj;
        }

        $days = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte'];
        $teacherSchedules = [];
        $classSchedules = [];

        // 6. LIDHJA E KLASAVE ME LËNDËT DHE ORARIN
        foreach ($classes as $cName => $classObj) {
            $level = str_starts_with($cName, '10') ? 10 : (str_starts_with($cName, '11') ? 11 : 12);

            foreach ($createdSubjects as $key => $subObj) {
                if ($subObj->level == $level) {

                    $teacherUser = $teachersUsers['Jakup Çunaku'];
                    if (str_contains($subObj->name, 'Kuran') || str_contains($subObj->name, 'Komentimi')) {
                        $teacherUser = $teachersUsers['Jakup Çunaku'];
                    } elseif (str_contains($subObj->name, 'Matematikë') || str_contains($subObj->name, 'Fizikë')) {
                        $teacherUser = $teachersUsers['Xhevdet Podrimja'];
                    } elseif (str_contains($subObj->name, 'arabe')) {
                        $teacherUser = $teachersUsers['Hysni Beka'];
                    } elseif (str_contains($subObj->name, 'Histori')) {
                        $teacherUser = $teachersUsers['Samir Ahmeti'];
                    } elseif (str_contains($subObj->name, 'amtare')) {
                        $teacherUser = $teachersUsers['Besnik Jaha'];
                    }

                    $classObj->subjects()->syncWithoutDetaching([
                        $subObj->id => [
                            'teacher_user_id' => $teacherUser->id,
                            'weekly_hours' => ($subObj->name === 'Kuran' || $subObj->name === 'Matematikë') ? 4 : 2
                        ]
                    ]);

                    // Timetable slots
                    foreach ($days as $day) {
                        for ($slotNumber = 1; $slotNumber <= 6; $slotNumber++) {
                            $tKey = "{$teacherUser->id}-{$day}-{$slotNumber}";
                            $cKey = "{$classObj->id}-{$day}-{$slotNumber}";

                            if (!isset($teacherSchedules[$tKey]) && !isset($classSchedules[$cKey])) {
                                $teacherSchedules[$tKey] = true;
                                $classSchedules[$cKey] = true;

                                TimetableSlot::create([
                                    'day' => $day,
                                    'slot_number' => $slotNumber,
                                    'class_id' => $classObj->id,
                                    'subject_id' => $subObj->id,
                                    'teacher_user_id' => $teacherUser->id,
                                    'academic_year_id' => $academicYear->id,
                                ]);

                                break 2;
                            }
                        }
                    }
                }
            }
        }

        // 7. GJENERIMI I RREGULLT I NXËNËSVE (Rreth 15 nxënës për secilën klasë)
        $firstNames = ['Ahmed', 'Fatmir', 'Yll', 'Blerim', 'Dren', 'Arian', 'Fisnik', 'Valon', 'Alban', 'Eris', 'Blendi', 'Leart', 'Endrit', 'Lirim', 'Genc'];
        $lastNames = ['Hoxha', 'Krasniqi', 'Berisha', 'Gashi', 'Morina', 'Kastrati', 'Kelmendi', 'Shala', 'Bytyqi', 'Gecaj', 'Rama', 'Zyba', 'Lushi', 'Tahiri'];

        $createdStudents = [];
        $studentCounter = 1;

        foreach ($classes as $cName => $classObj) {
            for ($i = 1; $i <= 15; $i++) {
                $fn = $firstNames[array_rand($firstNames)];
                $ln = $lastNames[array_rand($lastNames)];
                $email = strtolower($fn . '.' . $ln . $studentCounter . '@medrese.edu');

                $studentUser = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => $fn . ' ' . $ln,
                        'password' => Hash::make('demo123'),
                        'role' => 'student'
                    ]
                );

                $student = Student::updateOrCreate(
                    ['student_id' => 'STD-2025-' . str_pad($studentCounter, 4, '0', STR_PAD_LEFT)],
                    [
                        'first_name' => $fn,
                        'last_name' => $ln,
                        'parent_name' => 'Prind',
                        'parent_phone' => '+38344' . rand(100000, 999999),
                        'municipality' => 'Prishtinë',
                        'class_id' => $classObj->id,
                        'type' => 'Regular',
                        'status' => 'Active',
                        'user_id' => $studentUser->id
                    ]
                );

                $createdStudents[] = $student;
                $studentCounter++;
            }
        }
        // 8. SHTIMI I ATTENDANCE RECORDS (Save by Exception — Për çdo klasë)
        $statuses = ['Absent', 'Late', 'Excused'];
        $recordedByUser = array_values($teachersUsers)[0];

        // A) Mungesa historike për 30 ditët e kaluara (E shpërndarë në të gjitha klasat)
        for ($d = 30; $d >= 1; $d--) {
            $date = Carbon::today()->subDays($d);

            if ($date->isWeekend()) {
                continue;
            }

            foreach ($createdStudents as $student) {
                // ~12% chance për çdo nxënës
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

        // B) GUARANTEE PËR ÇDO KLASË SOT: Zgjedhim nga 2-3 nxënës për Secilën Klasë
        $todayStr = Carbon::today()->toDateString();

        foreach ($classes as $cName => $classObj) {
            // Marrim nxënësit që i përkasin kësaj klase specifike
            $classStudents = array_filter($createdStudents, function ($st) use ($classObj) {
                return $st->class_id === $classObj->id;
            });

            if (count($classStudents) > 0) {
                // Zgjedhim 2 ose 3 nxënës nga kjo klasë me mungesë/vonesë sot
                $randomClassStudents = collect($classStudents)->random(min(3, count($classStudents)));

                foreach ($randomClassStudents as $index => $student) {
                    $status = $statuses[$index % 3]; // Ciklon mes Absent, Late, Excused

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