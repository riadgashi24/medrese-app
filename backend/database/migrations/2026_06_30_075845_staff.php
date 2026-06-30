<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('first_name');
            $table->string('last_name');

            $table->string('personal_number')->nullable();

            $table->enum('gender', ['Male', 'Female']);

            $table->date('birth_date')->nullable();

            $table->string('phone')->nullable();

            $table->string('email')->nullable();

            $table->string('position');

            $table->string('department')->nullable();

            $table->date('hire_date')->nullable();

            $table->enum('status', [
                'Active',
                'On Leave',
                'Inactive'
            ])->default('Active');

            $table->string('photo')->nullable();

            $table->string('address')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};