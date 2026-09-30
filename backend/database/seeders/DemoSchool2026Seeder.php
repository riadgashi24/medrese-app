<?php

namespace Database\Seeders;

use App\Models\{AcademicYear, ClassModel, Staff, Student, StudentAcademicEnrollment};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, File};

// Explicit one-time demo reset, never included in DatabaseSeeder.
class DemoSchool2026Seeder extends Seeder
{
    public function run(): void
    {
        $backup = [];
        foreach (DB::getSchemaBuilder()->getTableListing() as $table) $backup[$table] = DB::table($table)->get();
        $directory = storage_path('app/private/backups');
        File::ensureDirectoryExists($directory);
        $path = $directory.'/before-demo-2026-'.now()->format('Ymd-His').'.json';
        File::put($path, json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        DB::transaction(function () {
            $year = AcademicYear::whereIn('label', ['2026-2027', '2026/2027', '2026/27'])->firstOrFail();
            // References use stable staff IDs by matching the previous demo names.
            $rows = [
                ['Jakup Çunaku','Jakup Çunaku','Kuran dhe Hadith','Male','20'],
                ['Shemsi Rrahimi','Shemsi Rrahimi','Gjuhë turke','Male','10'],
                ['Xh Rusinovci','Xh Rusinovci','Gjuhë angleze','Male','20'],
                ['M Tërnava','M Tërnava','Akaid','Male','20+1'],
                ['Samir Ahmeti','Samir Ahmeti','Histori','Male','20+1'],
                ['Rrahim Aliu','Rrahim Aliu','Hadith, Histori','Male','20+1'],
                ['Adnan Simnica','Adnan Simnica','Shkencat e Kuranit, Komentimi','Male','21+1'],
                ['Driton Arifi','Driton Arifi','Fikh, Usul','Male','20+1'],
                ['Muhamed Stublla','Muhamed Stublla','Kuran, Fikh, Usul','Male','21+1'],
                ['Shkelzen Hoxha','Shkelzen Hoxha','Gjuhë arabe','Male','21+1'],
                ['Kujtim Jashanica','Kujtim Jashanica','Gjuhë arabe, Etikë','Male','20+1'],
                ['Besnik Jaha','Besnik Jaha','Gjuhë shqipe','Male','12+1'],
                ['Safet Avdiu','Safet Avdiu','Gjeografi','Male','4'],
                ['Nexhat Berisha','Nexhat Berisha','Biologji','Male','4'],
                ['Dëfrim Brajshori','Dëfrim Brajshori','Matematikë','Male','14'],
                ['Islam Sejdiu','Islam Sejdiu','TIK','Male','12'],
                ['Adem Sahiti','Adem Sahiti','Psikologji, Sociologji','Male','8'],
                ['Valon Brajshori','Valon Brajshori','Edukatë fizike','Male','6'],
                ['Hatixhe Sadriu','Hatixhe Jashanica','Fikh, Kuran','Female','20+1'],
                ['Valbona Asllani','Valbona Asllani','Kuran, Etikë','Female','20+1'],
                ['Shaha Memishi','Shaha Memishi','Gjuhë shqipe','Female','27'],
                ['Violina Asllani','Saranda Kamberi','Matematikë','Female','16+1'],
                ['Liriana Gërvalla','Liriana Gërvalla','Psikologji, Sociologji','Female','10'],
                ['Granita Zenuni','Granita Zenuni','Fizikë','Female','4'],
                ['Erblina Krasniqi','Samire Dragusha','TIK','Female','9'],
                ['Shkurte Gashi','Shkurte Gashi','Biologji','Female','4'],
                ['Nita Pireva','Shpresa Zeqaj','Gjuhë angleze','Female','6'],
                ['Zejnepe Abdyli','Zejnepe Abdyli','Gjeografi','Female','4'],
                ['Florina Sefa','Sumeje Hashani','Etikë','Female','11+1'],
                ['Xhevdet Podrimja','Antigona Krasniqi','Fizikë','Female','4'],
                ['Kosovare Jashari','Kosovare Jashari','Kimi','Female','8'],
            ];
            $staffMap = [];
            foreach ($rows as [$old, $name, $department, $gender, $hours]) {
                [$first, $last] = explode(' ', $old, 2);
                [$newFirst, $newLast] = explode(' ', $name, 2);
                $staff = Staff::where('first_name', $first)->where('last_name', $last)->first()
                    ?? Staff::where('first_name', $newFirst)->where('last_name', $newLast)->firstOrFail();
                $staff->update(['first_name' => $newFirst, 'last_name' => $newLast, 'department' => $department, 'gender' => $gender, 'role' => 'teacher', 'position' => $gender === 'Female' ? 'Profesoreshë' : 'Profesor', 'status' => 'Active', 'notes' => 'Orët sipas referencës 2026/27: '.$hours]);
                $staff->user?->update(['name' => $name]);
                $staffMap[$name] = $staff;
            }
            // Teachers absent from the new reference remain available as inactive records.
            foreach (['Hysni Beka' => 'Shkelzen Hoxha', 'Armend Qafleshi' => 'Kosovare Jashari'] as $old => $replacement) {
                [$first, $last] = explode(' ', $old, 2);
                $staff = Staff::where('first_name', $first)->where('last_name', $last)->first();
                if (!$staff) continue;
                $target = $staffMap[$replacement];
                DB::table('class_subject')->where('teacher_user_id', $staff->user_id)->update(['teacher_user_id' => $target->user_id]);
                ClassModel::where('homeroom_staff_id', $staff->id)->update(['homeroom_staff_id' => $target->id]);
                $staff->update(['status' => 'Inactive']);
            }
            $classes = [];
            $homerooms = ['10/1'=>'Adnan Simnica','10/2'=>'Kujtim Jashanica','10/3'=>'Saranda Kamberi','10/4'=>'Sumeje Hashani','11/1'=>'Besnik Jaha','11/2'=>'M Tërnava','11/3'=>'Shkelzen Hoxha','11/4'=>'Valbona Asllani','12/1'=>'Muhamed Stublla','12/2'=>'Rrahim Aliu','12/3'=>'Driton Arifi','12/4'=>'Hatixhe Jashanica','12/5'=>'Samir Ahmeti'];
            foreach ([10 => 4, 11 => 4, 12 => 5] as $level => $count) {
                for ($section = 1; $section <= $count; $section++) {
                    $name = "$level/$section";
                    $classes[$name] = ClassModel::firstOrCreate(['name' => $name, 'academic_year_id' => $year->id], ['section' => (string) $section, 'homeroom_staff_id' => $staffMap['Besnik Jaha']->id]);
                    $classes[$name]->update(['homeroom_staff_id' => $staffMap[$homerooms[$name]]->id]);
                }
            }
            // Move every student before deleting years: students.class_id cascades on deletion.
            foreach (Student::with(['class', 'academicEnrollments.class'])->get() as $student) {
                $enrollment = $student->academicEnrollments->firstWhere('academic_year_id', $year->id);
                $name = $enrollment?->class?->name ?? $student->class?->name ?? $student->academicEnrollments->last()?->class?->name ?? '10/1';
                $target = $classes[$name] ?? $classes['12/5'];
                $student->update(['class_id' => $target->id, 'status' => 'Active']);
                StudentAcademicEnrollment::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $year->id], ['class_id' => $target->id, 'status' => 'active']);
            }
            AcademicYear::where('id', '!=', $year->id)->delete();
            $year->forceFill(['label' => '2026-2027', 'is_active' => true, 'promoted_at' => null])->save();
            $girls = ['Amina','Elira','Sara','Hana','Ajsha','Leona','Arta','Era','Drita','Besarta','Fatime','Medina','Rina','Jona','Alisa'];
            $boys = ['Amar','Ardi','Dren','Erion','Leart','Lis','Ahmed','Blerim','Fisnik','Valon','Alban','Endrit','Lirim','Genc','Yll'];
            $surnames = ['Berisha','Krasniqi','Gashi','Hoxha','Kelmendi','Shala','Morina','Bytyqi','Jashari','Rama','Zyba','Gecaj','Sahiti','Aliu','Sejdiu'];
            foreach ($classes as $name => $class) {
                $female = in_array((int) $class->section, [3,4]) || $name === '12/5';
                for ($i = $class->students()->count(); $i < 15; $i++) {
                    Student::create(['student_id' => 'DEMO26-'.$class->id.'-'.($i + 1), 'first_name' => ($female ? $girls : $boys)[$i % 15], 'last_name' => $surnames[$i % 15], 'class_id' => $class->id, 'gender' => $female ? 'Female' : 'Male', 'municipality' => 'Prishtinë', 'parent_name' => 'Prind Demo', 'parent_phone' => '000000000', 'type' => 'Regular', 'status' => 'Active']);
                }
                foreach ($class->students()->orderBy('id')->get() as $i => $student) {
                    $student->update(['gender' => $female ? 'Female' : 'Male', ...($female ? ['first_name' => $girls[$i % 15]] : [])]);
                    $student->user?->update(['name' => $student->full_name]);
                    StudentAcademicEnrollment::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $year->id], ['class_id' => $class->id, 'status' => 'active']);
                }
            }
            foreach (['E hënë'=>'M. Tërnava / Valbona Asllani','E martë'=>'Driton Arifi / Sumeje Hashani','E mërkurë'=>'Samir Ahmeti / Saranda Kamberi','E enjte'=>'Xh. Rusinovci / Hatixhe Jashanica','E premte'=>'Muhamed Stublla / Shaha Memishi'] as $day => $names) {
                DB::table('day_supervisors')->updateOrInsert(['academic_year_id'=>$year->id,'day'=>$day],['supervisor_names'=>$names,'updated_at'=>now(),'created_at'=>now()]);
            }
        });
        $this->call(CompleteDemoStudentProfilesSeeder::class);
        $this->command?->info('Viti 2026/27 u përgatit. Kopja rezervë: '.$path);
    }
}
