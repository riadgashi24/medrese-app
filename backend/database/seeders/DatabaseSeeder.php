<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\DaySupervisor;
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
        $director = User::updateOrCreate(
            ['email' => 'director@medrese.edu'],
            ['name' => 'Ekrem Maqedonci', 'password' => Hash::make('demo123'), 'role' => 'director']
        );

        $secretary = User::updateOrCreate(
            ['email' => 'secretary@medrese.edu'],
            ['name' => 'Vahid Sadiku', 'password' => Hash::make('demo123'), 'role' => 'secretary']
        );

        $cashier = User::updateOrCreate(
            ['email' => 'cashier@medrese.edu'],
            ['name' => 'Arkatar', 'password' => Hash::make('demo123'), 'role' => 'cashier']
        );

        $educator = User::updateOrCreate(
            ['email' => 'educator@medrese.edu'],
            ['name' => 'Edukator', 'password' => Hash::make('demo123'), 'role' => 'educator']
        );

        // 2. Viti Akademik
        $academicYear = AcademicYear::updateOrCreate(
            ['label' => '2025-2026'],
            ['is_active' => true]
        );

        // 3. Kujdestarët e Ditës
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

        // 4. Lista e Profesorëve (Muhamed Stublla në vend të Ekremit)
        $teachersData = [
            ['id' => 1, 'name' => 'Jakup Çunaku', 'dept' => 'Kuran/Tefsir'],
            ['id' => 2, 'name' => 'Shemsi Rrahimi', 'dept' => 'Gj.turke/Hist.'],
            ['id' => 3, 'name' => 'Xh Rusinovci', 'dept' => 'Gj.angleze'],
            ['id' => 4, 'name' => 'M Tërnava', 'dept' => 'Akaid'],
            ['id' => 5, 'name' => 'Samir Ahmeti', 'dept' => 'Histori'],
            ['id' => 6, 'name' => 'Rrahim Aliu', 'dept' => 'Hadith/Akaid'],
            ['id' => 7, 'name' => 'Adnan Simnica', 'dept' => 'Tefsir/Shk. Kuranit'],
            ['id' => 8, 'name' => 'Driton Arifi', 'dept' => 'Fikh/Kuran/Dave'],
            ['id' => 9, 'name' => 'Muhamed Stublla', 'dept' => 'Kuran/Fikh/Usul'],
            ['id' => 10, 'name' => 'Hysni Beka', 'dept' => 'Gj. arabe'],
            ['id' => 11, 'name' => 'Shkelzen Hoxha', 'dept' => 'Gj. arabe'],
            ['id' => 12, 'name' => 'Kujtim Jashanica', 'dept' => 'Gj. arabe'],
            ['id' => 13, 'name' => 'Besnik Jaha', 'dept' => 'Gj.shqipe'],
            ['id' => 14, 'name' => 'Xhevdet Podrimja', 'dept' => 'Fizikë'],
            ['id' => 15, 'name' => 'Safet Avdiu', 'dept' => 'Gjeografi'],
            ['id' => 16, 'name' => 'Nexhat Berisha', 'dept' => 'Biologji'],
            ['id' => 17, 'name' => 'Dëfrim Brajshori', 'dept' => 'Matematikë'],
            ['id' => 18, 'name' => 'Islam Sejdiu', 'dept' => 'TIK'],
            ['id' => 19, 'name' => 'Adem Sahiti', 'dept' => 'Psikologji/Sociologji'],
            ['id' => 20, 'name' => 'Armend Qafleshi', 'dept' => 'Kimi'],
            ['id' => 21, 'name' => 'Valon Brajshori', 'dept' => 'Ed fizike'],
            ['id' => 22, 'name' => 'Hatixhe Sadriu', 'dept' => 'Kuran/Ahlak'],
            ['id' => 23, 'name' => 'Valbona Asllani', 'dept' => 'Kuran/Ahlak'],
            ['id' => 24, 'name' => 'Shaha Memishi', 'dept' => 'Gj.shqipe'],
            ['id' => 25, 'name' => 'Violina Asllani', 'dept' => 'Matematikë'],
            ['id' => 26, 'name' => 'Liriana Gërvalla', 'dept' => 'Psikologji/Sociologji'],
            ['id' => 27, 'name' => 'Granita Zenuni', 'dept' => 'Fizikë'],
            ['id' => 28, 'name' => 'Erblina Krasniqi', 'dept' => 'TIK'],
            ['id' => 29, 'name' => 'Shkurte Gashi', 'dept' => 'Biologji'],
            ['id' => 30, 'name' => 'Nita Pireva', 'dept' => 'Gj. Angleze'],
            ['id' => 31, 'name' => 'Zejnepe Abdyli', 'dept' => 'Gjeografi'],
            ['id' => 32, 'name' => 'Florina Sefa', 'dept' => 'Matematikë'],
            ['id' => 33, 'name' => 'Kosovare Jashari', 'dept' => 'Kimi'],
        ];

        $teachersUsers = [];
        $teachersStaff = [];

        foreach ($teachersData as $t) {
            $emailName = strtolower(str_replace([' ', '.'], ['', ''], $t['name']));

            $user = User::updateOrCreate(
                ['email' => "{$emailName}@medrese.edu"],
                ['name' => $t['name'], 'password' => Hash::make('demo123'), 'role' => 'teacher']
            );

            $parts = explode(' ', $t['name']);
            $staff = Staff::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => $parts[0],
                    'last_name' => $parts[1] ?? '',
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

        // 5. Krijimi i Klasave
        $classesNames = ['12/1', '12/2', '12/3', '12/4', '11/1', '11/2', '11/3', '11/4', '11/5', '10/1', '10/2', '10/3', '10/4'];
        $classes = [];
        foreach ($classesNames as $index => $cName) {
            $assignedStaff = array_values($teachersStaff)[$index % count($teachersStaff)];

            $classes[$cName] = ClassModel::updateOrCreate(
                ['name' => $cName, 'academic_year_id' => $academicYear->id],
                [
                    'section' => substr($cName, -1),
                    'homeroom_staff_id' => $assignedStaff->id
                ]
            );
        }

        // 6. Përkufizimet e Lëndëve sipas Niveleve (10, 11, 12)
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

        // 7. Lidhja e Klasave me Lëndët dhe Orari
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
                }
            }
        }

        // Slot-et e Orarit
        $scheduleGrid = [
            ['Jakup Çunaku', 'E hënë', 1, '12/2'],
            ['Jakup Çunaku', 'E hënë', 2, '11/2'],
            ['Jakup Çunaku', 'E hënë', 3, '12/2'],
            ['Jakup Çunaku', 'E hënë', 4, '12/1'],
            ['Jakup Çunaku', 'E martë', 1, '11/2'],
            ['Jakup Çunaku', 'E martë', 2, '12/2'],
            ['Jakup Çunaku', 'E martë', 3, '12/4'],
            ['Jakup Çunaku', 'E mërkurë', 1, '12/2'],
            ['Jakup Çunaku', 'E mërkurë', 2, '11/2'],
            ['Jakup Çunaku', 'E mërkurë', 3, '12/2'],
            ['Jakup Çunaku', 'E mërkurë', 4, '12/4'],
            ['Jakup Çunaku', 'E mërkurë', 5, '12/1'],
            ['Jakup Çunaku', 'E mërkurë', 6, '12/3'],
            ['Jakup Çunaku', 'E enjte', 1, '11/2'],
            ['Jakup Çunaku', 'E enjte', 2, '12/2'],
            ['Jakup Çunaku', 'E enjte', 3, '12/3'],
            ['Jakup Çunaku', 'E enjte', 4, '12/1'],
            ['Jakup Çunaku', 'E premte', 1, '11/2'],
            ['Jakup Çunaku', 'E premte', 2, '12/2'],
            ['Jakup Çunaku', 'E premte', 3, '12/1'],

            ['Shemsi Rrahimi', 'E hënë', 1, '10/2'],
            ['Shemsi Rrahimi', 'E hënë', 2, '10/3'],
            ['Shemsi Rrahimi', 'E hënë', 3, '10/1'],
            ['Shemsi Rrahimi', 'E hënë', 4, '10/4'],
            ['Shemsi Rrahimi', 'E martë', 1, '10/1'],
            ['Shemsi Rrahimi', 'E martë', 2, '10/1'],
            ['Shemsi Rrahimi', 'E enjte', 1, '10/3'],
            ['Shemsi Rrahimi', 'E enjte', 2, '10/4'],
            ['Shemsi Rrahimi', 'E enjte', 3, '10/2'],
            ['Shemsi Rrahimi', 'E enjte', 4, '10/1'],

            ['M Tërnava', 'E hënë', 1, '11/3'],
            ['M Tërnava', 'E hënë', 2, '12/3'],
            ['M Tërnava', 'E hënë', 3, '12/4'],
            ['M Tërnava', 'E hënë', 4, '11/1'],
            ['M Tërnava', 'E hënë', 5, '12/1'],
            ['M Tërnava', 'E martë', 1, '10/2'],
            ['M Tërnava', 'E martë', 2, '11/4'],
            ['M Tërnava', 'E martë', 3, '11/5'],
            ['M Tërnava', 'E mërkurë', 1, '12/3'],
            ['M Tërnava', 'E mërkurë', 2, '12/2'],
            ['M Tërnava', 'E mërkurë', 3, '11/1'],
            ['M Tërnava', 'E mërkurë', 4, '10/2'],
            ['M Tërnava', 'E mërkurë', 5, '12/3'],
            ['M Tërnava', 'E mërkurë', 6, '10/2'],
            ['M Tërnava', 'E enjte', 1, '11/3'],
            ['M Tërnava', 'E enjte', 2, '11/5'],
            ['M Tërnava', 'E enjte', 3, '11/4'],
            ['M Tërnava', 'E enjte', 4, '11/2'],
            ['M Tërnava', 'E enjte', 5, '12/4'],
            ['M Tërnava', 'E premte', 1, '12/4'],
            ['M Tërnava', 'E premte', 2, '12/1'],
            ['M Tërnava', 'E premte', 3, '12/1'],
            ['M Tërnava', 'E premte', 4, '12/1'],
            ['M Tërnava', 'E premte', 5, '12/2'],
            ['M Tërnava', 'E premte', 6, '12/2'],
            ['M Tërnava', 'E premte', 7, '10/3'],
        ];

        foreach ($scheduleGrid as $item) {
            $tName = $item[0];
            $day = $item[1];
            $slotNum = $item[2];
            $cName = $item[3];

            if (isset($teachersUsers[$tName]) && isset($classes[$cName])) {
                $user = $teachersUsers[$tName];
                $cObj = $classes[$cName];
                $level = str_starts_with($cName, '10') ? 10 : (str_starts_with($cName, '11') ? 11 : 12);

                // Marrim një lëndë të nivelit përkatës për slotin
                $subObj = collect($createdSubjects)->first(fn($s) => $s->level == $level) ?? reset($createdSubjects);

                TimetableSlot::updateOrCreate(
                    [
                        'day' => $day,
                        'slot_number' => $slotNum,
                        'class_id' => $cObj->id,
                        'academic_year_id' => $academicYear->id,
                    ],
                    [
                        'subject_id' => $subObj->id,
                        'teacher_user_id' => $user->id,
                    ]
                );
            }
        }

        // 8. Gjenerimi i Nxënësve (15 nxënës për secilën klasë)
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

        // 9. Regjistrimi i Mungesave (Attendance Records)
        $statuses = ['Absent', 'Late', 'Excused'];
        $recordedByUser = array_values($teachersUsers)[0];

        // Mungesat historike për 30 ditët e kaluara
        for ($d = 30; $d >= 1; $d--) {
            $date = Carbon::today()->subDays($d);

            if ($date->isWeekend()) {
                continue;
            }

            foreach ($createdStudents as $student) {
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

        // Mungesat e sotme
        $todayStr = Carbon::today()->toDateString();

        foreach ($classes as $cName => $classObj) {
            $classStudents = array_filter($createdStudents, function ($st) use ($classObj) {
                return $st->class_id === $classObj->id;
            });

            if (count($classStudents) > 0) {
                $randomClassStudents = collect($classStudents)->random(min(3, count($classStudents)));

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