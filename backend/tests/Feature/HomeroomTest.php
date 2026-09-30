<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Grade;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HomeroomTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $year = AcademicYear::create(['label' => '2026-2027', 'is_active' => true]);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $staff = Staff::create(['user_id' => $teacher->id, 'first_name' => 'Kujdestar', 'last_name' => 'Test', 'gender' => 'Male', 'position' => 'Profesor']);
        $class = ClassModel::create(['name' => '12/1', 'academic_year_id' => $year->id, 'homeroom_staff_id' => $staff->id]);
        $subjects = collect(['Matematikë', 'Fizikë'])->map(function ($name) use ($class, $teacher) {
            $subject = Subject::create(['name' => $name, 'category' => 'Shkenca', 'level' => 12]);
            $class->subjects()->attach($subject->id, ['teacher_user_id' => $teacher->id, 'weekly_hours' => 3]);

            return $subject;
        });
        $students = collect([null, 'Female', 'Male', 'Female'])->map(fn ($gender, $i) => Student::create(['student_id' => 'H-'.$i, 'first_name' => 'Nxënës'.$i, 'last_name' => 'Test', 'gender' => $gender, 'class_id' => $class->id, 'municipality' => 'Prishtinë', 'parent_name' => 'Prind', 'parent_phone' => '000', 'status' => 'Active', 'type' => 'Regular']));
        $this->actingAs($teacher);

        return [$class, $students, $subjects, $teacher, $year];
    }

    public function test_only_homeroom_teacher_and_admin_can_access_and_archives_are_read_only(): void
    {
        [$class, $students, $subjects, $teacher, $year] = $this->fixture();
        $this->getJson('/api/v1/homeroom')->assertOk()->assertJsonCount(1, 'data');
        $other = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($other)->getJson('/api/v1/homeroom/'.$class->id)->assertNotFound();
        $this->putJson('/api/v1/homeroom/'.$class->id.'/grades', [])->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'student']))->getJson('/api/v1/homeroom')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'director']))->getJson('/api/v1/homeroom/'.$class->id)->assertOk();
        $year->update(['is_active' => false]);
        $this->actingAs($teacher)->getJson('/api/v1/homeroom/'.$class->id)->assertNotFound();
        $this->getJson('/api/v1/homeroom')->assertJsonCount(0, 'data');
        $this->putJson('/api/v1/homeroom/'.$class->id.'/grades', [])->assertForbidden();
    }

    public function test_statistics_use_all_subjects_handle_blank_first_student_failures_gender_and_withdrawal(): void
    {
        [$class, $students, $subjects] = $this->fixture();
        foreach ([1 => [4, 5], 2 => [1, 5], 3 => [5, 5]] as $i => $marks) {
            foreach ($subjects as $j => $subject) {
                Grade::create(['student_id' => $students[$i]->id, 'subject_id' => $subject->id, 'academic_year_id' => $class->academic_year_id, 'term_1_grade' => $marks[$j], 'term_2_grade' => 4, 'final_grade' => 4]);
            }
        }
        DB::table('homeroom_profiles')->insert(['class_id' => $class->id, 'student_id' => $students[3]->id, 'data' => json_encode(['t1_status' => 'withdrawn', 't2_status' => 'active', 'np_status' => 'repeating'])]);
        $r = $this->getJson('/api/v1/homeroom/'.$class->id)->assertOk();
        $r->assertJsonPath('data.periods.t1.summary.active.total', 3)->assertJsonPath('data.periods.t1.summary.ungraded.total', 1)->assertJsonPath('data.periods.t1.summary.ungraded.unknown', 1)->assertJsonPath('data.periods.t1.summary.excellent.female', 1)->assertJsonPath('data.periods.t1.summary.one_failure.male', 1)->assertJsonPath('data.periods.t2.summary.active.total', 4)->assertJsonPath('data.periods.np.summary.repeating.total', 1);
        $rows = collect($r->json('data.periods.t1.rows'))->keyBy('id');
        $this->assertNull($rows[$students[0]->id]['average']);
        $this->assertEquals(4.5, $rows[$students[1]->id]['average']);
        $this->assertEquals(1, $rows[$students[2]->id]['average']);
        $stat = collect($r->json('data.periods.t1.subjects'))->keyBy('id')[$subjects[0]->id];
        $this->assertEquals(2.5, $stat['average']);
        $this->assertEquals(3, $stat['total']);
    }

    public function test_homeroom_cannot_write_grades_even_for_own_subject(): void
    {
        [$class, $students, $subjects] = $this->fixture();
        $this->putJson('/api/v1/homeroom/'.$class->id.'/grades', ['changes' => [['student_id' => $students[0]->id, 'subject_id' => $subjects[0]->id, 'term' => 't1', 'value' => 5]]])->assertForbidden();
        $this->assertDatabaseCount('grades', 0);
    }

    public function test_months_include_march_april_may_and_zero_override_replaces_automatic(): void
    {
        [$class, $students, $subjects, $teacher] = $this->fixture();
        $sid = $students[0]->id;
        foreach (['2027-03-15', '2027-04-15', '2027-05-15', '2027-06-30'] as $date) {
            $lesson = DB::table('lesson_sessions')->insertGetId(['class_id' => $class->id, 'subject_id' => $subjects[0]->id, 'teacher_user_id' => $teacher->id, 'title' => 'Mësim', 'lesson_date' => $date, 'slot_number' => 1]);
            DB::table('lesson_attendances')->insert(['lesson_session_id' => $lesson, 'student_id' => $sid, 'status' => 'Absent']);
            DB::table('attendance_records')->insert(['class_id' => $class->id, 'student_id' => $sid, 'date' => $date, 'status' => 'Absent', 'absence_type' => 'Unexcused']);
        }
        $url = '/api/v1/homeroom/'.$class->id;
        $this->getJson($url)->assertOk()->assertJsonPath('data.periods.t2.attendance.pending.total', 4)->assertJsonPath('data.periods.t2.attendance.unexcused.total', 0);
        $this->putJson($url.'/absences', ['student_id' => $sid, 'month' => '2027-03', 'automatic' => false, 'excused' => 0, 'unexcused' => 0])->assertOk();
        $this->getJson($url)->assertJsonPath('data.periods.t2.attendance.pending.total', 3);
        $this->putJson($url.'/absences', ['student_id' => $sid, 'month' => '2027-03', 'automatic' => true])->assertOk();
        $this->getJson($url)->assertJsonPath('data.periods.t2.attendance.pending.total', 4);
        $this->putJson($url.'/absences', ['student_id' => $sid, 'month' => '2028-03', 'automatic' => true])->assertUnprocessable();
        $this->putJson($url.'/hours', ['subject_id' => $subjects[0]->id, 'term' => 't2', 'held' => null, 'missed' => 2])->assertOk();
        $hours = collect($this->getJson($url)->json('data.hours'))->keyBy('id')[$subjects[0]->id];
        $this->assertEquals(6, $hours['t2']['planned']);
        $this->assertEquals(6, $hours['np']['planned']);
    }

    public function test_settings_validate_month_boundaries_and_student_profile_is_scoped(): void
    {
        [$class, $students] = $this->fixture();
        $url = '/api/v1/homeroom/'.$class->id;
        $data = $this->getJson($url)->json('data');
        $this->putJson($url.'/settings', [...$data['settings'], 'school_name' => 'Medrese Test'])->assertOk();
        $this->putJson($url.'/settings', [...$data['settings'], 't1_start' => '2026-09-15'])->assertUnprocessable();
        $student = $data['students'][0];
        $student['gender'] = 'Male';
        $student['profile'] = ['t1_status' => 'active', 't2_status' => 'withdrawn', 'np_status' => 'withdrawn', 'parent_occupation' => 'Mësues'];
        $this->putJson($url.'/students/'.$student['id'], $student)->assertOk();
        $this->getJson($url)->assertJsonPath('data.periods.t2.summary.withdrawn.total', 1);
        $this->putJson($url.'/students/9999', $student)->assertNotFound();
    }

    public function test_certificates_require_complete_final_marks_and_personal_fields(): void
    {
        [$class, $students, $subjects, $teacher] = $this->fixture();
        $student = $students[0];
        $student->update(['date_of_birth' => '2009-05-10']);
        DB::table('homeroom_profiles')->insert(['class_id' => $class->id, 'student_id' => $student->id, 'data' => json_encode(['birth_place' => 'Prishtinë', 'birth_country' => 'Kosovë', 'citizenship' => 'Kosovare', 'conduct' => 'Shembullore', 'register_number' => '123'])]);
        foreach ($subjects as $subject) Grade::create(['student_id' => $student->id, 'subject_id' => $subject->id, 'academic_year_id' => $class->academic_year_id, 'term_1_grade' => 5, 'final_grade' => 5]);
        $url = '/api/v1/homeroom/'.$class->id.'/certificates';
        $entry = collect($this->getJson($url)->assertOk()->json('data.certificates'))->firstWhere('student.id', $student->id);
        $this->assertFalse($entry['ready']);
        Grade::where('student_id', $student->id)->update(['term_2_grade' => 5]);
        $entry = collect($this->getJson($url)->assertOk()->json('data.certificates'))->firstWhere('student.id', $student->id);
        $this->assertTrue($entry['ready']);
        $this->actingAs(User::factory()->create(['role' => 'teacher']))->getJson($url)->assertNotFound();
    }

    public function test_history_is_scoped_to_current_roster_and_cannot_be_edited(): void
    {
        [$class, $students] = $this->fixture();
        $oldYear = AcademicYear::create(['label' => '2025-2026', 'is_active' => false]);
        $old = ClassModel::create(['name' => '11/1', 'academic_year_id' => $oldYear->id]);
        DB::table('student_academic_enrollments')->insert(['student_id' => $students[0]->id, 'class_id' => $old->id, 'academic_year_id' => $oldYear->id, 'status' => 'Active']);
        $outsider = Student::create(['first_name' => 'Private', 'last_name' => 'Student', 'class_id' => $old->id, 'parent_name' => 'Prind', 'parent_phone' => '000', 'municipality' => 'Test', 'status' => 'Active', 'type' => 'Regular']);
        $url = '/api/v1/homeroom/'.$class->id.'/history';
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data');
        $this->getJson($url.'/'.$old->id)->assertOk()->assertJsonCount(1, 'data.students')->assertJsonPath('data.students.0.id', $students[0]->id)->assertJsonPath('data.class.active', false);
        $this->getJson($url.'/9999')->assertNotFound();
        $this->putJson('/api/v1/homeroom/'.$old->id.'/students/'.$outsider->id, [])->assertNotFound();
    }
}
