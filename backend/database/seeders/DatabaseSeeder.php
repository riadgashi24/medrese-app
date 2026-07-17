<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\DisciplineCategory;
use App\Models\DisciplineRecord;
use App\Models\Document;
use App\Models\DormAssignment;
use App\Models\DormInspection;
use App\Models\DormRoom;
use App\Models\ExtracurricularActivity;
use App\Models\FeeStructure;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudyHour;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Përdoruesit bazë të sistemit
        $director = User::updateOrCreate(['email' => 'director@medrese.edu'], ['name' => 'Drejtor', 'password' => Hash::make('demo123'), 'role' => 'director']);
        $secretary = User::updateOrCreate(['email' => 'secretary@medrese.edu'], ['name' => 'Sekretar', 'password' => Hash::make('demo123'), 'role' => 'secretary']);
        $cashier = User::updateOrCreate(['email' => 'cashier@medrese.edu'], ['name' => 'Arkatar', 'password' => Hash::make('demo123'), 'role' => 'cashier']);
        $educator = User::updateOrCreate(['email' => 'educator@medrese.edu'], ['name' => 'Edukator', 'password' => Hash::make('demo123'), 'role' => 'educator']);

        // Academic Year
        $academicYear = AcademicYear::updateOrCreate(['label' => '2025-2026'], ['is_active' => true]);

        // Klasat nga fotoja (shembuj)
        $classesData = ['12/1', '12/2', '12/3', '12/4', '11/1', '11/2', '11/3', '11/4', '11/5', '10/1', '10/2', '10/3', '10/4'];
        $classes = [];
        foreach ($classesData as $cName) {
            $classes[$cName] = ClassModel::updateOrCreate(
                ['name' => $cName, 'academic_year_id' => $academicYear->id],
                ['section' => substr($cName, -1)]
            );
        }

        // Lëndët nga fotoja
        $subjectsData = ['Kuran/Tefsir', 'Gj.turke/Hist.', 'Gj.angleze', 'Akaid', 'Histori', 'Hadith/Akaid', 'Tefsir/Shk. Kuranit', 'Fikh/Kuran/Dave', 'Kuran/Fikh/Usul', 'Gj. arabe', 'Fizikë', 'Gjeografi', 'Biologji', 'Matematikë', 'TIK', 'Psikologji/Sociologji', 'Kimi', 'Ed fizike', 'Kuran/Ahlak', 'Gj.shqipe'];
        $subjects = [];
        foreach ($subjectsData as $sName) {
            $subjects[$sName] = Subject::firstOrCreate(['name' => $sName]);
        }

        // Profesorët nga lista e fotos
        $teachersData = [
            ['name' => 'Jakup Çunaku', 'email' => 'jakup.cunaku@medrese.edu', 'subject' => 'Kuran/Tefsir'],
            ['name' => 'Shemsi Rrahimi', 'email' => 'shemsi.rrahimi@medrese.edu', 'subject' => 'Gj.turke/Hist.'],
            ['name' => 'Xh Rusinovci', 'email' => 'xh.rusinovci@medrese.edu', 'subject' => 'Gj.angleze'],
            ['name' => 'M Tërnava', 'email' => 'm.ternava@medrese.edu', 'subject' => 'Akaid'],
            ['name' => 'Samir Ahmeti', 'email' => 'samir.ahmeti@medrese.edu', 'subject' => 'Histori'],
            ['name' => 'Rrahim Aliu', 'email' => 'rrahim.aliu@medrese.edu', 'subject' => 'Hadith/Akaid'],
            ['name' => 'Adnan Simnica', 'email' => 'adnan.simnica@medrese.edu', 'subject' => 'Tefsir/Shk. Kuranit'],
            ['name' => 'Driton Arifi', 'email' => 'driton.arifi@medrese.edu', 'subject' => 'Fikh/Kuran/Dave'],
            ['name' => 'Ekrem Maqedonci', 'email' => 'ekrem.maqedonci@medrese.edu', 'subject' => 'Kuran/Fikh/Usul'],
            ['name' => 'Hysni Beka', 'email' => 'hysni.beka@medrese.edu', 'subject' => 'Gj. arabe'],
            ['name' => 'Shkelzen Hoxha', 'email' => 'shkelzen.hoxha@medrese.edu', 'subject' => 'Gj. arabe'],
            ['name' => 'Kujtim Jashanica', 'email' => 'kujtim.jashanica@medrese.edu', 'subject' => 'Gj. arabe'],
            ['name' => 'Besnik Jaha', 'email' => 'besnik.jaha@medrese.edu', 'subject' => 'Gj.shqipe'],
            ['name' => 'Xhevdet Podrimja', 'email' => 'xhevdet.podrimja@medrese.edu', 'subject' => 'Fizikë'],
        ];

        foreach ($teachersData as $t) {
            $user = User::updateOrCreate(
                ['email' => $t['email']],
                ['name' => $t['name'], 'password' => Hash::make('demo123'), 'role' => 'teacher']
            );

            Staff::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => explode(' ', $t['name'])[0],
                    'last_name' => explode(' ', $t['name'])[1] ?? '',
                    'email' => $user->email,
                    'position' => 'Profesor',
                    'department' => $t['subject'],
                    'gender' => 'Male',
                    'status' => 'Active',
                    'hire_date' => now()->subYears(3)->toDateString()
                ]
            );

            // SHTIMI I TIMETABLE SLOTS (Shembuj si në foto)
            if ($t['name'] === 'Jakup Çunaku') {
                // E hënë: Ora 1, 2, 3 në klasën 12/2
                for ($slot = 1; $slot <= 3; $slot++) {
                    TimetableSlot::create([
                        'day' => 'E hënë',
                        'slot_number' => $slot,
                        'class_id' => $classes['12/2']->id,
                        'subject_id' => $subjects['Kuran/Tefsir']->id,
                        'teacher_user_id' => $user->id,
                        'academic_year_id' => $academicYear->id,
                    ]);
                }
                // E martë: Ora 1, 2 në klasën 11/2, Ora 3 në 12/4
                TimetableSlot::create(['day' => 'E martë', 'slot_number' => 1, 'class_id' => $classes['11/2']->id, 'subject_id' => $subjects['Kuran/Tefsir']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
                TimetableSlot::create(['day' => 'E martë', 'slot_number' => 2, 'class_id' => $classes['11/2']->id, 'subject_id' => $subjects['Kuran/Tefsir']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
                TimetableSlot::create(['day' => 'E martë', 'slot_number' => 3, 'class_id' => $classes['12/4']->id, 'subject_id' => $subjects['Kuran/Tefsir']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
            }

            if ($t['name'] === 'Shemsi Rrahimi') {
                // E hënë: Ora 1 (10/2), Ora 2 (10/3), Ora 3 (10/1), Ora 4 (10/4)
                TimetableSlot::create(['day' => 'E hënë', 'slot_number' => 1, 'class_id' => $classes['10/2']->id, 'subject_id' => $subjects['Gj.turke/Hist.']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
                TimetableSlot::create(['day' => 'E hënë', 'slot_number' => 2, 'class_id' => $classes['10/3']->id, 'subject_id' => $subjects['Gj.turke/Hist.']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
                TimetableSlot::create(['day' => 'E hënë', 'slot_number' => 3, 'class_id' => $classes['10/1']->id, 'subject_id' => $subjects['Gj.turke/Hist.']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
                TimetableSlot::create(['day' => 'E hënë', 'slot_number' => 4, 'class_id' => $classes['10/4']->id, 'subject_id' => $subjects['Gj.turke/Hist.']->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $academicYear->id]);
            }
        }

        // Studentët (Mund t'i lini të thjeshtë)
        $studentUser = User::updateOrCreate(['email' => 'student@medrese.edu'], ['name' => 'Student User', 'password' => Hash::make('demo123'), 'role' => 'student']);
        Student::updateOrCreate(['student_id' => 'STD-2025-0001'], [
            'first_name' => 'Ahmed', 'last_name' => 'Hoxha', 'parent_name' => 'Ali', 'parent_phone' => '+38344111111',
            'municipality' => 'Prishtinë', 'class_id' => $classes['12/2']->id, 'type' => 'Regular', 'status' => 'Active', 'user_id' => $studentUser->id
        ]);
    }
}