<?php

namespace Database\Seeders;

use App\Models\ClassModel;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $firstNames = ['Ahmed', 'Fatmir', 'Yll', 'Blerim', 'Dren', 'Arian', 'Fisnik', 'Valon', 'Alban', 'Eris', 'Blendi', 'Leart', 'Endrit', 'Lirim', 'Genc'];
        $lastNames = ['Hoxha', 'Krasniqi', 'Berisha', 'Gashi', 'Morina', 'Kastrati', 'Kelmendi', 'Shala', 'Bytyqi', 'Gecaj', 'Rama', 'Zyba', 'Lushi', 'Tahiri'];

        $classes = ClassModel::all();
        $studentCounter = 1;

        foreach ($classes as $classObj) {
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

                Student::updateOrCreate(
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

                $studentCounter++;
            }
        }
    }
}