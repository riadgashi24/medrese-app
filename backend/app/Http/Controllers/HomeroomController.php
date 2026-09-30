<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Services\HomeroomReport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HomeroomController extends Controller
{
    public function __construct(private HomeroomReport $report) {}

    private function classes(Request $request)
    {
        return ClassModel::query()->when($request->user()->role === 'teacher', fn ($q) => $q->whereHas('academicYear', fn ($y) => $y->where('is_active', true))->whereHas('homeroomStaff', fn ($s) => $s->where('user_id', $request->user()->id)));
    }

    private function classroom(Request $request, int $id, bool $write = false): ClassModel
    {
        $class = $this->classes($request)->with('academicYear')->findOrFail($id);
        abort_if($write && ! $class->academicYear->is_active, 422, 'Viti i arkivuar është vetëm për lexim.');

        return $class;
    }

    private function audit(Request $request, ClassModel $class, string $action, $before, $after): void
    {
        DB::table('homeroom_changes')->insert(['class_id' => $class->id, 'user_id' => $request->user()->id, 'action' => $action, 'before' => json_encode($before), 'after' => json_encode($after), 'created_at' => now(), 'updated_at' => now()]);
    }

    private function upsert(string $table, array $key, array $data): void
    {
        $existing = DB::table($table)->where($key)->exists();
        DB::table($table)->updateOrInsert($key, [...$data, 'updated_at' => now(), ...($existing ? [] : ['created_at' => now()])]);
    }

    public function index(Request $request)
    {
        return response()->json(['data' => $this->classes($request)->with('academicYear')->orderByDesc('academic_year_id')->orderBy('name')->get(['id', 'name', 'academic_year_id'])]);
    }

    public function show(Request $request, int $classId)
    {
        return response()->json(['data' => $this->report->build($this->classroom($request, $classId))]);
    }

    private function historicalClasses(ClassModel $class)
    {
        $ids = $this->report->roster($class)->pluck('id');
        return ClassModel::with('academicYear')->whereHas('academicEnrollments', fn ($q) => $q->whereIn('student_id', $ids))
            ->whereHas('academicYear', fn ($q) => $q->where('label', '<', $class->academicYear->label))
            ->get()->filter(fn ($c) => $c->level && $c->level < $class->level)->values();
    }

    public function history(Request $request, int $classId)
    {
        $class = $this->classroom($request, $classId);
        return response()->json(['data' => $this->historicalClasses($class)->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'year' => $c->academicYear->label])]);
    }

    public function historicalReport(Request $request, int $classId, int $historicalId)
    {
        $class = $this->classroom($request, $classId);
        $historical = $this->historicalClasses($class)->firstWhere('id', $historicalId);
        abort_unless($historical, 404);
        $data = $this->report->build($historical, $this->report->roster($class)->pluck('id')->all());
        $data['class']['active'] = false;
        return response()->json(['data' => $data]);
    }

    public function certificates(Request $request, int $classId)
    {
        $class = $this->classroom($request, $classId);
        $data = $this->report->build($class);
        $students = collect($data['students'])->keyBy('id');
        $data['certificates'] = collect($data['periods']['np']['rows'])->where('status', '!=', 'withdrawn')->map(function ($row) use ($students, $data) {
            $student = $students[$row['id']];
            $missing = [];
            foreach ($data['subjects'] as $subject) {
                $grade = $student['grades'][$subject['id']];
                if ($grade['np'] === null || (!$grade['overridden'] && ($grade['t1'] === null || $grade['t2'] === null))) $missing[] = 'Nota përfundimtare: '.$subject['name'];
            }
            if (!count($data['subjects'])) $missing[] = 'Lëndët e klasës';
            foreach (['date_of_birth' => 'Datëlindja', 'parent_name' => 'Emri i prindit', 'municipality' => 'Komuna'] as $field => $label) {
                if (empty($student[$field])) $missing[] = $label;
            }
            foreach (['birth_place' => 'Vendi i lindjes', 'birth_country' => 'Shteti i lindjes', 'citizenship' => 'Shtetësia', 'conduct' => 'Sjellja', 'register_number' => 'Numri në amzë'] as $field => $label) {
                if (empty($student['profile'][$field])) $missing[] = $label;
            }
            return ['student' => $student, 'result' => $row, 'missing' => $missing, 'ready' => !$missing];
        })->values();
        return response()->json(['data' => $data]);
    }

    public function settings(Request $request, int $classId)
    {
        $class = $this->classroom($request, $classId, true);
        $data = $request->validate([
            'school_name' => 'required|string|max:200', 'school_type' => 'required|string|max:100', 'report_date' => 'required|date_format:Y-m-d',
            't1_start' => 'required|date_format:Y-m-d', 't1_end' => 'required|date_format:Y-m-d|after_or_equal:t1_start',
            't2_start' => 'required|date_format:Y-m-d|after:t1_end', 't2_end' => 'required|date_format:Y-m-d|after_or_equal:t2_start',
        ]);
        abort_if(Carbon::parse($data['t1_start'])->diffInMonths(Carbon::parse($data['t2_end'])) > 12, 422, 'Periudha nuk mund të kalojë 12 muaj.');
        foreach (['t1', 't2'] as $term) {
            abort_unless(Carbon::parse($data[$term.'_start'])->day === 1 && Carbon::parse($data[$term.'_end'])->isLastOfMonth(), 422, 'Për evidencën mujore zgjidh fillimin dhe fundin e muajit.');
        }
        abort_unless(Carbon::parse($data['t1_end'])->addDay()->toDateString() === $data['t2_start'], 422, 'Gjysmëvjetori II duhet të fillojë në muajin pasues.');
        DB::transaction(function () use ($request, $class, $data) {
            $before = $this->report->settings($class);
            $this->upsert('homeroom_settings', ['class_id' => $class->id], ['data' => json_encode($data)]);
            $this->audit($request, $class, 'settings', $before, $data);
        });

        return response()->json(['message' => 'Të dhënat e raportit u ruajtën.']);
    }

    public function student(Request $request, int $classId, int $studentId)
    {
        $class = $this->classroom($request, $classId, true);
        $student = $this->report->roster($class)->findOrFail($studentId);
        $data = $request->validate([
            'first_name' => 'required|string|max:100', 'last_name' => 'required|string|max:100', 'gender' => ['required', Rule::in(['Male', 'Female'])],
            'date_of_birth' => 'nullable|date_format:Y-m-d|before_or_equal:today', 'municipality' => 'required|string|max:100', 'address' => 'nullable|string|max:255',
            'parent_name' => 'required|string|max:200', 'parent_phone' => 'required|string|max:30', 'parent_phone_secondary' => 'nullable|string|max:30', 'student_email' => 'nullable|email|max:255',
            'profile' => 'required|array', 'profile.birth_place' => 'nullable|string|max:200', 'profile.birth_country' => 'nullable|string|max:100',
            'profile.parent_occupation' => 'nullable|string|max:200', 'profile.parent_email' => 'nullable|email|max:255', 'profile.notes' => 'nullable|string|max:2000',
            'profile.citizenship' => 'nullable|string|max:100', 'profile.conduct' => 'nullable|string|max:100', 'profile.register_number' => 'nullable|string|max:100',
            'profile.t1_status' => ['required', Rule::in(['active', 'withdrawn'])], 'profile.t2_status' => ['required', Rule::in(['active', 'withdrawn'])], 'profile.np_status' => ['required', Rule::in(['active', 'withdrawn', 'repeating'])],
        ]);
        DB::transaction(function () use ($request, $class, $student, $data) {
            $before = ['student' => $student->toArray(), 'profile' => DB::table('homeroom_profiles')->where('class_id', $class->id)->where('student_id', $student->id)->value('data')];
            $profile = array_intersect_key($data['profile'], array_flip(['birth_place', 'birth_country', 'citizenship', 'conduct', 'register_number', 'parent_occupation', 'parent_email', 'notes', 't1_status', 't2_status', 'np_status']));
            unset($data['profile']);
            $student->update($data);
            $this->upsert('homeroom_profiles', ['class_id' => $class->id, 'student_id' => $student->id], ['data' => json_encode($profile)]);
            $this->audit($request, $class, 'student', $before, ['student_id' => $student->id, ...$data, 'profile' => $profile]);
        });

        return response()->json(['message' => 'Regjistri u ruajt.']);
    }

    public function grades(Request $request, int $classId)
    {
        abort(403, 'Notat vendosen vetëm nga profesori i lëndës te Klasat e mia.');
    }

    public function absences(Request $request, int $classId)
    {
        $class = $this->classroom($request, $classId, true);
        $data = $request->validate(['student_id' => 'required|integer', 'month' => 'required|date_format:Y-m', 'automatic' => 'required|boolean', 'excused' => 'required_if:automatic,false|integer|min:0|max:1000', 'unexcused' => 'required_if:automatic,false|integer|min:0|max:1000', 'note' => 'nullable|string|max:500']);
        abort_unless($this->report->roster($class)->whereKey($data['student_id'])->exists(), 422);
        $settings = $this->report->settings($class);
        abort_unless($data['month'] >= substr($settings['t1_start'], 0, 7) && $data['month'] <= substr($settings['t2_end'], 0, 7), 422, 'Muaji është jashtë vitit të raportit.');
        DB::transaction(function () use ($request, $class, $data) {
            $key = ['class_id' => $class->id, 'student_id' => $data['student_id'], 'month' => $data['month']];
            $before = DB::table('homeroom_absences')->where($key)->first();
            if ($data['automatic']) {
                DB::table('homeroom_absences')->where($key)->delete();
            } else {
                $this->upsert('homeroom_absences', $key, ['excused' => $data['excused'], 'unexcused' => $data['unexcused'], 'note' => $data['note'] ?? null]);
            }
            $this->audit($request, $class, 'absences', $before, $data);
        });

        return response()->json(['message' => 'Mungesat u ruajtën.']);
    }

    public function hours(Request $request, int $classId)
    {
        $class = $this->classroom($request, $classId, true);
        $data = $request->validate(['subject_id' => 'required|integer', 'term' => 'required|in:t1,t2', 'held' => 'nullable|integer|min:0|max:2000', 'missed' => 'required|integer|min:0|max:2000']);
        abort_unless($class->subjects()->where('subjects.id', $data['subject_id'])->exists(), 422);
        DB::transaction(function () use ($request, $class, $data) {
            $key = ['class_id' => $class->id, 'subject_id' => $data['subject_id'], 'term' => $data['term']];
            $before = DB::table('homeroom_hours')->where($key)->first();
            $this->upsert('homeroom_hours', $key, ['held' => $data['held'] ?? null, 'missed' => $data['missed']]);
            $this->audit($request, $class, 'hours', $before, $data);
        });

        return response()->json(['message' => 'Orët u ruajtën.']);
    }
}
