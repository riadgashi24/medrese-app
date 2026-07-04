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
        // Create users for each role
        $director = User::updateOrCreate([
            'email' => 'director@medrese.edu',
        ], [
            'name' => 'Director User',
            'password' => Hash::make('demo123'),
            'role' => 'director',
        ]);

        $secretary = User::updateOrCreate([
            'email' => 'secretary@medrese.edu',
        ], [
            'name' => 'Secretary User',
            'password' => Hash::make('demo123'),
            'role' => 'secretary',
        ]);

        $cashier = User::updateOrCreate([
            'email' => 'cashier@medrese.edu',
        ], [
            'name' => 'Cashier User',
            'password' => Hash::make('demo123'),
            'role' => 'cashier',
        ]);

        $teacher = User::updateOrCreate([
            'email' => 'teacher@medrese.edu',
        ], [
            'name' => 'Teacher User',
            'password' => Hash::make('demo123'),
            'role' => 'teacher',
        ]);

        $educator = User::updateOrCreate([
            'email' => 'educator@medrese.edu',
        ], [
            'name' => 'Educator User',
            'password' => Hash::make('demo123'),
            'role' => 'educator',
        ]);

        $studentUser = User::updateOrCreate([
            'email' => 'student@medrese.edu',
        ], [
            'name' => 'Student User',
            'password' => Hash::make('demo123'),
            'role' => 'student',
        ]);

        $boardingUser = User::updateOrCreate([
            'email' => 'boarding@medrese.edu',
        ], [
            'name' => 'Boarding User',
            'password' => Hash::make('demo123'),
            'role' => 'boarding',
        ]);

        $staffSeedData = [
            [
                'email' => 'director2@medrese.edu',
                'name' => 'Ardian Hoxha',
                'first_name' => 'Ardian',
                'last_name' => 'Hoxha',
                'role' => 'director',
                'position' => 'Drejtor',
                'department' => 'Menaxhimi',
                'gender' => 'Male',
            ],
            [
                'email' => 'secretary2@medrese.edu',
                'name' => 'Linda Berisha',
                'first_name' => 'Linda',
                'last_name' => 'Berisha',
                'role' => 'secretary',
                'position' => 'Sekretar',
                'department' => 'Sekretaria',
                'gender' => 'Female',
            ],
            [
                'email' => 'cashier2@medrese.edu',
                'name' => 'Blerim Krasniqi',
                'first_name' => 'Blerim',
                'last_name' => 'Krasniqi',
                'role' => 'cashier',
                'position' => 'Arkatar',
                'department' => 'Financa',
                'gender' => 'Male',
            ],
            [
                'email' => 'teacher2@medrese.edu',
                'name' => 'Enes Gashi',
                'first_name' => 'Enes',
                'last_name' => 'Gashi',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Matematika',
                'gender' => 'Male',
            ],
            [
                'email' => 'teacher3@medrese.edu',
                'name' => 'Drenusha Deliu',
                'first_name' => 'Drenusha',
                'last_name' => 'Deliu',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Gjuha Shqipe',
                'gender' => 'Female',
            ],
            [
                'email' => 'teacher4@medrese.edu',
                'name' => 'Hamdi Mustafa',
                'first_name' => 'Hamdi',
                'last_name' => 'Mustafa',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Biologji',
                'gender' => 'Male',
            ],
            [
                'email' => 'teacher5@medrese.edu',
                'name' => 'Amina Salihu',
                'first_name' => 'Amina',
                'last_name' => 'Salihu',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Gjuha Angleze',
                'gender' => 'Female',
            ],
            [
                'email' => 'teacher6@medrese.edu',
                'name' => 'Naim Hajrizi',
                'first_name' => 'Naim',
                'last_name' => 'Hajrizi',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Fizikë',
                'gender' => 'Male',
            ],
            [
                'email' => 'teacher7@medrese.edu',
                'name' => 'Lejla Ahmeti',
                'first_name' => 'Lejla',
                'last_name' => 'Ahmeti',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Histori',
                'gender' => 'Female',
            ],
            [
                'email' => 'teacher8@medrese.edu',
                'name' => 'Besnik Morina',
                'first_name' => 'Besnik',
                'last_name' => 'Morina',
                'role' => 'teacher',
                'position' => 'Profesor',
                'department' => 'Shkenca Kompjuterike',
                'gender' => 'Male',
            ],
        ];

        foreach ($staffSeedData as $staffData) {
            $user = User::updateOrCreate([
                'email' => $staffData['email'],
            ], [
                'name' => $staffData['name'],
                'password' => Hash::make('demo123'),
                'role' => $staffData['role'],
            ]);

            Staff::updateOrCreate([
                'user_id' => $user->id,
            ], [
                'first_name' => $staffData['first_name'],
                'last_name' => $staffData['last_name'],
                'email' => $user->email,
                'position' => $staffData['position'],
                'department' => $staffData['department'],
                'gender' => $staffData['gender'],
                'status' => 'Active',
                'hire_date' => now()->subYears(2)->toDateString(),
            ]);
        }

        // Academic Year
        $academicYear = AcademicYear::updateOrCreate([
            'label' => '2025-2026',
        ], [
            'is_active' => true,
        ]);

        // Classes
        $class10A = ClassModel::updateOrCreate([
            'name' => '10A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ], [
            'name' => '10A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ]);

        $class10B = ClassModel::updateOrCreate([
            'name' => '10B',
            'section' => 'B',
            'academic_year_id' => $academicYear->id,
        ], [
            'name' => '10B',
            'section' => 'B',
            'academic_year_id' => $academicYear->id,
        ]);

        $class11A = ClassModel::updateOrCreate([
            'name' => '11A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ], [
            'name' => '11A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ]);

        // Subjects
        $math = Subject::firstOrCreate(['name' => 'Mathematics']);
        $arabic = Subject::firstOrCreate(['name' => 'Arabic']);
        $english = Subject::firstOrCreate(['name' => 'English']);
        $islamic = Subject::firstOrCreate(['name' => 'Islamic Studies']);
        $science = Subject::firstOrCreate(['name' => 'Science']);

        // Students
        $student1 = Student::updateOrCreate([
            'student_id' => 'STD-2025-0001',
        ], [
            'first_name' => 'Ahmed',
            'last_name' => 'Hoxha',
            'parent_name' => 'Ali Hoxha',
            'parent_phone' => '+38344111111',
            'parent_phone_secondary' => null,
            'municipality' => 'Prishtinë',
            'class_id' => $class10A->id,
            'type' => 'Regular',
            'status' => 'Active',
            'user_id' => $studentUser->id,
        ]);

        $student2 = Student::updateOrCreate([
            'student_id' => 'STD-2025-0002',
        ], [
            'first_name' => 'Fatima',
            'last_name' => 'Krasniqi',
            'parent_name' => 'Ahmed Krasniqi',
            'parent_phone' => '+38344222222',
            'parent_phone_secondary' => null,
            'municipality' => 'Prizren',
            'class_id' => $class10A->id,
            'type' => 'Boarding',
            'status' => 'Active',
            'user_id' => $boardingUser->id,
        ]);

        $student3 = Student::updateOrCreate([
            'student_id' => 'STD-2025-0003',
        ], [
            'first_name' => 'Mohamed',
            'last_name' => 'Berisha',
            'parent_name' => 'Ali Berisha',
            'parent_phone' => '+38344333333',
            'parent_phone_secondary' => null,
            'municipality' => 'Pejë',
            'class_id' => $class10B->id,
            'type' => 'Regular',
            'status' => 'Active',
        ]);

        $student4 = Student::updateOrCreate([
            'student_id' => 'STD-2025-0004',
        ], [
            'first_name' => 'Aisha',
            'last_name' => 'Rama',
            'parent_name' => 'Ahmed Rama',
            'parent_phone' => '+38344444444',
            'parent_phone_secondary' => null,
            'municipality' => 'Gjakovë',
            'class_id' => $class11A->id,
            'type' => 'Boarding',
            'status' => 'Active',
        ]);

        $student5 = Student::updateOrCreate([
            'student_id' => 'STD-2025-0005',
        ], [
            'first_name' => 'Omar',
            'last_name' => 'Maliqi',
            'parent_name' => 'Ali Maliqi',
            'parent_phone' => '+38344555555',
            'parent_phone_secondary' => null,
            'municipality' => 'Ferizaj',
            'class_id' => $class10A->id,
            'type' => 'Regular',
            'status' => 'Active',
        ]);

        // Timetable slots
        TimetableSlot::create([
            'day' => 'Monday',
            'start_time' => '08:00',
            'end_time' => '09:30',
            'class_id' => $class10A->id,
            'subject_id' => $math->id,
            'teacher_user_id' => $teacher->id,
            'academic_year_id' => $academicYear->id,
        ]);

        TimetableSlot::create([
            'day' => 'Monday',
            'start_time' => '10:00',
            'end_time' => '11:30',
            'class_id' => $class10A->id,
            'subject_id' => $arabic->id,
            'teacher_user_id' => $teacher->id,
            'academic_year_id' => $academicYear->id,
        ]);

        TimetableSlot::create([
            'day' => 'Tuesday',
            'start_time' => '08:00',
            'end_time' => '09:30',
            'class_id' => $class10A->id,
            'subject_id' => $english->id,
            'teacher_user_id' => $teacher->id,
            'academic_year_id' => $academicYear->id,
        ]);

        // Fee Types
        $tuition = FeeType::updateOrCreate([
            'code' => 'TUITION',
        ], [
            'name' => 'Tuition Fee',
            'default_amount' => 500.00,
            'is_recurring' => true,
        ]);

        $boardingFee = FeeType::updateOrCreate([
            'code' => 'BOARDING',
        ], [
            'name' => 'Boarding Fee',
            'default_amount' => 300.00,
            'is_recurring' => true,
        ]);

        $materials = FeeType::updateOrCreate([
            'code' => 'MATERIALS',
        ], [
            'name' => 'Materials Fee',
            'default_amount' => 50.00,
            'is_recurring' => false,
        ]);

        // Fee Structures
        FeeStructure::updateOrCreate([
            'academic_year_id' => $academicYear->id,
            'fee_type_id' => $tuition->id,
            'class_id' => null,
            'applies_to_type' => 'All',
        ], [
            'amount' => 500.00,
        ]);

        FeeStructure::updateOrCreate([
            'academic_year_id' => $academicYear->id,
            'fee_type_id' => $boardingFee->id,
            'class_id' => null,
            'applies_to_type' => 'Boarding',
        ], [
            'amount' => 300.00,
        ]);

        FeeStructure::updateOrCreate([
            'academic_year_id' => $academicYear->id,
            'fee_type_id' => $materials->id,
            'class_id' => null,
            'applies_to_type' => 'All',
        ], [
            'amount' => 50.00,
        ]);

        // Payments
        Payment::updateOrCreate([
            'student_id' => $student1->id,
            'fee_type_id' => $tuition->id,
            'amount' => 500.00,
            'method' => 'Cash',
            'status' => 'Completed',
            'paid_at' => now()->subDays(30)->toDateTimeString(),
            'created_by_user_id' => $cashier->id,
        ], []);

        Payment::updateOrCreate([
            'student_id' => $student2->id,
            'fee_type_id' => $tuition->id,
            'amount' => 300.00,
            'method' => 'Transfer',
            'status' => 'Completed',
            'paid_at' => now()->subDays(20)->toDateTimeString(),
            'created_by_user_id' => $cashier->id,
        ], []);

        // Invoices
        Invoice::updateOrCreate([
            'invoice_no' => 'INV-2025-0001',
        ], [
            'student_id' => $student3->id,
            'period_start' => now()->startOfYear(),
            'period_end' => now()->endOfYear(),
            'total_amount' => 550.00,
            'status' => 'Issued',
            'issued_at' => now()->subDays(10),
            'created_by_user_id' => $cashier->id,
        ]);

        // Attendance
        AttendanceRecord::create([
            'class_id' => $class10A->id,
            'date' => now()->subDay(),
            'kind' => 'Regular',
            'student_id' => $student1->id,
            'status' => 'Present',
            'recorded_by_user_id' => $teacher->id,
        ]);

        AttendanceRecord::create([
            'class_id' => $class10A->id,
            'date' => now()->subDay(),
            'kind' => 'Regular',
            'student_id' => $student2->id,
            'status' => 'Present',
            'recorded_by_user_id' => $teacher->id,
        ]);

        AttendanceRecord::create([
            'class_id' => $class10A->id,
            'date' => now()->subDay(),
            'kind' => 'Regular',
            'student_id' => $student5->id,
            'status' => 'Absent',
            'recorded_by_user_id' => $teacher->id,
        ]);

        // Study hours
        StudyHour::create([
            'student_id' => $student2->id,
            'date' => now()->subDay(),
            'hours' => 2.5,
            'recorded_by_user_id' => $educator->id,
        ]);

        // Dormitory
        $room1 = DormRoom::create([
            'code' => 'Room 101',
            'dorm_block' => 'Block A',
            'capacity' => 4,
        ]);

        $room2 = DormRoom::create([
            'code' => 'Room 102',
            'dorm_block' => 'Block A',
            'capacity' => 4,
        ]);

        DormAssignment::create([
            'student_id' => $student2->id,
            'dorm_room_id' => $room1->id,
            'assigned_from' => now()->startOfYear(),
            'created_by_user_id' => $educator->id,
        ]);

        DormAssignment::create([
            'student_id' => $student4->id,
            'dorm_room_id' => $room2->id,
            'assigned_from' => now()->startOfYear(),
            'created_by_user_id' => $educator->id,
        ]);

        DormInspection::create([
            'dorm_room_id' => $room1->id,
            'inspection_date' => now()->subDays(3),
            'score' => 85.5,
            'note' => 'Good condition, minor tidiness needed.',
            'created_by_user_id' => $educator->id,
        ]);

        // Discipline
        $minor = DisciplineCategory::create(['name' => 'Minor']);
        $moderate = DisciplineCategory::create(['name' => 'Moderate']);
        $positive = DisciplineCategory::create(['name' => 'Positive']);

        DisciplineRecord::create([
            'student_id' => $student5->id,
            'category_id' => $minor->id,
            'description' => 'Late to class',
            'location' => 'Classroom 10A',
            'discipline_date' => now()->subDays(5),
            'created_by_user_id' => $teacher->id,
        ]);

        // Announcements
        Announcement::create([
            'title' => 'Welcome to Academic Year 2025-2026',
            'body' => 'We are excited to welcome all students to the new academic year.',
            'priority' => 'high',
            'author_user_id' => $director->id,
            'published_at' => now()->subDays(7),
        ]);

        Announcement::create([
            'title' => 'Parent-Teacher Meeting',
            'body' => 'The annual parent-teacher meeting will be held next week.',
            'priority' => 'normal',
            'author_user_id' => $secretary->id,
            'published_at' => now()->subDays(3),
        ]);

        // Documents
        $doc1 = Document::create([
            'title' => 'Student Handbook 2025',
            'description' => 'Official student handbook for the academic year.',
            'file_url' => '/documents/handbook-2025.pdf',
            'uploaded_by_user_id' => $secretary->id,
            'visibility' => 'All',
        ]);

        $doc2 = Document::create([
            'title' => 'Boarding Rules',
            'description' => 'Rules and regulations for boarding students.',
            'file_url' => '/documents/boarding-rules.pdf',
            'uploaded_by_user_id' => $educator->id,
            'visibility' => 'Boarding',
        ]);

        StudentDocument::create([
            'student_id' => $student1->id,
            'document_id' => $doc1->id,
            'issued_at' => now()->subDays(30),
        ]);

        StudentDocument::create([
            'student_id' => $student2->id,
            'document_id' => $doc1->id,
            'issued_at' => now()->subDays(30),
        ]);

        StudentDocument::create([
            'student_id' => $student2->id,
            'document_id' => $doc2->id,
            'issued_at' => now()->subDays(30),
        ]);

        // Extracurricular
        $football = ExtracurricularActivity::create([
            'name' => 'Football Club',
            'description' => 'School football team',
            'capacity' => 20,
            'enrolled' => 12,
            'fee' => 20.00,
        ]);

        $chess = ExtracurricularActivity::create([
            'name' => 'Chess Club',
            'description' => 'Chess enthusiasts club',
            'capacity' => 15,
            'enrolled' => 8,
            'fee' => 10.00,
        ]);

        // Assignments
        Assignment::create([
            'title' => 'Algebra Homework 1',
            'description' => 'Solve equations 1-20 on page 45',
            'due_date' => now()->addDays(7),
            'class_id' => $class10A->id,
            'subject_id' => $math->id,
        ]);

        Assignment::create([
            'title' => 'Arabic Essay',
            'description' => 'Write a 500-word essay on Islamic history',
            'due_date' => now()->addDays(14),
            'class_id' => $class10A->id,
            'subject_id' => $arabic->id,
        ]);
    }
}
