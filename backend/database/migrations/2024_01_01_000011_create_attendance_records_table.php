<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            // Ruajmë vetëm përjashtimet (mungesat / vonesat)
            $table->enum('status', ['Absent', 'Late', 'Excused'])->default('Absent');
            $table->string('note')->nullable();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Index për performancë maksimale gjatë raporteve
            $table->unique(['class_id', 'student_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
