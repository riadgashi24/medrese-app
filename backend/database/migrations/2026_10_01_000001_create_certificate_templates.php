<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id(); $table->unsignedTinyInteger('level')->unique();
            $table->string('name'); $table->string('path');
            $table->decimal('width_mm', 8, 2); $table->decimal('height_mm', 8, 2);
            $table->json('fields'); $table->boolean('active')->default(false);
            $table->unsignedInteger('revision')->default(1); $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('certificate_templates'); }
};
