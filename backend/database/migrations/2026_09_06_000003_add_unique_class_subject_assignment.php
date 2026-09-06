<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::table('class_subject')
            ->select('class_model_id', 'subject_id')
            ->groupBy('class_model_id', 'subject_id')
            ->get()
            ->each(function ($assignment) {
                $duplicates = DB::table('class_subject')
                    ->where('class_model_id', $assignment->class_model_id)
                    ->where('subject_id', $assignment->subject_id)
                    ->orderBy('id')
                    ->pluck('id');

                if ($duplicates->count() > 1) {
                    DB::table('class_subject')->whereIn('id', $duplicates->slice(1)->all())->delete();
                }
            });

        Schema::table('class_subject', function (Blueprint $table) {
            $table->unique(['class_model_id', 'subject_id'], 'class_subject_unique');
            $table->index('teacher_user_id', 'class_subject_teacher_index');
        });
    }

    public function down(): void
    {
        Schema::table('class_subject', function (Blueprint $table) {
            $table->dropIndex('class_subject_teacher_index');
            $table->dropUnique('class_subject_unique');
        });
    }
};
