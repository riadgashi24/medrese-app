<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['email' => 'director@medrese.edu', 'name' => 'Ekrem Maqedonci', 'role' => 'director'],
            ['email' => 'secretary@medrese.edu', 'name' => 'Vahid Sadiku', 'role' => 'secretary'],
            ['email' => 'cashier@medrese.edu', 'name' => 'Arkatar', 'role' => 'cashier'],
            ['email' => 'educator@medrese.edu', 'name' => 'Edukator', 'role' => 'educator'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                ['name' => $user['name'], 'password' => Hash::make('demo123'), 'role' => $user['role']]
            );
        }
    }
}