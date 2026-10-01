<?php
namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Storage};
use Illuminate\Validation\Rule;

class CertificateTemplateController extends Controller
{
    public const KEYS = ['student_name','first_name','last_name','parent_name','birth_date','birth_place','municipality','birth_country','citizenship','register_number','school_year','class_name','conduct','average','success','excused','unexcused','issue_date','issue_place','director','teacher'];
    public function show(int $level) {
        abort_unless(in_array($level, [10,11,12]), 404);
        $row = DB::table('certificate_templates')->where('level', $level)->first();
        if (!$row) return response()->json(['data' => null]);
        $row->fields = json_decode($row->fields, true); $row->active = (bool) $row->active;
        $row->image = 'data:image/png;base64,'.base64_encode(Storage::disk('local')->get($row->path));
        unset($row->path);
        return response()->json(['data' => $row]);
    }
    public function upload(Request $request, int $level) {
        abort_unless(in_array($level, [10,11,12]), 404);
        $data = $request->validate(['image'=>'required|file|mimes:png|max:8192|dimensions:min_width=500,min_height=500,max_width=5000,max_height=5000', 'name'=>'required|string|max:150','width_mm'=>'required|numeric|min:100|max:420','height_mm'=>'required|numeric|min:100|max:600']);
        $path = $request->file('image')->store('certificate-templates', 'local');
        abort_unless($path, 500, 'Shablloni nuk u ruajt.');
        try {
            DB::transaction(function () use ($level,$data,$path) {
                $old = DB::table('certificate_templates')->where('level',$level)->lockForUpdate()->first();
                DB::table('certificate_templates')->updateOrInsert(['level'=>$level], ['name'=>$data['name'],'path'=>$path,'width_mm'=>$data['width_mm'],'height_mm'=>$data['height_mm'],'fields'=>'[]','active'=>false,'revision'=>($old->revision ?? 0)+1,'created_at'=>$old->created_at ?? now(),'updated_at'=>now()]);
            });
        } catch (\Throwable $e) { Storage::disk('local')->delete($path); throw $e; }
        // Keep the previous image privately as a recoverable source.
        return $this->show($level);
    }
    public function update(Request $request, int $level) {
        abort_unless(in_array($level, [10,11,12]), 404);
        $keys = [...self::KEYS];
        foreach (Subject::where('level',$level)->pluck('id') as $id) { $keys[]='grade:'.$id; $keys[]='word:'.$id; }
        $data=$request->validate(['revision'=>'required|integer','active'=>'required|boolean','fields'=>'required|array|max:150', 'fields.*.key'=>['required','distinct',Rule::in($keys)],'fields.*.x'=>'required|numeric|min:0|max:98','fields.*.y'=>'required|numeric|min:0|max:97','fields.*.width'=>'required|numeric|min:1|max:100','fields.*.size'=>'required|numeric|min:6|max:24','fields.*.align'=>'required|in:left,center,right']);
        foreach($data['fields'] as $field) abort_if($field['x']+$field['width']>100,422,'Fusha del jashtë faqes.');
        if ($data['active']) {
            abort_unless(collect($data['fields'])->contains('key','student_name'),422,'Vendose fushën Emri dhe mbiemri.');
            abort_unless(collect($data['fields'])->contains(fn($f)=>str_starts_with($f['key'],'grade:') || str_starts_with($f['key'],'word:')),422,'Vendos fushat për notat.');
        }
        DB::transaction(function () use($level,$data) {
            $row=DB::table('certificate_templates')->where('level',$level)->lockForUpdate()->first(); abort_unless($row,404);
            abort_unless((int)$row->revision===$data['revision'],409,'Shablloni ka ndryshuar. Ringarko faqen.');
            DB::table('certificate_templates')->where('id',$row->id)->update(['fields'=>json_encode($data['fields']),'active'=>$data['active'],'revision'=>$row->revision+1,'updated_at'=>now()]);
        });
        return $this->show($level);
    }
}
