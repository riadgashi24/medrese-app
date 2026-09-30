<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Run explicitly only on a database confirmed to contain demonstration students.
class CompleteDemoStudentProfilesSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            foreach (Student::with('class.academicYear')->get() as $student) {
                $id = $student->id;
                $gender = match ($student->gender) {
                    'Female', 'F', 'Femër' => 'Female',
                    'Male', 'M', 'Mashkull' => 'Male',
                    default => in_array(mb_strtolower($student->first_name), ['arta', 'elira', 'era', 'sara', 'amina', 'ajsha', 'fatime', 'drita', 'besarta', 'leona', 'hana']) ? 'Female' : 'Male',
                };
                $year = (int) substr($student->class?->academicYear?->label ?? (string) now()->year, 0, 4);
                $level = (int) ($student->class?->name ?? 10);
                $age = in_array($level, [10, 11, 12, 13]) ? $level + 5 : 16;
                $student->update([
                    'gender' => $gender,
                    'date_of_birth' => $student->date_of_birth ?: sprintf('%04d-%02d-%02d', $year - $age, ($id % 12) + 1, ($id % 28) + 1),
                    'municipality' => $student->municipality ?: 'Prishtinë',
                    'address' => $student->address ?: 'Adresa demonstrim, nr. '.$id,
                    'parent_name' => !$student->parent_name || $student->parent_name === 'Prind' ? 'Prind Demo '.$student->last_name : $student->parent_name,
                    'parent_phone' => $student->parent_phone ?: '000'.str_pad((string) $id, 6, '0', STR_PAD_LEFT),
                    'parent_phone_secondary' => $student->parent_phone_secondary ?: '000'.str_pad((string) ($id + 1000), 6, '0', STR_PAD_LEFT),
                    'student_email' => $student->student_email ?: 'nxenes.demo.'.$id.'@example.com',
                ]);
            }
        });
        $this->command?->info('U plotësuan profilet demonstrim të '.Student::count().' nxënësve.');
    }
}
