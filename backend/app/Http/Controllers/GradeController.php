<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\Grade;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Merr pasqyrën e notave për një klasë të caktuar
     */
    public function getClassGrades($classId)
    {
        $class = ClassModel::with('academicYear')->findOrFail($classId);
        $academicYearId = $class->academic_year_id;

        // 1. Nxirr lëndët e klasës të grupuara sipas kategorisë
        $subjects = \DB::table('class_subject')
            ->join('subjects', 'class_subject.subject_id', '=', 'subjects.id')
            ->where('class_subject.class_model_id', $classId)
            ->select('subjects.id', 'subjects.name', 'subjects.category')
            ->orderBy('subjects.category')
            ->orderBy('subjects.name')
            ->get();

        // 2. Grupo lëndët sipas kategorive
        $groupedSubjects = $subjects->groupBy('category');

        // 3. Merr të gjithë nxënësit e kësaj klase bashkë me notat
        $students = \App\Models\Student::where('class_id', $classId)
            ->where('status', 'Active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // 4. Merr gjithë notat e kësaj klase për vitin aktiv
        $grades = Grade::whereIn('student_id', $students->pluck('id'))
            ->where('academic_year_id', $academicYearId)
            ->get()
            ->groupBy('student_id');

        // Formatojmë matricën përfundimtare për Frontend
        $formattedStudents = $students->map(function ($student) use ($grades, $subjects) {
            $studentGrades = $grades->get($student->id, collect());
            
            $gradesMap = [];
            $sumT1 = 0; $countT1 = 0;
            $sumT2 = 0; $countT2 = 0;
            $sumNP = 0; $countNP = 0;

            foreach ($subjects as $subject) {
                $g = $studentGrades->firstWhere('subject_id', $subject->id);
                
                $t1 = $g ? $g->term_1_grade : null;
                $t2 = $g ? $g->term_2_grade : null;
                $np = $g ? $g->final_grade : null;

                // Akumulimi për mesataret e përgjithshme të nxënësit
                if ($t1) { $sumT1 += $t1; $countT1++; }
                if ($t2) { $sumT2 += $t2; $countT2++; }
                if ($np) { $sumNP += $np; $countNP++; }

                $gradesMap[$subject->id] = [
                    't1' => $t1,
                    't2' => $t2,
                    'np' => $np,
                    'is_overridden' => $g ? $g->is_final_overridden : false
                ];
            }

            return [
                'id' => $student->id,
                'full_name' => $student->first_name . ' ' . $student->last_name,
                'gender' => $student->gender === 'Male' ? 'M' : 'F',
                'grades' => $gradesMap,
                'overall_averages' => [
                    't1' => $countT1 > 0 ? round($sumT1 / $countT1, 2) : '-',
                    't2' => $countT2 > 0 ? round($sumT2 / $countT2, 2) : '-',
                    'np' => $countNP > 0 ? round($sumNP / $countNP, 2) : '-',
                ]
            ];
        });

        return response()->json([
            'class' => $class,
            'grouped_subjects' => $groupedSubjects,
            'all_subjects' => $subjects,
            'students' => $formattedStudents
        ]);
    }

    /**
     * Përditëso ose mbishkruaj notat (Për Mësuesin & Drejtorin)
     */
    public function updateGrade(Request $request, $classId)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'term' => 'required|in:t1,t2,np',
            'value' => 'nullable|integer|min:1|max:5',
            'is_director_override' => 'boolean'
        ]);

        $class = ClassModel::findOrFail($classId);
        
        $grade = Grade::firstOrNew([
            'student_id' => $request->student_id,
            'subject_id' => $request->subject_id,
            'academic_year_id' => $class->academic_year_id,
        ]);

        if ($request->term === 't1') {
            $grade->term_1_grade = $request->value;
        } elseif ($request->term === 't2') {
            $grade->term_2_grade = $request->value;
        } elseif ($request->term === 'np') {
            $grade->final_grade = $request->value;
            $grade->is_final_overridden = true;
        }

        // Nëse NP nuk është mbishkruar manualisht nga Drejtori, e ri-llogaritim automatikisht
        if (!$grade->is_final_overridden && $request->term !== 'np') {
            $grade->final_grade = Grade::calculateFinalGrade($grade->term_1_grade, $grade->term_2_grade);
        }

        $grade->save();

        return response()->json([
            'message' => 'Nota u ruajt me sukses!',
            'grade' => $grade
        ]);
    }
}