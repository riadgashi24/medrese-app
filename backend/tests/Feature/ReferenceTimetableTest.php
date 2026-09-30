<?php

namespace Tests\Feature;

use App\Models\{AcademicYear, ClassModel, Staff, Student, Subject, TimetableSlot, User};
use App\Services\ReferenceTimetableImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReferenceTimetableTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        $year = AcademicYear::create(['label' => '2026-2027', 'is_active' => true]);
        $data = json_decode(file_get_contents(database_path('data/timetable-2026-reference.json')), true);
        foreach ($data['rows'] as $row) {
            $user = User::factory()->create(['name' => $row['teacher'], 'role' => 'teacher']);
            [$first, $last] = explode(' ', $row['teacher'], 2);
            Staff::create(['first_name' => $first, 'last_name' => $last, 'user_id' => $user->id, 'role' => 'teacher', 'gender' => 'Male', 'position' => 'Profesor', 'status' => 'Active']);
            foreach ($row['slots'] as $slot) ClassModel::firstOrCreate(['academic_year_id' => $year->id, 'name' => $slot['class']]);
        }
        return [$year, $data];
    }

    public function test_reference_import_links_every_course_and_preserves_weekly_frequencies(): void
    {
        [$year, $data] = $this->fixture();
        $service = app(ReferenceTimetableImporter::class);
        $this->assertSame(['slots' => 429, 'courses' => 184, 'activities' => 32], $service->import($year, $data));
        $service->import($year, $data);
        $this->assertDatabaseCount('timetable_slots', 429);
        $this->assertDatabaseCount('class_subject', 184);
        foreach (ClassModel::all() as $class) {
            foreach (['Kuran', 'Gjuhë arabe', 'Gjuhë amtare'] as $name) {
                $course = $class->subjects()->where('name', $name)->firstOrFail();
                $this->assertSame(3, (int) $course->pivot->weekly_hours);
                $this->assertSame(3, $class->timetableSlots()->where('subject_id', $course->id)->count());
            }
        }
        foreach (TimetableSlot::whereNotNull('subject_id')->get() as $slot) {
            $this->assertDatabaseHas('class_subject', ['class_model_id' => $slot->class_id, 'subject_id' => $slot->subject_id, 'teacher_user_id' => $slot->teacher_user_id]);
        }
        $this->assertSame(0, Subject::where('name', 'Kujdestari')->count());
        $teacher = User::where('name', 'Jakup Çunaku')->firstOrFail();
        $this->actingAs($teacher)->getJson('/api/v1/teacher/workspace')->assertOk()->assertJsonCount(20, 'data.schedule')->assertJsonCount(6, 'data.classes');
        $this->getJson('/api/v1/academic/timetable')->assertOk()->assertJsonPath('data.academic_year_label', '2026-2027');
    }

    public function test_conflict_rolls_back_instead_of_overwriting_existing_teacher(): void
    {
        [$year, $data] = $this->fixture();
        $service = app(ReferenceTimetableImporter::class);
        $service->import($year, $data);
        $slot = TimetableSlot::whereNotNull('subject_id')->firstOrFail();
        $other = User::factory()->create(['role' => 'teacher']);
        DB::table('class_subject')->where('class_model_id', $slot->class_id)->where('subject_id', $slot->subject_id)->update(['teacher_user_id' => $other->id]);
        try {
            $service->import($year, $data);
            $this->fail('Conflicting import must abort.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('profesor tjetër', $e->getMessage());
        }
        $this->assertDatabaseCount('timetable_slots', 429);
        $this->assertDatabaseHas('class_subject', ['class_model_id' => $slot->class_id, 'subject_id' => $slot->subject_id, 'teacher_user_id' => $other->id]);
    }
}
