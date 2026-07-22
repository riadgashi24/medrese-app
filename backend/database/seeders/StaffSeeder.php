<?php

namespace Database\Seeders;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        $teachersData = [
            ['name' => 'Jakup Çunaku', 'dept' => 'Kuran/Tefsir'],
            ['name' => 'Shemsi Rrahimi', 'dept' => 'Gj.turke/Hist.'],
            ['name' => 'Xh Rusinovci', 'dept' => 'Gj.angleze'],
            ['name' => 'M Tërnava', 'dept' => 'Akaid'],
            ['name' => 'Samir Ahmeti', 'dept' => 'Histori'],
            ['name' => 'Rrahim Aliu', 'dept' => 'Hadith/Akaid'],
            ['name' => 'Adnan Simnica', 'dept' => 'Tefsir/Shk. Kuranit'],
            ['name' => 'Driton Arifi', 'dept' => 'Fikh/Kuran/Dave'],
            ['name' => 'Muhamed Stublla', 'dept' => 'Kuran/Fikh/Usul'],
            ['name' => 'Hysni Beka', 'dept' => 'Gj. arabe'],
            ['name' => 'Shkelzen Hoxha', 'dept' => 'Gj. arabe'],
            ['name' => 'Kujtim Jashanica', 'dept' => 'Gj. arabe'],
            ['name' => 'Besnik Jaha', 'dept' => 'Gj.shqipe'],
            ['name' => 'Xhevdet Podrimja', 'dept' => 'Fizikë'],
            ['name' => 'Safet Avdiu', 'dept' => 'Gjeografi'],
            ['name' => 'Nexhat Berisha', 'dept' => 'Biologji'],
            ['name' => 'Dëfrim Brajshori', 'dept' => 'Matematikë'],
            ['name' => 'Islam Sejdiu', 'dept' => 'TIK'],
            ['name' => 'Adem Sahiti', 'dept' => 'Psikologji/Sociologji'],
            ['name' => 'Armend Qafleshi', 'dept' => 'Kimi'],
            ['name' => 'Valon Brajshori', 'dept' => 'Ed fizike'],
            ['name' => 'Hatixhe Sadriu', 'dept' => 'Kuran/Ahlak'],
            ['name' => 'Valbona Asllani', 'dept' => 'Kuran/Ahlak'],
            ['name' => 'Shaha Memishi', 'dept' => 'Gj.shqipe'],
            ['name' => 'Violina Asllani', 'dept' => 'Matematikë'],
            ['name' => 'Liriana Gërvalla', 'dept' => 'Psikologji/Sociologji'],
            ['name' => 'Granita Zenuni', 'dept' => 'Fizikë'],
            ['name' => 'Erblina Krasniqi', 'dept' => 'TIK'],
            ['name' => 'Shkurte Gashi', 'dept' => 'Biologji'],
            ['name' => 'Nita Pireva', 'dept' => 'Gj. Angleze'],
            ['name' => 'Zejnepe Abdyli', 'dept' => 'Gjeografi'],
            ['name' => 'Florina Sefa', 'dept' => 'Matematikë'],
            ['name' => 'Kosovare Jashari', 'dept' => 'Kimi'],
        ];

        foreach ($teachersData as $t) {
            $emailName = strtolower(str_replace([' ', '.'], ['', ''], $t['name']));

            $user = User::updateOrCreate(
                ['email' => "{$emailName}@medrese.edu"],
                ['name' => $t['name'], 'password' => Hash::make('demo123'), 'role' => 'teacher']
            );

            $parts = explode(' ', $t['name']);
            Staff::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => $parts[0],
                    'last_name' => $parts[1] ?? '',
                    'position' => 'Profesor',
                    'department' => $t['dept'],
                    'gender' => 'Male',
                    'status' => 'Active',
                    'hire_date' => now()->subYears(2)->toDateString()
                ]
            );
        }
    }
}