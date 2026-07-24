<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dorm_rooms', function (Blueprint $table) {
            $table->integer('floor')->default(2)->after('dorm_block');
        });

        Schema::create('dorm_inspection_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('dorm_inspections')->cascadeOnDelete();
            $table->string('item_key'); // 'beds', 'floor', 'wardrobes', 'trash', 'study_discipline', 'lights', 'noise'
            $table->string('item_label'); // 'Shtretërit', 'Dyshemeja', etc.
            $table->boolean('passed')->default(true);
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        Schema::create('room_weekly_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dorm_room_id')->constrained()->cascadeOnDelete();
            $table->integer('week_number');
            $table->integer('year');
            $table->decimal('avg_score', 5, 2)->default(0);
            $table->integer('rank')->nullable();
            $table->timestamps();
            $table->unique(['dorm_room_id', 'week_number', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_weekly_scores');
        Schema::dropIfExists('dorm_inspection_items');
        Schema::table('dorm_rooms', function (Blueprint $table) {
            $table->dropColumn('floor');
        });
    }
};
