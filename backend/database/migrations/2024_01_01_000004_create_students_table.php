<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            // Student ID i gjeneruar automatikisht
            $table->string('student_id')->unique();

            // Personal Information
            $table->string('first_name');
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['Male', 'Female'])->nullable();

            // Contact
            $table->string('municipality');
            $table->string('address')->nullable();
            $table->string('student_email')->nullable();

            // Parent / Guardian
            $table->string('parent_name');
            $table->string('parent_phone');
            $table->string('parent_phone_secondary')->nullable();

            // School Information
            $table->foreignId('class_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('type', [
                'Regular',
                'Boarding'
            ])->default('Regular');

            $table->enum('status', [
                'Active',
                'Graduated',
                'Transferred',
                'Withdrawn'
            ])->default('Active');

            // Login account (optional)
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};