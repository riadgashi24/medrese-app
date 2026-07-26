<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Pastro duplikatet para se të shtojmë unique constraint
        // Përdor JOIN në vend të subquery për të shmangur errorin MySQL 1093
        DB::statement('
            DELETE c1 FROM classes c1
            INNER JOIN classes c2
            WHERE c1.id > c2.id
            AND c1.academic_year_id = c2.academic_year_id
            AND c1.name = c2.name
        ');

        Schema::table('classes', function (Blueprint $table) {
            // Unique constraint për të parandaluar duplikatet në nivel databaze
            $table->unique(['academic_year_id', 'name'], 'classes_year_name_unique');

            // Indeks për kërkim më të shpejtë sipas vitit akademik
            $table->index('academic_year_id', 'classes_academic_year_id_index');

            // Indeks për homeroom_staff_id
            $table->index('homeroom_staff_id', 'classes_homeroom_staff_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropIndex('classes_homeroom_staff_id_index');
            $table->dropIndex('classes_academic_year_id_index');
            $table->dropUnique('classes_year_name_unique');
        });
    }
};
