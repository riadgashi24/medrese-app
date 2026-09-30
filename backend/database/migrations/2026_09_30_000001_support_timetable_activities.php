<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timetable_slots', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_id')->nullable()->change();
            $table->string('activity_label')->nullable();
            $table->boolean('is_provisional')->default(false);
        });
    }

    public function down(): void
    {
        // Preserve activity records on rollback; subject_id remains nullable.
        Schema::table('timetable_slots', function (Blueprint $table) {
            $table->dropColumn(['activity_label', 'is_provisional']);
        });
    }
};
