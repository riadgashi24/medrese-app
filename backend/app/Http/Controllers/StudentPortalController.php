<?php

namespace App\Http\Controllers;

use App\Models\ActivityEnrollment;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\ClassModel;
use App\Models\DisciplineRecord;
use App\Models\Document;
use App\Models\ExtracurricularActivity;
use App\Models\Grade;
use App\Models\PortalEntry;
use App\Models\StudentDocument;
use App\Models\Subject;
use App\Models\TimetableSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StudentPortalController extends Controller
{
    public function show(Request $request)
    {
        $student = $request->user()->student;
        abort_unless($student, 404, 'Profili i nxënësit nuk u gjet.');
        $entries = PortalEntry::forStudent($student)->with(['subject:id,name', 'author:id,name'])->latest()->get();
        $assignments = Assignment::with(['subject:id,name', 'submissions' => fn ($q) => $q->where('student_id', $student->id)])
            ->where('class_id', $student->class_id ?? 0)->orderBy('due_date')->get();
        $schedule = TimetableSlot::without(['class', 'teacherUser', 'subject'])
            ->with(['subject:id,name', 'teacherUser:id,name'])
            ->where('class_id', $student->class_id ?? 0)->where('academic_year_id', $student->class?->academic_year_id)
            ->orderBy('day_of_week')->orderBy('slot_number')->get();
        $materials = Document::whereIn('visibility', ['All', 'Students'])->latest()->get();
        $documents = StudentDocument::with('document')->where('student_id', $student->id)->latest('issued_at')->get();
        $enrollments = ActivityEnrollment::with('activity')->where('student_id', $student->id)->get();

        return response()->json(['data' => compact('entries', 'assignments', 'schedule', 'materials', 'documents', 'enrollments')]);
    }

    private function notifications(Request $request)
    {
        $student = $request->user()->student;
        abort_unless($student, 404);
        $items = collect();
        $add = function ($rows, $type, $title, $path) use ($items) {
            foreach ($rows as $row) {
                $time = $row->updated_at ?? $row->created_at;
                $items->push(['key' => $type.':'.$row->id.':'.($time?->timestamp ?? 0), 'type' => $type,
                    'title' => $title($row), 'date' => $time?->toIso8601String(), 'path' => $path]);
            }
        };
        $add(Announcement::whereNotNull('published_at')->where('published_at', '<=', now())->get(), 'announcement', fn ($r) => $r->title, '/announcements');
        $add(Assignment::where('class_id', $student->class_id ?? 0)->get(), 'assignment', fn ($r) => 'Detyrë: '.$r->title, '/student/assignments');
        $add(AttendanceRecord::where('student_id', $student->id)->where('status', '!=', 'Present')->get(), 'attendance', fn ($r) => ($r->status === 'Late' ? 'Vonesë' : 'Mungesë').' — '.$r->date->format('d.m.Y'), '/student/attendance');
        $add(DisciplineRecord::where('student_id', $student->id)->get(), 'discipline', fn ($r) => 'Vërejtje: '.$r->description, '/discipline/my-record');
        $add(ActivityEnrollment::with('activity')->where('student_id', $student->id)->get(), 'activity', fn ($r) => 'U regjistrove në: '.$r->activity?->name, '/student/groups');
        $add(StudentDocument::with('document')->where('student_id', $student->id)->get(), 'document', fn ($r) => 'Dokument i ri: '.$r->document?->title, '/student/materials');
        $add(Document::whereIn('visibility', ['All', 'Students'])->get(), 'material', fn ($r) => 'Material: '.$r->title, '/student/materials');
        $add(Grade::with('subject')->where('student_id', $student->id)->where('academic_year_id', $student->class?->academic_year_id)->get(), 'grade', fn ($r) => 'Nota u përditësua: '.$r->subject?->name, '/student/grades');
        $add(\App\Models\PeriodGrade::with('subject')->where('student_id', $student->id)->where('academic_year_id', $student->class?->academic_year_id)->get(), 'period_grade', fn ($r) => $r->subject?->name.' · '.\App\Models\PeriodGrade::PERIODS[$r->period].': '.$r->grade, '/student/grades');
        $add(\App\Models\LessonAttendance::with('lessonSession.subject')->where('student_id', $student->id)->whereIn('status', ['Absent', 'Late'])->get(), 'lesson_attendance', fn ($r) => ($r->status === 'Late' ? 'Vonesë' : 'Mungesë').' · '.$r->lessonSession?->subject?->name.' · ora '.$r->lessonSession?->slot_number.' · '.$r->lessonSession?->lesson_date?->format('d.m.Y'), '/student/attendance');
        foreach (PortalEntry::forStudent($student)->get()->groupBy('kind') as $kind => $rows) {
            $path = match ($kind) {
                'lesson' => 'lessons', 'material' => 'materials', 'group' => 'groups', 'announcement' => 'announcements', default => 'calendar'
            };
            $add($rows, 'portal_'.$kind, fn ($r) => $r->title, '/student/'.$path);
        }
        $reads = DB::table('portal_notification_reads')->where('user_id', $request->user()->id)->pluck('notification_key')->flip();

        return $items->sortByDesc('date')->values()->map(fn ($item) => [...$item, 'read' => $reads->has($item['key'])]);
    }

    public function inbox(Request $request)
    {
        return response()->json(['data' => $this->notifications($request)]);
    }

    public function markRead(Request $request)
    {
        $data = $request->validate(['keys' => 'required|array|max:500', 'keys.*' => 'required|string|max:160']);
        $allowed = $this->notifications($request)->pluck('key')->intersect($data['keys']);
        foreach ($allowed as $key) {
            DB::table('portal_notification_reads')->updateOrInsert(
                ['user_id' => $request->user()->id, 'notification_key' => $key], ['read_at' => now()]);
        }

        return response()->json(['success' => true]);
    }

    public function manage(Request $request)
    {
        $classes = ClassModel::whereHas('academicYear', fn ($q) => $q->where('is_active', true));
        if ($request->user()->role === 'teacher') {
            $classes->whereHas('subjects', fn ($q) => $q->where('class_subject.teacher_user_id', $request->user()->id));
        }

        return response()->json(['data' => [
            'entries' => PortalEntry::with(['class:id,name', 'activity:id,name', 'subject:id,name'])->when($request->user()->role === 'teacher', fn ($q) => $q->where('author_user_id', $request->user()->id))->latest()->get(),
            'classes' => $classes->get(['id', 'name']), 'subjects' => Subject::all(['id', 'name', 'level'])->map(fn ($subject) => ['id' => $subject->id, 'name' => $subject->name.' · '.$subject->level]),
            'activities' => ExtracurricularActivity::all(['id', 'name']),
        ]]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => ['required', Rule::in(['lesson', 'material', 'exam', 'holiday', 'break', 'event', 'group', 'assignment', 'announcement'])],
            'title' => 'required|string|max:255', 'description' => 'nullable|string|max:10000',
            'url' => 'nullable|url:http,https|max:2048',
            'starts_on' => 'nullable|required_if:kind,exam,holiday,break,event,assignment|date_format:Y-m-d',
            'ends_on' => 'nullable|date_format:Y-m-d|after_or_equal:starts_on',
            'class_id' => 'nullable|required_if:kind,assignment|exists:classes,id',
            'activity_id' => 'nullable|exists:extracurricular_activities,id',
            'subject_id' => 'nullable|required_if:kind,assignment|exists:subjects,id',
        ]);
        if ($request->kind === 'group') {
            $request->validate(['url' => ['required', 'regex:~^https://chat\.whatsapp\.com/[A-Za-z0-9]+(?:\?[^\s]*)?$~']]);
        }
        if ($request->user()->role === 'teacher') {
            abort_unless($request->class_id && DB::table('class_subject')->where('class_model_id', $request->class_id)
                ->where('teacher_user_id', $request->user()->id)
                ->when($request->subject_id, fn ($q) => $q->where('subject_id', $request->subject_id))->exists(), 403, 'Zgjidhni klasën dhe lëndën tuaj.');
        }
        if ($request->kind === 'assignment') {
            abort_if($request->activity_id, 422, 'Detyrat caktohen për klasën.');
            $request->validate(['url' => 'nullable|max:255']);
            abort_unless(DB::table('class_subject')->where('class_model_id', $request->class_id)->where('subject_id', $request->subject_id)->exists(), 422, 'Lënda nuk i përket klasës së zgjedhur.');
            $entry = Assignment::create(['title' => $data['title'], 'description' => $data['description'] ?? null,
                'due_date' => $data['starts_on'], 'file_url' => $data['url'] ?? null, 'class_id' => $data['class_id'], 'subject_id' => $data['subject_id']]);
        } else {
            $entry = PortalEntry::create([...$data, 'author_user_id' => $request->user()->id]);
        }

        return response()->json(['data' => $entry], 201);
    }

    public function destroy(Request $request, PortalEntry $entry)
    {
        abort_unless(in_array($request->user()->role, ['director', 'secretary']) || $entry->author_user_id === $request->user()->id, 403);
        $entry->delete();

        return response()->json(['success' => true]);
    }
}
