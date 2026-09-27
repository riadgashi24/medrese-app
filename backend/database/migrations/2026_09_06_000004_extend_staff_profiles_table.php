<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('role')->default('other')->after('user_id');
            $table->string('employee_number')->nullable()->unique()->after('personal_number');
            $table->string('personal_phone')->nullable()->after('phone');
            $table->string('place_of_birth')->nullable()->after('birth_date');
            $table->string('city')->nullable()->after('address');
            $table->string('education')->nullable()->after('department');
            $table->string('qualification')->nullable()->after('education');
            $table->string('specialization')->nullable()->after('qualification');
        });

        DB::table('staff')->whereNull('role')->orWhere('role', 'other')->update([
            'role' => DB::raw("CASE
                WHEN LOWER(position) LIKE '%drejtor%' THEN 'director'
                WHEN LOWER(position) LIKE '%sekretar%' THEN 'secretary'
                WHEN LOWER(position) LIKE '%arkatar%' THEN 'cashier'
                WHEN LOWER(position) LIKE '%edukator%' THEN 'educator'
                WHEN LOWER(position) LIKE '%profesor%' OR LOWER(position) LIKE '%mësues%' THEN 'teacher'
                ELSE 'other' END"),
        ]);
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropUnique(['employee_number']);
            $table->dropColumn([
                'role',
                'employee_number',
                'personal_phone',
                'place_of_birth',
                'city',
                'education',
                'qualification',
                'specialization',
            ]);
        });
    }
};
