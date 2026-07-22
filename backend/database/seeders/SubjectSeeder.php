<?php

namespace Database\Seeders;

use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            // Level 10
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

            // Level 11
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

            // Level 12
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

        foreach ($subjects as $s) {
            Subject::updateOrCreate(
                ['name' => $s['name'], 'level' => $s['level']],
                ['category' => $s['category']]
            );
        }

        // Lidhja e Klasave me Lëndët
        $defaultTeacher = User::where('role', 'teacher')->first();
        $teachers = User::where('role', 'teacher')->pluck('id', 'name');

        $classes = ClassModel::all();
        $allSubjects = Subject::all();

        foreach ($classes as $classObj) {
            $level = str_starts_with($classObj->name, '10') ? 10 : (str_starts_with($classObj->name, '11') ? 11 : 12);
            $levelSubjects = $allSubjects->where('level', $level);

            foreach ($levelSubjects as $subObj) {
                $teacherUserId = $defaultTeacher->id;

                if ((str_contains($subObj->name, 'Kuran') || str_contains($subObj->name, 'Komentimi')) && isset($teachers['Jakup Çunaku'])) {
                    $teacherUserId = $teachers['Jakup Çunaku'];
                } elseif ((str_contains($subObj->name, 'Matematikë') || str_contains($subObj->name, 'Fizikë')) && isset($teachers['Xhevdet Podrimja'])) {
                    $teacherUserId = $teachers['Xhevdet Podrimja'];
                } elseif (str_contains($subObj->name, 'arabe') && isset($teachers['Hysni Beka'])) {
                    $teacherUserId = $teachers['Hysni Beka'];
                } elseif (str_contains($subObj->name, 'Histori') && isset($teachers['Samir Ahmeti'])) {
                    $teacherUserId = $teachers['Samir Ahmeti'];
                } elseif (str_contains($subObj->name, 'amtare') && isset($teachers['Besnik Jaha'])) {
                    $teacherUserId = $teachers['Besnik Jaha'];
                }

                $classObj->subjects()->syncWithoutDetaching([
                    $subObj->id => [
                        'teacher_user_id' => $teacherUserId,
                        'weekly_hours' => ($subObj->name === 'Kuran' || $subObj->name === 'Matematikë') ? 4 : 2
                    ]
                ]);
            }
        }
    }
}