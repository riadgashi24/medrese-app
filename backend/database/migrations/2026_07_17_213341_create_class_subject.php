<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Përditësojmë tabelën subjects me fushat e kategorisë dhe nivelit (klasës)
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'category')) {
                $table->string('category')->nullable()->after('name');
            }
            if (!Schema::hasColumn('subjects', 'level')) {
                $table->integer('level')->nullable()->after('category'); // 10, 11, 12
            }
        });

        // Krijojmë tabelën e re lidhëse që përcakton cilat lëndë ligjërohen në cilat klasë, nga kush dhe sa orë
        Schema::create('class_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_model_id')->constrained('classes')->onDelete('cascade'); // Përputhet me ClassModel
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_user_id')->constrained('users')->onDelete('cascade'); 
            $table->integer('weekly_hours')->default(2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_subject');
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['category', 'level']);
        });
    }
};