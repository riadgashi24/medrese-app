<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\ClassModel;
use App\Models\LessonAttendance;
use App\Models\LessonSession;
use App\Models\PeriodGrade;
use App\Models\PortalEntry;
use App\Models\TimetableSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherWorkspaceController extends Controller
{
    private function course(Request $request, int $classId, int $subjectId): ClassModel
    {
        $class = ClassModel::with('academicYear')->findOrFail($classId);
        abort_unless($class->academicYear?->is_active && $class->subjects()
            ->where('subjects.id', $subjectId)->wherePivot('teacher_user_id', $request->user()->id)->exists(), 403, 'Nuk keni qasje në këtë lëndë të klasës.');

        return $class;
    }

    public function index(Request $request)
    {
        $classes = ClassModel::whereHas('academicYear', fn ($q) => $q->where('is_active', true))
            ->whereHas('subjects', fn ($q) => $q->where('class_subject.teacher_user_id', $request->user()->id))
            ->with(['subjects' => fn ($q) => $q->where('class_subject.teacher_user_id', $request->user()->id)->orderBy('name'), 'academicYear'])
            ->withCount(['students' => fn ($q) => $q->where('status', 'Active')])->orderBy('name')->get();
        $schedule = TimetableSlot::without(['teacherUser'])->with(['class:id,name', 'subject:id,name'])
            ->whereHas('academicYear', fn ($q) => $q->where('is_active', true))
            ->where('teacher_user_id', $request->user()->id)->orderBy('day_of_week')->orderBy('slot_number')->get();

        return response()->json(['data' => compact('classes', 'schedule')]);
    }

    public function show(Request $request, int $classId, int $subjectId)
    {
        $class = $this->course($request, $classId, $subjectId);
        $subject = $class->subjects()->findOrFail($subjectId);
        $students = $class->students()->where('status', 'Active')->orderBy('last_name')->orderBy('first_name')->get(['id', 'student_id', 'first_name', 'last_name']);
        $grades = PeriodGrade::whereIn('student_id', $students->pluck('id'))->where('subject_id', $subjectId)->where('academic_year_id', $class->academic_year_id)->get();
        $assignments = Assignment::where('class_id', $classId)->where('subject_id', $subjectId)
            ->withCount(['submissions as submitted_count' => fn ($q) => $q->whereIn('status', ['Submitted', 'Graded'])])->orderByDesc('due_date')->get();
        $announcements = PortalEntry::where('class_id', $classId)->where('subject_id', $subjectId)->where('kind', 'announcement')->latest()->get();
        $lessons = LessonSession::where('class_id', $classId)->where('subject_id', $subjectId)
            ->with(['attendances.student:id,first_name,last_name'])->orderByDesc('lesson_date')->orderByDesc('slot_number')->get();
        $periods = collect(PeriodGrade::PERIODS)->map(fn ($label, $id) => ['id' => $id, 'label' => $label])->values();

        $termGrades = \App\Models\Grade::whereIn('student_id', $students->pluck('id'))->where('subject_id', $subjectId)->where('academic_year_id', $class->academic_year_id)->get();
        return response()->json(['data' => [...compact('class', 'subject', 'students', 'grades', 'assignments', 'announcements', 'lessons', 'periods'), 'term_grades' => $termGrades]]);
    }

    public function grade(Request $request, int $classId, int $subjectId)
    {
        $class = $this->course($request, $classId, $subjectId);
        $data = $request->validate(['student_id' => 'required|integer', 'period' => 'required|integer|between:1,5', 'grade' => 'required|integer|between:1,5']);
        abort_unless($class->students()->whereKey($data['student_id'])->where('status', 'Active')->exists(), 422, 'Nxënësi nuk i përket kësaj klase.');
        $grade = PeriodGrade::updateOrCreate([
            'student_id' => $data['student_id'], 'subject_id' => $subjectId,
            'academic_year_id' => $class->academic_year_id, 'period' => $data['period'],
        ], ['grade' => $data['grade'], 'teacher_user_id' => $request->user()->id]);

        return response()->json(['data' => $grade]);
    }

    public function batchGrades(Request $request, int $classId, int $subjectId)
    {
        $class = $this->course($request, $classId, $subjectId);
        $data = $request->validate([
            'period' => 'required|in:1,2,3,4,5,t1,t2',
            'changes' => 'required|array|min:1|max:200',
            'changes.*.student_id' => 'required|integer|distinct',
            'changes.*.grade' => 'present|nullable|integer|between:1,5',
        ]);
        $roster = $class->students()->where('status', 'Active')->pluck('id');
        foreach ($data['changes'] as $row) {
            abort_unless($roster->contains($row['student_id']), 422, 'Nxënësi nuk i përket kësaj klase.');
        }
        DB::transaction(function () use ($data, $class, $subjectId, $request) {
            ClassModel::whereKey($class->id)->lockForUpdate()->first();
            foreach ($data['changes'] as $row) {
                $key = ['student_id' => $row['student_id'], 'subject_id' => $subjectId, 'academic_year_id' => $class->academic_year_id];
                if (in_array($data['period'], ['t1', 't2'])) {
                    $grade = \App\Models\Grade::firstOrCreate($key);
                    $grade = \App\Models\Grade::whereKey($grade->id)->lockForUpdate()->firstOrFail();
                    $grade->{$data['period'] === 't1' ? 'term_1_grade' : 'term_2_grade'} = $row['grade'];
                    if (! $grade->is_final_overridden) {
                        $grade->final_grade = \App\Models\Grade::calculateFinalGrade($grade->term_1_grade, $grade->term_2_grade);
                    }
                    $grade->save();
                } else {
                    $key['period'] = (int) $data['period'];
                    if ($row['grade'] === null) PeriodGrade::where($key)->delete();
                    else PeriodGrade::updateOrCreate($key, ['grade' => $row['grade'], 'teacher_user_id' => $request->user()->id]);
                }
            }
        }, 3);
        return response()->json(['message' => 'Notat u ruajtën.']);
    }

    public function publish(Request $request, int $classId, int $subjectId)
    {
        $this->course($request, $classId, $subjectId);
        $data = $request->validate([
            'kind' => ['required', Rule::in(['announcement', 'assignment'])], 'title' => 'required|string|max:255',
            'description' => 'required|string|max:10000', 'date' => 'nullable|required_if:kind,assignment|date_format:Y-m-d',
        ]);
        if ($data['kind'] === 'assignment') {
            $entry = Assignment::create(['class_id' => $classId, 'subject_id' => $subjectId, 'title' => $data['title'], 'description' => $data['description'], 'due_date' => $data['date']]);
        } else {
            $entry = PortalEntry::create(['class_id' => $classId, 'subject_id' => $subjectId, 'kind' => 'announcement',
                'title' => $data['title'], 'description' => $data['description'], 'starts_on' => $data['date'] ?? null, 'author_user_id' => $request->user()->id]);
        }

        return response()->json(['data' => $entry], 201);
    }

    public function completeAssignment(Request $request, int $classId, int $subjectId, Assignment $assignment)
    {
        $this->course($request, $classId, $subjectId);
        abort_unless((int) $assignment->class_id === $classId && (int) $assignment->subject_id === $subjectId, 404);
        $request->validate(['completed' => 'required|boolean']);
        $assignment->completed_at = $request->boolean('completed') ? now() : null;
        $assignment->save();

        return response()->json(['data' => $assignment]);
    }

    public function saveLesson(Request $request, int $classId, int $subjectId, ?int $lessonId = null)
    {
        $class = $this->course($request, $classId, $subjectId);
        $lesson = $lessonId ? LessonSession::where('class_id', $classId)->where('subject_id', $subjectId)->findOrFail($lessonId) : new LessonSession;
        $data = $request->validate([
            'title' => 'required|string|max:255', 'lesson_date' => 'required|date_format:Y-m-d|before_or_equal:today',
            'slot_number' => ['required', 'integer', 'between:1,12', Rule::unique('lesson_sessions')->where('class_id', $classId)->where(fn ($q) => $q->whereDate('lesson_date', $request->lesson_date))->ignore($lessonId),
                Rule::unique('lesson_sessions')->where('teacher_user_id', $request->user()->id)->where(fn ($q) => $q->whereDate('lesson_date', $request->lesson_date))->ignore($lessonId)],
            'attendance' => 'required|array|min:1', 'attendance.*.student_id' => 'required|integer|distinct',
            'attendance.*.status' => ['required', Rule::in(['Present', 'Absent', 'Late'])],
        ], [
            'slot_number.unique' => 'Klasa ose profesori ka tashmë një orë të regjistruar në këtë datë dhe numër ore.',
            'lesson_date.before_or_equal' => 'Ora e mbajtur nuk mund të ketë datë në të ardhmen.',
        ]);
        // An existing session keeps its original roster even after pupils transfer classes.
        $roster = $lesson->exists ? $lesson->attendances()->pluck('student_id') : $class->students()->where('status', 'Active')->pluck('id');
        $submitted = collect($data['attendance'])->pluck('student_id');
        abort_unless($roster->count() === $submitted->count() && $roster->diff($submitted)->isEmpty(), 422, 'Regjistroni prezencën e të gjithë nxënësve të kësaj ore.');
        DB::transaction(function () use ($lesson, $request, $classId, $subjectId, $data) {
            $entry = PortalEntry::updateOrCreate(['id' => $lesson->portal_entry_id], [
                'class_id' => $classId, 'subject_id' => $subjectId, 'kind' => 'lesson', 'title' => $data['title'],
                'description' => 'Ora '.$data['slot_number'], 'starts_on' => $data['lesson_date'], 'author_user_id' => $request->user()->id,
            ]);
            $lesson->fill(['class_id' => $classId, 'subject_id' => $subjectId, 'teacher_user_id' => $request->user()->id,
                'portal_entry_id' => $entry->id, 'title' => $data['title'], 'lesson_date' => $data['lesson_date'], 'slot_number' => $data['slot_number']])->save();
            foreach ($data['attendance'] as $row) {
                LessonAttendance::updateOrCreate(
                    ['lesson_session_id' => $lesson->id, 'student_id' => $row['student_id']], ['status' => $row['status']]);
            }
        });

        return response()->json(['data' => $lesson->load('attendances')], $lessonId ? 200 : 201);
    }
}
