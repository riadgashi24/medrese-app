<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** Small, additive demo. Run explicitly; existing school records are preserved. */
class CompactDemoSeeder extends Seeder
{
    private function add(string $table, array $key, array $values = []): int
    {
        $existing = DB::table($table)->where($key)->value('id');
        return $existing ?? DB::table($table)->insertGetId([...$values, ...$key, 'created_at' => now(), 'updated_at' => now()]);
    }

    public function run(): void
    {
        DB::transaction(function () {
            $year = AcademicYear::where('is_active', true)->firstOrFail();
            $teacher = User::where('email', 'besnikjaha@medrese.edu')->first()
                ?? User::where('role', 'teacher')->first();
            if (! $teacher) {
                $teacher = User::where('role', 'teacher')->firstOrFail();
            }
            $class = ClassModel::where('academic_year_id', $year->id)
                ->whereHas('subjects', fn ($q) => $q->where('class_subject.teacher_user_id', $teacher->id))
                ->orderBy('id')->firstOrFail();
            $courses = $class->subjects()->wherePivot('teacher_user_id', $teacher->id)->limit(1)->get();
            $other = $class->subjects()->where('subjects.id', '!=', $courses->first()->id)->wherePivotNotNull('teacher_user_id')->first();
            if ($other) {
                $courses->push($other);
            }

            $students = collect();
            foreach (['Ardi', 'Dren', 'Erion', 'Leart', 'Amar', 'Lis'] as $i => $name) {
                $email = $i === 0 ? 'student@medrese.edu' : 'demo.nxenes'.($i + 1).'@medrese.test';
                $user = User::firstOrCreate(['email' => $email], ['name' => $name.' Demo', 'role' => 'student', 'password' => Hash::make('demo123')]);
                if ($user->role !== 'student') {
                    throw new \RuntimeException('Llogaria demo ekziston me rol tjetër.');
                }
                $student = Student::where('user_id', $user->id)->first();
                if ($student && (int) $student->class_id !== $class->id) {
                    throw new \RuntimeException('Nxënësi demo ekziston në klasë tjetër; nuk u ndryshua.');
                }
                $student ??= Student::firstOrCreate(['student_id' => 'DEMO-PORTAL-'.($i + 1)], [
                    'first_name' => $name, 'last_name' => 'Demo', 'gender' => 'Male',
                    'municipality' => 'Prishtinë', 'parent_name' => 'Prind Demo', 'parent_phone' => '000000000',
                    'class_id' => $class->id, 'user_id' => $user->id, 'type' => 'Regular', 'status' => 'Active',
                ]);
                $this->add('student_academic_enrollments', ['student_id' => $student->id, 'academic_year_id' => $year->id], ['class_id' => $class->id, 'status' => 'active']);
                $students->push($student);
            }

            foreach ($courses as $courseIndex => $subject) {
                $scope = ['class_id' => $class->id, 'subject_id' => $subject->id];
                $author = $subject->pivot->teacher_user_id;
                foreach ($students as $i => $student) {
                    foreach ([1, 2] as $period) {
                        $this->add('period_grades', ['student_id' => $student->id, 'subject_id' => $subject->id, 'academic_year_id' => $year->id, 'period' => $period], ['teacher_user_id' => $author, 'grade' => 3 + (($i + $period) % 3)]);
                    }
                }
                foreach (['Ushtrime përsëritëse', 'Përmbledhja e kapitullit', 'Punë praktike e përfunduar'] as $i => $title) {
                    $assignment = $this->add('assignments', [...$scope, 'title' => '[Demo] '.$title], [
                        'description' => 'Përgatit përgjigjet me fjalët e tua dhe shpjego një shembull nga mësimi. Të dhëna demonstrimi.',
                        'due_date' => today()->addDays($i === 2 ? -3 : 2 + $i * 3)->toDateString(),
                        'completed_at' => $i === 2 ? now()->subDays(2) : null,
                    ]);
                    if ($i === 2) {
                        $this->add('assignment_submissions', ['assignment_id' => $assignment, 'student_id' => $students->first()->id], ['status' => 'Graded', 'answer_text' => 'Përmbledhje demonstrimi me shembujt kryesorë të kapitullit.', 'grade' => 5]);
                    }
                }
                foreach (['Konceptet kryesore të kapitullit', 'Zbatimi përmes shembujve'] as $i => $title) {
                    $title = '[Demo] '.$title;
                    $entry = $this->add('portal_entries', [...$scope, 'kind' => 'lesson', 'title' => $title], ['description' => 'Përsëritje, diskutim dhe ushtrime të shkurtra në klasë.', 'starts_on' => today()->subWeekdays(2 - $i)->toDateString(), 'author_user_id' => $author]);
                    $session = DB::table('lesson_sessions')->where([...$scope, 'title' => $title])->value('id');
                    if (! $session) {
                        $date = today()->subWeekdays(2 - $i)->toDateString();
                        $slot = 1 + $courseIndex * 2;
                        while (DB::table('lesson_sessions')->whereDate('lesson_date', $date)->where('slot_number', $slot)->where(fn ($q) => $q->where('class_id', $class->id)->orWhere('teacher_user_id', $author))->exists()) {
                            $slot++;
                        }
                        $session = $this->add('lesson_sessions', [...$scope, 'title' => $title], ['teacher_user_id' => $author, 'portal_entry_id' => $entry, 'lesson_date' => $date, 'slot_number' => $slot]);
                    }
                    foreach ($class->students()->where('status', 'Active')->get() as $student) {
                        $status = $student->id === $students->first()->id ? ($i === 0 ? 'Absent' : 'Late') : 'Present';
                        $this->add('lesson_attendances', ['lesson_session_id' => $session, 'student_id' => $student->id], ['status' => $status]);
                    }
                }
                foreach ([['announcement', 'Konsultime para vlerësimit', 3], ['exam', 'Vlerësim i shkurtër', 7], ['material', 'Fletë pune për përsëritje', null]] as [$kind, $title, $days]) {
                    $this->add('portal_entries', [...$scope, 'kind' => $kind, 'title' => '[Demo] '.$title], [
                        'description' => 'Material dhe datë ilustruese për demonstrimin e portalit.',
                        'starts_on' => $days === null ? null : today()->addDays($days)->toDateString(),
                        'url' => $kind === 'material' ? '/demo/flete-pune.html' : null, 'author_user_id' => $author,
                    ]);
                }
            }

            $activity = $this->add('extracurricular_activities', ['name' => '[Demo] Klubi i teknologjisë'], ['description' => 'Punëtori javore me projekte të vogla.', 'capacity' => 12, 'enrolled' => 3, 'fee' => 0]);
            foreach ($students->take(3) as $student) {
                $this->add('activity_enrollments', ['activity_id' => $activity, 'student_id' => $student->id]);
            }
            foreach ([['event', 'Punëtoria e teknologjisë', 4], ['break', 'Pushim demonstrues', 10]] as [$kind, $title, $days]) {
                $this->add('portal_entries', ['class_id' => $class->id, 'kind' => $kind, 'title' => '[Demo] '.$title], ['description' => 'Ngjarje ilustruese; nuk është pjesë e kalendarit zyrtar.', 'starts_on' => today()->addDays($days)->toDateString(), 'author_user_id' => $teacher->id]);
            }
            $this->add('portal_entries', ['class_id' => $class->id, 'kind' => 'group', 'title' => '[Demo] Grupi i klasës'], ['description' => 'Këtu vendoset ftesa reale e WhatsApp nga stafi. Për demonstrim nuk është vendosur link i rremë.', 'author_user_id' => $teacher->id]);
            $this->add('announcements', ['title' => '[Demo] Mirë se vini në portalin shkollor'], ['body' => 'Kontrolloni orarin, detyrat dhe kalendarin. Ky njoftim është shembull demonstrimi.', 'priority' => 'normal', 'author_user_id' => $teacher->id, 'published_at' => now()->subHour()]);
            $document = $this->add('documents', ['title' => '[Demo] Udhëzues për përgatitjen e detyrave'], ['description' => 'Shembull materiali të përbashkët.', 'file_url' => '/demo/flete-pune.html', 'visibility' => 'Students', 'uploaded_by_user_id' => $teacher->id]);
            $this->add('student_documents', ['document_id' => $document, 'student_id' => $students->first()->id], ['issued_at' => today()->toDateString()]);
            $category = $this->add('discipline_categories', ['name' => '[Demo] Kujtesë mësimore']);
            $this->add('discipline_records', ['student_id' => $students->first()->id, 'category_id' => $category, 'description' => 'Shembull demonstrimi: sill materialet e nevojshme për orën.'], ['discipline_date' => today()->subDay()->toDateString(), 'location' => 'Klasë', 'created_by_user_id' => $teacher->id]);
            $this->command?->info('Demo: '.$class->name.'; profesor: '.$teacher->email.'; nxënës: student@medrese.edu; 6 nxënës, '.$courses->count().' lëndë.');
        });
    }
}
