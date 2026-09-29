<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ActivityEnrollment;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\Document;
use App\Models\ExtracurricularActivity;
use App\Models\PortalEntry;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPortalTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(string $role = 'student'): array
    {
        $user = User::factory()->create(['role' => $role]);
        $year = AcademicYear::create(['label' => '2026-2027', 'is_active' => true]);
        $class = ClassModel::create(['name' => '10A', 'section' => 'A', 'academic_year_id' => $year->id]);
        $student = Student::create(['student_id' => 'PORTAL-1', 'first_name' => 'Test', 'last_name' => 'Student', 'municipality' => 'Prishtinë', 'parent_name' => 'Parent', 'parent_phone' => '000', 'type' => 'Regular', 'status' => 'Active', 'class_id' => $class->id, 'user_id' => $user->id]);

        return [$user, $student, $class];
    }

    public function test_portal_scopes_classes_activities_documents_and_schedule(): void
    {
        [$user, $student, $class] = $this->fixture('boarding');
        $other = ClassModel::create(['name' => '10B', 'section' => 'B', 'academic_year_id' => $class->academic_year_id]);
        $activity = ExtracurricularActivity::create(['name' => 'Matematikë']);
        $base = ['kind' => 'group', 'title' => 'Grupi', 'author_user_id' => $user->id];
        $global = PortalEntry::create($base);
        $restricted = PortalEntry::create([...$base, 'class_id' => $class->id, 'activity_id' => $activity->id]);
        PortalEntry::create([...$base, 'class_id' => $other->id]);
        $subject = Subject::create(['name' => 'Matematikë', 'category' => 'Science', 'level' => 10]);
        foreach ([$class, $other] as $c) {
            Assignment::create(['title' => 'Detyrë', 'class_id' => $c->id, 'subject_id' => $subject->id, 'due_date' => '2026-10-01']);
            TimetableSlot::create(['day_of_week' => 1, 'slot_number' => $c->id, 'start_time' => '08:00', 'end_time' => '08:45', 'class_id' => $c->id, 'subject_id' => $subject->id, 'teacher_user_id' => $user->id, 'academic_year_id' => $class->academic_year_id]);
        }
        Document::create(['title' => 'Staff only', 'file_url' => '/private.pdf', 'visibility' => 'Staff', 'uploaded_by_user_id' => $user->id]);
        $this->actingAs($user)->getJson('/api/v1/student/portal')->assertOk()->assertJsonCount(1, 'data.entries')->assertJsonCount(1, 'data.assignments')->assertJsonCount(1, 'data.schedule')->assertJsonCount(0, 'data.materials')->assertJsonPath('data.entries.0.id', $global->id);
        ActivityEnrollment::create(['student_id' => $student->id, 'activity_id' => $activity->id]);
        $this->getJson('/api/v1/student/portal')->assertJsonCount(2, 'data.entries');
        $this->getJson('/api/v1/student/notifications')->assertJsonFragment(['title' => $restricted->title]);
    }

    public function test_notifications_are_private_and_reads_persist_per_user_and_revision(): void
    {
        [$user, $student, $class] = $this->fixture();
        $entry = PortalEntry::create(['kind' => 'lesson', 'title' => 'Mësimi', 'class_id' => $class->id, 'author_user_id' => $user->id]);
        Announcement::create(['title' => 'Future', 'body' => 'Hidden', 'priority' => 'normal', 'author_user_id' => $user->id, 'published_at' => now()->addDay()]);
        $response = $this->actingAs($user)->getJson('/api/v1/student/notifications')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.read', false);
        $key = $response->json('data.0.key');
        $this->postJson('/api/v1/student/notifications/read', ['keys' => [$key, 'forged:123']])->assertOk();
        $this->getJson('/api/v1/student/notifications')->assertJsonPath('data.0.read', true);
        $this->assertDatabaseCount('portal_notification_reads', 1);
        $this->travel(2)->seconds();
        $entry->update(['title' => 'Mësimi i përditësuar']);
        $this->getJson('/api/v1/student/notifications')->assertJsonPath('data.0.read', false);
    }

    public function test_publishing_validates_links_dates_and_teacher_access(): void
    {
        [$studentUser, , $class] = $this->fixture();
        $teacher = User::factory()->create(['role' => 'teacher']);
        $subject = Subject::create(['name' => 'Matematikë', 'category' => 'Science', 'level' => 10]);
        $payload = ['kind' => 'lesson', 'title' => 'Mësimi', 'class_id' => $class->id];
        $this->actingAs($studentUser)->postJson('/api/v1/portal/entries', $payload)->assertForbidden();
        $this->actingAs($teacher)->postJson('/api/v1/portal/entries', $payload)->assertForbidden();
        $class->subjects()->attach($subject->id, ['teacher_user_id' => $teacher->id, 'weekly_hours' => 2]);
        $this->postJson('/api/v1/portal/entries', $payload)->assertCreated();
        $this->postJson('/api/v1/portal/entries', [...$payload, 'kind' => 'group', 'url' => 'https://evil.example/test'])->assertUnprocessable();
        $this->postJson('/api/v1/portal/entries', [...$payload, 'kind' => 'exam'])->assertUnprocessable();
        $this->postJson('/api/v1/portal/entries', [...$payload, 'kind' => 'assignment', 'subject_id' => $subject->id, 'starts_on' => '2026-10-01'])->assertCreated();
        $this->actingAs($studentUser)->getJson('/api/v1/student/portal')->assertJsonCount(1, 'data.assignments');
        $this->actingAs($teacher)->getJson('/api/v1/student/portal')->assertForbidden();
    }
}
