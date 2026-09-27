<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('medrese:check-demo', function () {
    $this->line('Kontroll vetëm për lexim; nuk ndryshon të dhënat.');
    $this->line('Vite aktive: '.\App\Models\AcademicYear::where('is_active', true)->count());
    $this->line('Nxënës aktivë: '.\App\Models\Student::where('status', 'Active')->count());
    $this->line('Nxënës pa klasë: '.\App\Models\Student::where('status', 'Active')->whereNull('class_id')->count());
    $this->line('Nxënës pa gjini: '.\App\Models\Student::whereNull('gender')->count());
    foreach (['director', 'secretary', 'cashier', 'teacher', 'educator', 'student', 'boarding'] as $role) {
        $users = \App\Models\User::where('role', $role)->get(['id', 'password']);
        $demoCount = $users->filter(fn ($u) => \Illuminate\Support\Facades\Hash::check('demo123', $u->password))->count();
        $this->line($role.': '.$users->count().' llogari; '.$demoCount.' me hyrje demo');
    }
    $invalid = \App\Models\Grade::where(function ($query) {
        foreach (['term_1_grade', 'term_2_grade', 'final_grade'] as $field) {
            $query->orWhere($field, '<', 1)->orWhere($field, '>', 5);
        }
    })->count();
    $this->line('Nota jashtë intervalit 1–5: '.$invalid);
    $this->line('Caktime lëndësh pa profesor: '.\Illuminate\Support\Facades\DB::table('class_subject')->whereNull('teacher_user_id')->count());
})->purpose('Kontrollon të dhënat demonstrative pa i ndryshuar');
