<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_user_id')->constrained('users');
            $table->unsignedTinyInteger('period');
            $table->unsignedTinyInteger('grade');
            $table->timestamps();
            $table->unique(['student_id', 'subject_id', 'academic_year_id', 'period'], 'period_grade_unique');
        });
        Schema::create('lesson_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_user_id')->constrained('users');
            $table->foreignId('portal_entry_id')->nullable()->constrained('portal_entries')->nullOnDelete();
            $table->string('title');
            $table->date('lesson_date');
            $table->unsignedTinyInteger('slot_number');
            $table->timestamps();
            $table->unique(['class_id', 'lesson_date', 'slot_number'], 'class_lesson_unique');
            $table->unique(['teacher_user_id', 'lesson_date', 'slot_number'], 'teacher_lesson_unique');
        });
        Schema::create('lesson_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('status', 16);
            $table->timestamps();
            $table->unique(['lesson_session_id', 'student_id']);
        });
        Schema::table('assignments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('assignments', fn (Blueprint $table) => $table->dropColumn('completed_at'));
        Schema::dropIfExists('lesson_attendances');
        Schema::dropIfExists('lesson_sessions');
        Schema::dropIfExists('period_grades');
    }
};
