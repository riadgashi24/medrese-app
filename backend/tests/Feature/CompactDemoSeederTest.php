<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\CompactDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CompactDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_is_small_repeatable_and_visible_to_both_roles(): void
    {
        $year = AcademicYear::create(['label' => '2026-2027', 'is_active' => true]);
        $class = ClassModel::create(['name' => '12/1', 'academic_year_id' => $year->id]);
        $teacher = User::factory()->create(['email' => 'besnikjaha@medrese.edu', 'role' => 'teacher']);
        $subject = Subject::create(['name' => 'Matematikë', 'level' => 12, 'category' => 'Shkenca']);
        $class->subjects()->attach($subject->id, ['teacher_user_id' => $teacher->id, 'weekly_hours' => 3]);
        $this->seed(CompactDemoSeeder::class);
        $before = DB::table('portal_entries')->get()->toJson();
        $this->travel(1)->days();
        $this->seed(CompactDemoSeeder::class);
        $this->assertSame($before, DB::table('portal_entries')->get()->toJson());
        $this->assertDatabaseCount('students', 6);
        $this->assertDatabaseCount('assignments', 3);
        $this->assertDatabaseCount('lesson_sessions', 2);
        $this->assertDatabaseCount('period_grades', 12);
        $this->actingAs($teacher)->getJson("/api/v1/teacher/workspace/classes/{$class->id}/subjects/{$subject->id}")
            ->assertOk()->assertJsonCount(6, 'data.students')->assertJsonCount(3, 'data.assignments')->assertJsonCount(2, 'data.lessons');
        $student = User::where('email', 'student@medrese.edu')->firstOrFail();
        $this->actingAs($student)->getJson('/api/v1/student/portal')->assertOk()->assertJsonCount(3, 'data.assignments');
        $this->getJson('/api/v1/student/notifications')->assertOk()->assertJsonFragment(['type' => 'period_grade']);
    }
}
