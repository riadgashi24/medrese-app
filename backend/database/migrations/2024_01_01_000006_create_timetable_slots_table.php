<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timetable_slots', function (Blueprint $table) {
            $table->id();

            // Ditët e javës (E hënë, E martë, etj.)
            $table->string('day');

            // Numri i orës mësimore (p.sh. 1, 2, 3, 4, 5, 6, 7 si në foto)
            $table->integer('slot_number');

            // Koha e fillimit dhe mbarimit (opsionale, nëse orari ndryshon sipas ndërrimeve)
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            // Lidhja me klasën (p.sh. 12/2, 11/3 që shihen në kutia)
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();

            // Lidhja me lëndën (p.sh. Kuran, Gj.angleze, Matematikë)
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();

            // Lidhja me Profesorin (p.sh. Jakup Çunaku, Shemsi Rrahimi)
            $table->foreignId('teacher_user_id')->constrained('users')->cascadeOnDelete();

            // Viti akademik (p.sh. 2025/2026 si në titull)
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();

            $table->timestamps();

            // Sigurohet që një profesor nuk mund të jetë në dy klasa të ndryshme në të njëjtën ditë dhe orë
            $table->unique(['day', 'slot_number', 'teacher_user_id', 'academic_year_id'], 'teacher_schedule_unique');

            // Sigurohet që një klasë nuk mund të ketë dy lëndë/profesorë në të njëjtën ditë dhe orë
            $table->unique(['day', 'slot_number', 'class_id', 'academic_year_id'], 'class_schedule_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_slots');
    }
};