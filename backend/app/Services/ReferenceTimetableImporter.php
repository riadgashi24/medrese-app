<?php

namespace App\Services;

use App\Models\{AcademicYear, ClassModel, Staff, Subject, TimetableSlot};
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ReferenceTimetableImporter
{
    public function import(AcademicYear $year, array $reference, bool $replaceSlots = false): array
    {
        return DB::transaction(function () use ($year, $reference, $replaceSlots) {
            $year = AcademicYear::whereKey($year->id)->lockForUpdate()->firstOrFail();
            $classes = ClassModel::where('academic_year_id', $year->id)->get()->keyBy('name');
            $staff = Staff::with('user')->where('status', 'Active')->where('role', 'teacher')->get()->keyBy('name');
            $slots = []; $courses = []; $occupied = []; $teachers = [];
            foreach ($reference['rows'] as $row) {
                $teacher = $staff->get($row['teacher']);
                if (!$teacher?->user || $teacher->user->role !== 'teacher') throw new RuntimeException('Mungon llogaria e profesorit: '.$row['teacher']);
                foreach ($row['slots'] as $item) {
                    $class = $classes->get($item['class']);
                    if (!$class || $item['day'] < 1 || $item['day'] > 5 || $item['period'] < 1 || $item['period'] > 7) throw new RuntimeException('Klasa ose ora e pavlefshme.');
                    $cell = $item['day'].'-'.$item['period'].'-'.$class->id;
                    $teacherCell = $item['day'].'-'.$item['period'].'-'.$teacher->user_id;
                    if (isset($occupied[$cell]) || isset($teachers[$teacherCell])) throw new RuntimeException('Konflikt në orarin e referencës: '.$cell);
                    $occupied[$cell] = true; $teachers[$teacherCell] = true;
                    $subject = null;
                    if ($item['subject']) {
                        $subject = Subject::firstOrCreate(['name' => $item['subject'], 'level' => $class->level], ['category' => $this->category($item['subject'])]);
                        $key = $class->id.'-'.$subject->id;
                        if (isset($courses[$key]) && $courses[$key]['teacher_user_id'] !== $teacher->user_id) throw new RuntimeException('Dy profesorë për të njëjtën lëndë: '.$key);
                        $courses[$key] ??= ['class_model_id' => $class->id, 'subject_id' => $subject->id, 'teacher_user_id' => $teacher->user_id, 'weekly_hours' => 0];
                        $courses[$key]['weekly_hours']++;
                    } elseif (empty($item['activity_label'])) {
                        throw new RuntimeException('Ora duhet të ketë lëndë ose emër aktiviteti.');
                    }
                    $slots[] = ['academic_year_id' => $year->id, 'class_id' => $class->id, 'teacher_user_id' => $teacher->user_id,
                        'subject_id' => $subject?->id, 'day_of_week' => $item['day'], 'slot_number' => $item['period'],
                        'activity_label' => $item['activity_label'], 'is_provisional' => $item['is_provisional']];
                }
            }
            // Existing unrelated assignments are preserved; conflicting owners abort the entire import.
            foreach ($courses as $course) {
                $existing = DB::table('class_subject')->where('class_model_id', $course['class_model_id'])->where('subject_id', $course['subject_id'])->first();
                if ($existing && (int) $existing->teacher_user_id !== $course['teacher_user_id']) throw new RuntimeException('Lënda ka profesor tjetër; importi u anulua.');
                DB::table('class_subject')->updateOrInsert(['class_model_id' => $course['class_model_id'], 'subject_id' => $course['subject_id']], [...$course, 'created_at' => $existing?->created_at ?? now(), 'updated_at' => now()]);
            }
            if ($replaceSlots) TimetableSlot::where('academic_year_id', $year->id)->delete();
            foreach ($slots as $slot) {
                $existing = TimetableSlot::where('academic_year_id', $year->id)->where('day_of_week', $slot['day_of_week'])->where('slot_number', $slot['slot_number'])->where('class_id', $slot['class_id'])->first();
                if ($existing && ((int) $existing->teacher_user_id !== $slot['teacher_user_id'] || $existing->subject_id !== $slot['subject_id'] || $existing->activity_label !== $slot['activity_label'])) throw new RuntimeException('Orari është ndryshuar; importi u anulua për të ruajtur ndryshimet.');
                TimetableSlot::updateOrCreate(['academic_year_id' => $year->id, 'day_of_week' => $slot['day_of_week'], 'slot_number' => $slot['slot_number'], 'class_id' => $slot['class_id']], $slot);
            }
            return ['slots' => count($slots), 'courses' => count($courses), 'activities' => count(array_filter($slots, fn ($s) => !$s['subject_id']))];
        });
    }

    private function category(string $subject): string
    {
        if (str_starts_with($subject, 'Gjuhë')) return 'Gjuhët dhe komunikimi';
        if (in_array($subject, ['Kuran', 'Fikh', 'Usuli fikh'])) return 'Kurani dhe jurisprudenca islame';
        if (in_array($subject, ['Biologji', 'Fizikë', 'Kimi', 'Gjeografi'])) return 'Shkencat e natyrës';
        if (in_array($subject, ['Histori', 'Psikologji', 'Sociologji'])) return 'Shoqëria dhe mjedisi';
        return match ($subject) { 'Matematikë' => 'Matematikë', 'TIK' => 'Jeta dhe mjedisi', 'Ed. Fizike, sporte' => 'Ed. fizike, sporte', default => 'Bazat e fesë' };
    }
}
