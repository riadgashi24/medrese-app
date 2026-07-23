<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Grade;
use App\Models\ClassModel;
use Illuminate\Support\Facades\DB;

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Marrim të gjithë nxënësit që janë caktuar në një klasë
        $students = Student::whereNotNull('class_id')
            ->where('status', 'Active')
            ->get();

        if ($students->isEmpty()) {
            $this->command->warn('Nuk u gjet asnjë student me class_id për të plotësuar notat.');
            return;
        }

        $count = 0;

        foreach ($students as $student) {
            // Marrim klasën e studentit për të gjetur viti akademik dhe lëndët përkatëse
            $class = ClassModel::find($student->class_id);

            if (!$class || !$class->academic_year_id) {
                continue;
            }

            // Marrim lëndët e lidhura me këtë klasë nga tabela `class_subject`
            $subjectIds = DB::table('class_subject')
                ->where('class_model_id', $class->id)
                ->pluck('subject_id');

            foreach ($subjectIds as $subjectId) {
                // Gjenerojmë nota me mundësi më të lartë për nota kaluese (2 - 5)
                $t1 = rand(2, 5);
                $t2 = rand(2, 5);

                // Llogarisim NP me rrumbullakim (2.5 -> 3, 3.5 -> 4, etj.)
                $finalGrade = Grade::calculateFinalGrade($t1, $t2);

                Grade::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'subject_id' => $subjectId,
                        'academic_year_id' => $class->academic_year_id,
                    ],
                    [
                        'term_1_grade' => $t1,
                        'term_2_grade' => $t2,
                        'final_grade' => $finalGrade,
                        'is_final_overridden' => false,
                    ]
                );

                $count++;
            }
        }

        $this->command->info("U regjistruan me sukses {$count} nota në bazën e të dhënave!");
    }
}