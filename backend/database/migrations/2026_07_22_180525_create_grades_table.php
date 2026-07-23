<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            
            $table->unsignedTinyInteger('term_1_grade')->nullable(); // 1 - 5
            $table->unsignedTinyInteger('term_2_grade')->nullable(); // 1 - 5
            $table->unsignedTinyInteger('final_grade')->nullable();  // 1 - 5 (NP)
            $table->boolean('is_final_overridden')->default(false);  // A është ndryshuar nga drejtori?

            $table->timestamps();

            // Një student ka vetëm një regjistër notash për një lëndë brenda një viti akademik
            $table->unique(['student_id', 'subject_id', 'academic_year_id'], 'student_subject_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};