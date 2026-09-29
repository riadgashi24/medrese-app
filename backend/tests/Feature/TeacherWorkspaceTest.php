<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeacherWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $year = AcademicYear::create(['label' => '2026-2027', 'is_active' => true]);
        $class = ClassModel::create(['name' => '10/1', 'academic_year_id' => $year->id]);
        $otherClass = ClassModel::create(['name' => '10/2', 'academic_year_id' => $year->id]);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'student']);
        $student = Student::create(['student_id' => 'TEACHER-1', 'first_name' => 'Nxënës', 'last_name' => 'Test', 'municipality' => 'Prishtinë', 'parent_name' => 'Prind', 'parent_phone' => '000', 'class_id' => $class->id, 'user_id' => $pupil->id, 'status' => 'Active', 'type' => 'Regular']);
        $subject = Subject::create(['name' => 'Matematikë', 'category' => 'Shkenca', 'level' => 10]);
        $otherSubject = Subject::create(['name' => 'Fizikë', 'category' => 'Shkenca', 'level' => 10]);
        $class->subjects()->attach($subject->id, ['teacher_user_id' => $teacher->id, 'weekly_hours' => 3]);
        $class->subjects()->attach($otherSubject->id, ['teacher_user_id' => $otherTeacher->id, 'weekly_hours' => 2]);
        $otherClass->subjects()->attach($subject->id, ['teacher_user_id' => $otherTeacher->id, 'weekly_hours' => 3]);
        $url = "/api/v1/teacher/workspace/classes/{$class->id}/subjects/{$subject->id}";
        Sanctum::actingAs($teacher);

        return compact('year', 'class', 'otherClass', 'teacher', 'otherTeacher', 'pupil', 'student', 'subject', 'otherSubject', 'url');
    }

    public function test_classes_and_courses_are_scoped_to_assigned_teacher(): void
    {
        extract($this->fixture());
        $this->getJson('/api/v1/teacher/workspace')->assertOk()->assertJsonCount(1, 'data.classes')->assertJsonCount(1, 'data.classes.0.subjects')->assertJsonPath('data.classes.0.subjects.0.id', $subject->id);
        $this->getJson('/api/v1/classes')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/classes/'.$otherClass->id)->assertForbidden();
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data.students')->assertJsonCount(5, 'data.periods');
        $this->getJson("/api/v1/teacher/workspace/classes/{$class->id}/subjects/{$otherSubject->id}")->assertForbidden();
        Sanctum::actingAs($otherTeacher);
        $this->getJson($url)->assertForbidden();
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/teacher/workspace')->assertForbidden();
        $this->postJson($url.'/publications', ['kind' => 'announcement'])->assertForbidden();
    }

    public function test_multiple_subjects_and_inactive_year_are_handled(): void
    {
        extract($this->fixture());
        $class->subjects()->updateExistingPivot($otherSubject->id, ['teacher_user_id' => $teacher->id]);
        $this->getJson('/api/v1/teacher/workspace')->assertJsonCount(2, 'data.classes.0.subjects');
        $year->update(['is_active' => false]);
        $this->getJson('/api/v1/teacher/workspace')->assertJsonCount(0, 'data.classes');
        $this->getJson($url)->assertForbidden();
        $this->putJson($url.'/grades', ['student_id' => $student->id, 'period' => 1, 'grade' => 5])->assertForbidden();
    }

    public function test_period_grade_is_unique_editable_and_visible_to_student(): void
    {
        extract($this->fixture());
        $payload = ['student_id' => $student->id, 'period' => 1, 'grade' => 3];
        $this->putJson($url.'/grades', $payload)->assertOk();
        $this->putJson($url.'/grades', [...$payload, 'grade' => 5])->assertOk();
        $this->assertDatabaseCount('period_grades', 1);
        $this->putJson($url.'/grades', [...$payload, 'period' => 2, 'grade' => 4])->assertOk();
        $this->putJson($url.'/grades', [...$payload, 'grade' => 6])->assertUnprocessable();
        $this->putJson($url.'/grades', [...$payload, 'period' => 6])->assertUnprocessable();
        $this->putJson($url.'/grades', [...$payload, 'student_id' => 9999])->assertUnprocessable();
        Sanctum::actingAs($otherTeacher);
        $this->putJson($url.'/grades', $payload)->assertForbidden();
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/student/grades')->assertOk()->assertJsonPath('data.0.period_grades.0.grade', 5)->assertJsonPath('data.0.period_average', 4.5);
        $this->getJson('/api/v1/student/notifications')->assertOk()->assertJsonFragment(['type' => 'period_grade']);
    }

    public function test_announcements_and_assignments_reach_students_and_assignments_can_be_closed(): void
    {
        extract($this->fixture());
        $this->postJson($url.'/publications', ['kind' => 'announcement', 'title' => 'Provimi', 'description' => 'Kapitulli 1', 'date' => '2026-10-15'])->assertCreated();
        $this->postJson($url.'/publications', ['kind' => 'announcement', 'title' => 'Kujtesë', 'description' => 'Sillni librat.'])->assertCreated();
        $payload = ['kind' => 'assignment', 'title' => 'Ushtrime', 'description' => 'Faqja 12', 'date' => '2026-10-10'];
        $assignmentId = $this->postJson($url.'/publications', $payload)->assertCreated()->json('data.id');
        $this->postJson($url.'/publications', [...$payload, 'date' => null])->assertUnprocessable();
        $this->patchJson($url.'/assignments/'.$assignmentId, ['completed' => true])->assertOk();
        $other = Assignment::create(['class_id' => $otherClass->id, 'subject_id' => $subject->id, 'title' => 'Private', 'due_date' => '2026-10-10']);
        $this->patchJson($url.'/assignments/'.$other->id, ['completed' => true])->assertNotFound();
        Sanctum::actingAs($pupil);
        $response = $this->getJson('/api/v1/student/portal')->assertOk()->assertJsonCount(2, 'data.entries')->assertJsonCount(1, 'data.assignments');
        $this->assertNotNull($response->json('data.assignments.0.completed_at'));
        $this->assertSame('2026-10-15', collect($response->json('data.entries'))->firstWhere('title', 'Provimi')['starts_on']);
        $this->getJson('/api/v1/student/notifications')->assertJsonFragment(['path' => '/student/announcements']);
    }

    public function test_lesson_attendance_is_scoped_complete_and_correctable(): void
    {
        extract($this->fixture());
        $payload = ['title' => 'Ekuacionet', 'lesson_date' => now()->toDateString(), 'slot_number' => 1, 'attendance' => [['student_id' => $student->id, 'status' => 'Absent']]];
        $lessonId = $this->postJson($url.'/lessons', $payload)->assertCreated()->json('data.id');
        $this->postJson($url.'/lessons', $payload)->assertUnprocessable();
        $this->postJson($url.'/lessons', [...$payload, 'lesson_date' => now()->addDay()->toDateString()])->assertUnprocessable();
        $this->postJson($url.'/lessons', [...$payload, 'slot_number' => 2, 'attendance' => [['student_id' => 999, 'status' => 'Present']]])->assertUnprocessable();
        $this->postJson($url.'/lessons', [...$payload, 'slot_number' => 2, 'attendance' => []])->assertUnprocessable();
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/student/attendance')->assertOk()->assertJsonPath('data.lesson_records.0.title', 'Ekuacionet')->assertJsonPath('data.total_absences', 1);
        $this->getJson('/api/v1/student/portal')->assertJsonFragment(['title' => 'Ekuacionet']);
        $this->getJson('/api/v1/student/notifications')->assertJsonFragment(['type' => 'lesson_attendance']);
        Sanctum::actingAs($otherTeacher);
        $this->putJson($url.'/lessons/'.$lessonId, $payload)->assertForbidden();
        Sanctum::actingAs($teacher);
        $this->putJson($url.'/lessons/'.$lessonId, [...$payload, 'attendance' => [['student_id' => $student->id, 'status' => 'Late']]])->assertOk();
        $this->assertDatabaseCount('lesson_sessions', 1);
        $this->assertDatabaseCount('portal_entries', 1);
        Sanctum::actingAs($pupil);
        $this->getJson('/api/v1/student/attendance')->assertJsonPath('data.total_absences', 0)->assertJsonPath('data.total_late', 1);
    }

    public function test_schedule_uses_numeric_weekday_and_only_teachers_slots(): void
    {
        extract($this->fixture());
        foreach ([[$teacher, $class], [$otherTeacher, $otherClass]] as [$person, $group]) {
            TimetableSlot::create(['academic_year_id' => $year->id, 'class_id' => $group->id, 'subject_id' => $subject->id, 'teacher_user_id' => $person->id, 'day_of_week' => now()->dayOfWeekIso, 'slot_number' => 1, 'start_time' => '08:00', 'end_time' => '08:45']);
        }
        $this->getJson('/api/v1/teacher/workspace')->assertOk()->assertJsonCount(1, 'data.schedule')->assertJsonPath('data.schedule.0.class.name', '10/1');
        $this->getJson('/api/v1/teacher/schedule')->assertOk()->assertJsonCount(1, 'data')->assertJsonCount(1, 'data.0.slots');
        $this->getJson('/api/v1/teacher/today')->assertOk()->assertJsonCount(1, 'data');
    }
}
