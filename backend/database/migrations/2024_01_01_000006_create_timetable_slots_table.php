<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timetable_slots', function (Blueprint $table) {
            $table->id();

            // Ditët e javës si numra: 1 = E hënë, 2 = E martë ... 5 = E premte
            $table->tinyInteger('day_of_week')->comment('1: E hënë, 2: E martë, 3: E mërkurë, 4: E enjte, 5: E premte');

            // Numri i orës mësimore (1, 2, 3, 4, 5, 6, 7)
            $table->unsignedTinyInteger('slot_number');

            // Foreign Keys me lidhje direkte
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_user_id')->constrained('users')->cascadeOnDelete();

            // Koha (opsionale)
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            $table->timestamps();

            // Constraints unike për të parandaluar duplikimet/konfliktet
            $table->unique(
                ['academic_year_id', 'day_of_week', 'slot_number', 'teacher_user_id'],
                'teacher_schedule_unique'
            );

            $table->unique(
                ['academic_year_id', 'day_of_week', 'slot_number', 'class_id'],
                'class_schedule_unique'
            );

            // Indexes për përshpejtimin e filtreve në dashboard
            $table->index(['class_id', 'academic_year_id']);
            $table->index(['teacher_user_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_slots');
    }
};