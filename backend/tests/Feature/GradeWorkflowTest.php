<?php

namespace Tests\Feature;

use App\Models\{AcademicYear, ClassModel, Grade, Student, Subject, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $year = AcademicYear::create(['label' => '2025-2026', 'is_active' => true]);
        $class = ClassModel::create(['name' => 'XI-1', 'academic_year_id' => $year->id]);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'student']);
        $student = Student::create(['student_id' => 'DEMO-1', 'first_name' => 'Nxënës', 'last_name' => 'Test',
            'municipality' => 'Prishtinë', 'parent_name' => 'Prind', 'parent_phone' => '000000000',
            'class_id' => $class->id, 'user_id' => $pupil->id, 'status' => 'Active', 'type' => 'Regular']);
        $subject = Subject::create(['name' => 'Matematikë', 'category' => 'Shkenca', 'level' => 11]);
        $class->subjects()->attach($subject->id, ['teacher_user_id' => $teacher->id, 'weekly_hours' => 3]);
        return compact('year', 'class', 'teacher', 'pupil', 'student', 'subject');
    }

    public function test_assigned_teacher_saves_grades_and_student_sees_only_current_year(): void
    {
        extract($this->fixture());
        Sanctum::actingAs($teacher);
        $url = "/api/v1/classes/{$class->id}/grades";
        $payload = ['student_id' => $student->id, 'subject_id' => $subject->id, 'term' => 't1', 'value' => 3];
        $this->putJson($url, $payload)->assertOk()->assertJsonPath('grade.term_1_grade', 3);
        $this->putJson($url, array_replace($payload, ['term' => 't2', 'value' => 4]))->assertOk()->assertJsonPath('grade.final_grade', 4);
        $this->getJson($url)->assertOk()->assertJsonPath('all_subjects.0.can_edit', true)
            ->assertJsonPath('students.0.overall_averages.t2', 4);
        $this->putJson($url, array_replace($payload, ['value' => 0]))->assertUnprocessable();
        $this->putJson($url, array_replace($payload, ['value' => null]))->assertOk()->assertJsonPath('grade.term_1_grade', null);
        $older = AcademicYear::create(['label' => '2024-2025']);
        Grade::create(['student_id' => $student->id, 'subject_id' => $subject->id, 'academic_year_id' => $older->id, 'final_grade' => 1]);
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/student/grades')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.final', 4);
        $this->getJson($url)->assertForbidden();
        $this->putJson($url, $payload)->assertForbidden();
    }

    public function test_grade_changes_reject_unassigned_teachers_and_mismatched_class_members(): void
    {
        extract($this->fixture());
        $url = "/api/v1/classes/{$class->id}/grades";
        $payload = ['student_id' => $student->id, 'subject_id' => $subject->id, 'term' => 'np', 'value' => 5, 'is_director_override' => true];
        Sanctum::actingAs(User::factory()->create(['role' => 'teacher']));
        $this->putJson($url, $payload)->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'secretary']));
        $this->getJson($url)->assertOk()->assertJsonPath('all_subjects.0.can_edit', false);
        $this->putJson($url, $payload)->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'director']));
        $other = ClassModel::create(['name' => 'XI-2', 'academic_year_id' => $year->id]);
        $this->putJson("/api/v1/classes/{$other->id}/grades", $payload)->assertUnprocessable();
        $this->assertDatabaseCount('grades', 0);
    }

    public function test_teacher_schedule_endpoints_return_json(): void
    {
        extract($this->fixture());
        Sanctum::actingAs($teacher);
        $this->getJson('/api/v1/teacher/schedule')->assertOk();
        $this->getJson('/api/v1/teacher/today')->assertOk();
    }

    public function test_timetable_includes_teachers_without_assignments(): void
    {
        extract($this->fixture());
        $unassigned = User::factory()->create(['role' => 'teacher']);
        $director = User::factory()->create(['role' => 'director']);
        Sanctum::actingAs($director);
        $response = $this->getJson('/api/v1/academic/timetable')->assertOk();
        $teachers = collect($response->json('data.teachers'))->keyBy('id');
        $this->assertCount(2, $teachers);
        $this->assertSame(0, $teachers[$unassigned->id]['total_hours']);
        $this->assertSame(0, $teachers[$unassigned->id]['assigned_hours']);
        $this->assertSame([], $teachers[$unassigned->id]['slots']);
        $this->assertSame(3, $teachers[$teacher->id]['total_hours']);
    }

    public function test_subject_assignments_require_matching_class_level(): void
    {
        extract($this->fixture());
        Sanctum::actingAs(User::factory()->create(['role' => 'director']));
        $tenth = ClassModel::create(['name' => '10/1', 'academic_year_id' => $year->id]);
        $payload = ['academic_year_id' => $year->id, 'subject_id' => $subject->id,
            'class_id' => $tenth->id, 'teacher_user_id' => $teacher->id, 'weekly_hours' => 2];
        $this->postJson('/api/v1/academic/subject-assignments', $payload)->assertUnprocessable();
        $this->assertDatabaseMissing('class_subject', ['class_model_id' => $tenth->id, 'subject_id' => $subject->id]);
        $this->postJson('/api/v1/academic/subject-assignments', array_replace($payload, ['class_id' => $class->id]))->assertOk();
        $options = $this->getJson('/api/v1/academic/subject-options')->assertOk();
        $levels = collect($options->json('data.classes'))->keyBy('id');
        $this->assertSame(10, $levels[$tenth->id]['level']);
        $this->assertSame(11, $levels[$class->id]['level']);
    }

    public function test_student_subjects_are_scoped_to_their_class(): void
    {
        extract($this->fixture());
        Subject::create(['name' => 'Lëndë tjetër', 'category' => 'Shkenca', 'level' => 12]);
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/academic/subjects')->assertOk()->assertJsonCount(1, 'data');
    }
}
