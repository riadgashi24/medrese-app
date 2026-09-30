<?php

namespace Database\Seeders;

use App\Models\{AcademicYear, ClassModel, Grade, PeriodGrade};
use App\Services\HomeroomReport;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, File};

// Explicit demo data for testing certificates; not part of DatabaseSeeder.
class DemoFirstParallelGradesSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('label', '2026-2027')->where('is_active', true)->firstOrFail();
        $classes = ClassModel::with('subjects')->where('academic_year_id', $year->id)->whereIn('name', ['10/1', '11/1', '12/1'])->get();
        if ($classes->count() !== 3 || $classes->contains(fn ($c) => $c->subjects->isEmpty())) throw new \RuntimeException('Mungojnë klasat ose lëndët.');
        $report = app(HomeroomReport::class);
        $ids = $classes->flatMap(fn ($c) => $report->roster($c)->pluck('id'))->unique();
        $backup = ['students' => DB::table('students')->whereIn('id', $ids)->get()];
        foreach (['grades', 'period_grades', 'homeroom_profiles'] as $table) $backup[$table] = DB::table($table)->whereIn('student_id', $ids)->get();
        $directory = storage_path('app/private/backups');
        File::ensureDirectoryExists($directory);
        File::put($directory.'/before-demo-grades-'.now()->format('Ymd-His').'.json', json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        DB::transaction(function () use ($classes, $year, $report) {
            foreach ($classes as $class) {
                foreach ($report->roster($class)->get() as $student) {
                    $defaults = ['date_of_birth' => (2026 - ($class->level + 5)).'-05-15', 'parent_name' => 'Prind Demo', 'municipality' => 'Prishtinë'];
                    foreach ($defaults as $field => $value) if (!$student->$field) $student->$field = $value;
                    $student->save();
                    $key = ['class_id' => $class->id, 'student_id' => $student->id];
                    $existing = DB::table('homeroom_profiles')->where($key)->first();
                    $profile = $existing ? json_decode($existing->data, true) : [];
                    foreach (['birth_place' => 'Prishtinë', 'birth_country' => 'Republika e Kosovës', 'citizenship' => 'Kosovare', 'conduct' => 'Shembullore', 'register_number' => 'DEMO-2026-'.$student->id, 't1_status' => 'active', 't2_status' => 'active', 'np_status' => 'active'] as $field => $value) {
                        if (empty($profile[$field])) $profile[$field] = $value;
                    }
                    DB::table('homeroom_profiles')->updateOrInsert($key, ['data' => json_encode($profile, JSON_UNESCAPED_UNICODE), 'created_at' => $existing?->created_at ?? now(), 'updated_at' => now()]);

                    foreach ($class->subjects as $subject) {
                        $key = ['student_id' => $student->id, 'subject_id' => $subject->id, 'academic_year_id' => $year->id];
                        $base = 2 + (($student->id * 7 + $subject->id * 3) % 4);
                        $marks = [];
                        for ($period = 1; $period <= 5; $period++) {
                            $marks[] = PeriodGrade::firstOrCreate([...$key, 'period' => $period], ['grade' => min(5, $base + ($period >= 3 ? 1 : 0)), 'teacher_user_id' => $subject->pivot->teacher_user_id])->grade;
                        }
                        $grade = Grade::firstOrNew($key);
                        $grade->term_1_grade ??= (int) round(($marks[0] + $marks[1]) / 2, 0, PHP_ROUND_HALF_UP);
                        $grade->term_2_grade ??= (int) round(($marks[2] + $marks[3] + $marks[4]) / 3, 0, PHP_ROUND_HALF_UP);
                        if (!$grade->is_final_overridden || $grade->final_grade === null) {
                            $grade->final_grade = Grade::calculateFinalGrade($grade->term_1_grade, $grade->term_2_grade);
                            $grade->is_final_overridden = false;
                        }
                        $grade->save();
                    }
                }
            }
        });
        $this->command?->info('U plotësuan notat dhe të dhënat e dëftesave për 10/1, 11/1 dhe 12/1.');
    }
}
