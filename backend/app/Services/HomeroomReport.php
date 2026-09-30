<?php

namespace App\Services;

use App\Models\ClassModel;
use App\Models\Grade;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HomeroomReport
{
    public const TERMS = ['t1' => 'Gjysmëvjetori I', 't2' => 'Gjysmëvjetori II', 'np' => 'Nota përfundimtare'];

    public function settings(ClassModel $class): array
    {
        preg_match('/(\d{4})/', $class->academicYear->label, $match);
        $year = (int) ($match[1] ?? now()->year);
        $saved = DB::table('homeroom_settings')->where('class_id', $class->id)->value('data');

        return array_replace([
            'school_name' => 'Medrese', 'school_type' => 'Shkollë e mesme',
            'report_date' => now()->toDateString(),
            't1_start' => "$year-09-01", 't1_end' => "$year-12-31",
            't2_start' => ($year + 1).'-01-01', 't2_end' => ($year + 1).'-06-30',
        ], $saved ? json_decode($saved, true) : []);
    }

    public function roster(ClassModel $class)
    {
        return Student::where(function ($query) use ($class) {
            $query->whereHas('academicEnrollments', fn ($q) => $q->where('class_id', $class->id)->where('academic_year_id', $class->academic_year_id))
                ->orWhere(function ($q) use ($class) {
                    $q->where('class_id', $class->id)->whereDoesntHave('academicEnrollments', fn ($e) => $e->where('academic_year_id', $class->academic_year_id));
                });
        })->orderBy('last_name')->orderBy('first_name');
    }

    private function bucket($rows): array
    {
        return ['total' => $rows->count(), 'male' => $rows->where('gender', 'Male')->count(), 'female' => $rows->where('gender', 'Female')->count(), 'unknown' => $rows->whereNotIn('gender', ['Male', 'Female'])->count()];
    }

    public function build(ClassModel $class, ?array $studentIds = null): array
    {
        $class->load(['academicYear', 'homeroomStaff.user']);
        $settings = $this->settings($class);
        $subjects = $class->subjects()->orderBy('category')->orderBy('name')->get();
        $roster = $this->roster($class)->when($studentIds !== null, fn ($q) => $q->whereIn('id', $studentIds))->get();
        $ids = $roster->pluck('id');
        $profiles = DB::table('homeroom_profiles')->where('class_id', $class->id)->get()->keyBy('student_id');
        $enrollments = DB::table('student_academic_enrollments')->where('class_id', $class->id)->where('academic_year_id', $class->academic_year_id)->get()->keyBy('student_id');
        $grades = Grade::whereIn('student_id', $ids)->where('academic_year_id', $class->academic_year_id)->get()->groupBy('student_id');
        $overrides = DB::table('homeroom_absences')->where('class_id', $class->id)->get()->keyBy(fn ($r) => "$r->student_id:$r->month");
        $lessons = DB::table('lesson_sessions')->where('class_id', $class->id)->whereDate('lesson_date', '>=', $settings['t1_start'])->whereDate('lesson_date', '<=', $settings['t2_end'])->get();
        $lessonAttendance = DB::table('lesson_attendances')->whereIn('lesson_session_id', $lessons->pluck('id'))->whereIn('student_id', $ids)->get();
        $legacy = DB::table('attendance_records')->where('class_id', $class->id)->whereIn('student_id', $ids)->whereBetween('date', [$settings['t1_start'], $settings['t2_end']])->get();
        $lessonMap = $lessons->keyBy('id');
        $months = [];
        for ($date = Carbon::parse($settings['t1_start'])->startOfMonth(); $date->format('Y-m') <= substr($settings['t2_end'], 0, 7); $date->addMonth()) {
            $months[] = $date->format('Y-m');
        }
        $students = $roster->map(function ($student) use ($profiles, $enrollments, $grades, $subjects, $months, $overrides, $lessonAttendance, $lessonMap, $legacy) {
            $profile = isset($profiles[$student->id]) ? json_decode($profiles[$student->id]->data, true) : [];
            $enrollment = $enrollments->get($student->id);
            $withdrawn = $enrollment ? in_array(strtolower($enrollment->status), ['withdrawn', 'transferred']) : in_array($student->status, ['Withdrawn', 'Transferred']);
            $gradeMap = $grades->get($student->id, collect())->keyBy('subject_id');
            $matrix = [];
            foreach ($subjects as $subject) {
                $grade = $gradeMap->get($subject->id);
                $matrix[$subject->id] = ['t1' => $grade?->term_1_grade, 't2' => $grade?->term_2_grade, 'np' => $grade?->final_grade, 'overridden' => $grade?->is_final_overridden ?? false];
            }
            $attendance = [];
            foreach ($months as $month) {
                $automatic = ['excused' => 0, 'unexcused' => 0, 'pending' => 0, 'late' => 0];
                $lessonDates = [];
                foreach ($lessonAttendance->where('student_id', $student->id) as $record) {
                    $day = substr($lessonMap[$record->lesson_session_id]->lesson_date, 0, 10);
                    if (substr($day, 0, 7) !== $month) {
                        continue;
                    }
                    $lessonDates[$day] = true;
                    if ($record->status === 'Absent') {
                        $automatic['pending']++;
                    }
                    if ($record->status === 'Late') {
                        $automatic['late']++;
                    }
                }
                // A daily legacy entry is fallback only when lesson-level records exist for no part of that day.
                foreach ($legacy->where('student_id', $student->id) as $record) {
                    if (substr($record->date, 0, 7) !== $month || isset($lessonDates[substr($record->date, 0, 10)])) {
                        continue;
                    }
                    if ($record->status === 'Late') {
                        $automatic['late']++;

                        continue;
                    }
                    $type = $record->status === 'Excused' || $record->absence_type === 'Excused' ? 'excused' : ($record->absence_type === 'Unexcused' ? 'unexcused' : 'pending');
                    $automatic[$type]++;
                }
                $override = $overrides->get("$student->id:$month");
                $attendance[$month] = ['excused' => $override ? $override->excused : $automatic['excused'], 'unexcused' => $override ? $override->unexcused : $automatic['unexcused'], 'pending' => $override ? 0 : $automatic['pending'], 'late' => $automatic['late'], 'manual' => (bool) $override, 'note' => $override?->note, 'automatic' => $automatic];
            }

            return [...$student->only(['id', 'student_id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'municipality', 'address', 'parent_name', 'parent_phone', 'parent_phone_secondary', 'student_email']), 'name' => $student->full_name, 'profile' => $profile, 'default_status' => $withdrawn ? 'withdrawn' : 'active', 'grades' => $matrix, 'attendance' => $attendance];
        });
        $periods = [];
        foreach (self::TERMS as $term => $label) {
            $start = $settings[$term === 'np' ? 't1_start' : $term.'_start'];
            $end = $settings[$term === 'np' ? 't2_end' : $term.'_end'];
            $rows = $students->map(function ($student) use ($term, $subjects, $start, $end) {
                $values = collect($student['grades'])->pluck($term)->filter(fn ($n) => $n !== null);
                $missing = $subjects->count() - $values->count();
                $failures = $values->filter(fn ($n) => $n === 1)->count();
                $complete = $subjects->count() > 0 && $missing === 0;
                // The source workbook assigns overall success 1 whenever any subject is failed.
                $average = $complete ? ($failures ? 1 : round($values->avg(), 2)) : null;
                $success = $complete ? ($failures ? 1 : (int) round($values->avg(), 0, PHP_ROUND_HALF_UP)) : null;
                $status = $student['profile'][$term.'_status'] ?? $student['default_status'];
                $attendance = ['excused' => 0, 'unexcused' => 0, 'pending' => 0, 'late' => 0];
                foreach ($student['attendance'] as $month => $counts) {
                    if ($month < substr($start, 0, 7) || $month > substr($end, 0, 7)) {
                        continue;
                    }
                    foreach ($attendance as $key => $value) {
                        $attendance[$key] += $counts[$key];
                    }
                }

                return ['id' => $student['id'], 'name' => $student['name'], 'gender' => $student['gender'], 'status' => $status, 'grades' => collect($student['grades'])->map(fn ($g) => $g[$term])->all(), 'missing' => $missing, 'failures' => $failures, 'average' => $average, 'success' => $success, 'attendance' => $attendance];
            });
            $active = $rows->where('status', '!=', 'withdrawn');
            $summary = [];
            $sets = [
                'registered' => $rows, 'withdrawn' => $rows->where('status', 'withdrawn'), 'active' => $active,
                'graded' => $active->whereNotNull('success'), 'ungraded' => $active->whereNull('success'),
                'positive' => $active->where('success', '>=', 2), 'negative' => $active->where('success', 1),
                'excellent' => $active->where('success', 5), 'very_good' => $active->where('success', 4), 'good' => $active->where('success', 3), 'sufficient' => $active->where('success', 2),
                'one_failure' => $active->where('success', 1)->where('failures', 1), 'two_failures' => $active->where('success', 1)->where('failures', 2), 'three_failures' => $active->where('success', 1)->where('failures', '>=', 3),
                'repeating' => $active->where('status', 'repeating'),
                'no_absences' => $active->filter(fn ($r) => array_sum(array_intersect_key($r['attendance'], array_flip(['excused', 'unexcused', 'pending']))) === 0),
            ];
            foreach ($sets as $key => $set) {
                $summary[$key] = [...$this->bucket($set), 'percent' => $active->count() ? round($set->count() * 100 / $active->count(), 2) : null];
            }
            $statistics = $subjects->map(function ($subject) use ($active) {
                $distribution = [];
                foreach ([5, 4, 3, 2, 1, 'ungraded', 'positive'] as $mark) {
                    $matching = $active->filter(function ($r) use ($subject, $mark) {
                        $grade = $r['grades'][$subject->id];

                        return $mark === 'ungraded' ? $grade === null : ($mark === 'positive' ? $grade !== null && $grade >= 2 : $grade === $mark);
                    });
                    $distribution[$mark] = [...$this->bucket($matching), 'percent' => $active->count() ? round($matching->count() * 100 / $active->count(), 2) : null];
                }
                $marks = $active->map(fn ($r) => $r['grades'][$subject->id])->filter(fn ($n) => $n !== null);

                return ['id' => $subject->id, 'name' => $subject->name, 'category' => $subject->category, 'distribution' => $distribution, 'average' => $marks->count() ? round($marks->avg(), 2) : null, 'total' => $active->count()];
            });
            $attendance = [];
            foreach (['excused', 'unexcused', 'pending', 'late'] as $type) {
                $attendance[$type] = ['total' => $active->sum(fn ($r) => $r['attendance'][$type]), 'male' => $active->where('gender', 'Male')->sum(fn ($r) => $r['attendance'][$type]), 'female' => $active->where('gender', 'Female')->sum(fn ($r) => $r['attendance'][$type]), 'unknown' => $active->whereNotIn('gender', ['Male', 'Female'])->sum(fn ($r) => $r['attendance'][$type])];
            }
            $periods[$term] = ['label' => $label, 'rows' => $rows->values(), 'summary' => $summary, 'subjects' => $statistics, 'attendance' => $attendance, 'average' => $active->whereNotNull('average')->count() ? round($active->whereNotNull('average')->avg('average'), 2) : null];
        }
        $hourRecords = DB::table('homeroom_hours')->where('class_id', $class->id)->get()->keyBy(fn ($r) => "$r->subject_id:$r->term");
        $hours = $subjects->map(function ($subject) use ($settings, $lessons, $hourRecords) {
            $result = ['id' => $subject->id, 'name' => $subject->name, 'category' => $subject->category];
            foreach (['t1', 't2'] as $term) {
                $automatic = $lessons->where('subject_id', $subject->id)->filter(fn ($l) => substr($l->lesson_date, 0, 10) >= $settings[$term.'_start'] && substr($l->lesson_date, 0, 10) <= $settings[$term.'_end'])->count();
                $record = $hourRecords->get("$subject->id:$term");
                $held = $record?->held ?? $automatic;
                $missed = $record?->missed ?? 0;
                $result[$term] = ['held' => $held, 'missed' => $missed, 'planned' => $held + $missed, 'automatic' => $automatic, 'manual' => $record?->held !== null];
            }
            $result['np'] = [];
            foreach (['held', 'missed', 'planned'] as $field) {
                $result['np'][$field] = $result['t1'][$field] + $result['t2'][$field];
            }

            return $result;
        });

        return ['class' => ['id' => $class->id, 'name' => $class->name, 'year' => $class->academicYear->label, 'active' => $class->academicYear->is_active, 'teacher' => $class->homeroomStaff?->user?->name ?? $class->homeroomStaff?->name], 'settings' => $settings, 'subjects' => $subjects->map->only(['id', 'name', 'category']), 'students' => $students, 'months' => $months, 'periods' => $periods, 'hours' => $hours];
    }
}
