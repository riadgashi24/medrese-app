<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
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
        
        // Mbajmë mend zënien e sloteve për të evituar përplasjet e dyfishta
        $teacherSchedules = []; // Çelësi: profesor-ditë-slot
        $classSchedules = [];   // Çelësi: klasë-ditë-slot

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

                    // Lidhim në pivot
                    $classObj->subjects()->syncWithoutDetaching([
                        $subObj->id => [
                            'teacher_user_id' => $teacherUser->id,
                            'weekly_hours' => ($subObj->name === 'Kuran' || $subObj->name === 'Matematikë') ? 4 : 2
                        ]
                    ]);

                    // 7. SHTIMI I TIMETABLE SLOTS ME KONTROLL TË DYFISHTË
                    $foundSlot = false;
                    
                    // Kërkojmë në mënyrë sekuenciale një slot të lirë që i konvenon edhe klasës edhe profesorit
                    foreach ($days as $day) {
                        for ($slotNumber = 1; $slotNumber <= 6; $slotNumber++) {
                            
                            $tKey = "{$teacherUser->id}-{$day}-{$slotNumber}";
                            $cKey = "{$classObj->id}-{$day}-{$slotNumber}";

                            // NËSE sloti është i lirë edhe për profesorin EDHE për klasën
                            if (!isset($teacherSchedules[$tKey]) && !isset($classSchedules[$cKey])) {
                                
                                // Bëjmë bllokimin e sloteve
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

                                $foundSlot = true;
                                break 2; // Dil nga dy ciklet (for dhe foreach e ditëve) dhe kalon te lënda tjetër
                            }
                        }
                    }
                }
            }
        }

        // 8. Studentët
        $studentNames = [
            ['first' => 'Ahmed', 'last' => 'Hoxha', 'class' => '12/2', 'email' => 'student1@medrese.edu'],
            ['first' => 'Fatmir', 'last' => 'Krasniqi', 'class' => '12/2', 'email' => 'student2@medrese.edu'],
            ['first' => 'Yll', 'last' => 'Berisha', 'class' => '10/1', 'email' => 'student3@medrese.edu'],
            ['first' => 'Blerim', 'last' => 'Gashi', 'class' => '11/3', 'email' => 'student4@medrese.edu'],
        ];

        foreach ($studentNames as $idx => $sData) {
            $studentUser = User::updateOrCreate(
                ['email' => $sData['email']], 
                ['name' => $sData['first'] . ' ' . $sData['last'], 'password' => Hash::make('demo123'), 'role' => 'student']
            );

            Student::updateOrCreate(
                ['student_id' => 'STD-2025-000' . ($idx + 1)], 
                [
                    'first_name' => $sData['first'],
                    'last_name' => $sData['last'],
                    'parent_name' => 'Ali',
                    'parent_phone' => '+3834411111' . $idx,
                    'municipality' => 'Prishtinë',
                    'class_id' => $classes[$sData['class']]->id,
                    'type' => 'Regular',
                    'status' => 'Active',
                    'user_id' => $studentUser->id
                ]
            );
        }
    }
}