<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homeroom_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->unique()->constrained('classes')->cascadeOnDelete();
            $table->json('data');
            $table->timestamps();
        });
        Schema::create('homeroom_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->json('data');
            $table->timestamps();
            $table->unique(['class_id', 'student_id']);
        });
        Schema::create('homeroom_absences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('month', 7);
            $table->unsignedInteger('excused');
            $table->unsignedInteger('unexcused');
            $table->string('note', 500)->nullable();
            $table->timestamps();
            $table->unique(['class_id', 'student_id', 'month']);
        });
        Schema::create('homeroom_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('term', 2);
            $table->unsignedInteger('held')->nullable();
            $table->unsignedInteger('missed')->default(0);
            $table->timestamps();
            $table->unique(['class_id', 'subject_id', 'term']);
        });
        Schema::create('homeroom_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['homeroom_changes', 'homeroom_hours', 'homeroom_absences', 'homeroom_profiles', 'homeroom_settings'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
