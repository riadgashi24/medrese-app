<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            // absence_type: 'Unjustified' (default when teacher reports), 'Excused' or 'Unexcused' after homeroom review
            $table->enum('absence_type', ['Unjustified', 'Excused', 'Unexcused'])
                ->default('Unjustified')
                ->after('status');
            
            // Who excused/unexcused it (homeroom teacher)
            $table->foreignId('excused_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('recorded_by_user_id');
            
            // When it was reviewed
            $table->timestamp('excused_at')
                ->nullable()
                ->after('excused_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['absence_type', 'excused_by_user_id', 'excused_at']);
        });
    }
};
