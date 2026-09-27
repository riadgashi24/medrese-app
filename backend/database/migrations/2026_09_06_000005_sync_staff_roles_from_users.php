<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('users')->whereIn('role', ['director', 'secretary', 'teacher', 'educator', 'cashier'])
            ->orderBy('id')->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('staff')->where('user_id', $user->id)->update(['role' => $user->role]);
                }
            });
    }

    public function down(): void
    {
        // Role values are derived from the linked user when available.
    }
};
