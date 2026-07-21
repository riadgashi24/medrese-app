<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('day_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->string('day'); // 'E hënë', 'E martë', etc.
            $table->string('supervisor_names'); // Emrat e kujdestarëve të ditës
            $table->timestamps();

            $table->unique(['academic_year_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('day_supervisors');
    }
};