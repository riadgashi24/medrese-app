<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('homeroom_staff_id')->nullable()->constrained('staff')->nullOnDelete()->after('academic_year_id');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['homeroom_staff_id']);
            $table->dropColumn('homeroom_staff_id');
        });
    }
};
