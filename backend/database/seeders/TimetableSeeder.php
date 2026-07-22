<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use Illuminate\Database\Seeder;

class TimetableSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        if (!$academicYear) {
            return;
        }

        // Të dhënat nga fotoja: [Profesori, Dita, Ora, Klasa]
        $scheduleGrid = [
            // 1. Jakup Çunaku
            ['Jakup Çunaku', 'E hënë', 1, '12/2'],
            ['Jakup Çunaku', 'E hënë', 2, '11/2'],
            ['Jakup Çunaku', 'E hënë', 3, '12/2'],
            ['Jakup Çunaku', 'E hënë', 4, '12/1'],
            ['Jakup Çunaku', 'E martë', 1, '11/2'],
            ['Jakup Çunaku', 'E martë', 2, '12/2'],
            ['Jakup Çunaku', 'E martë', 3, '12/4'],
            ['Jakup Çunaku', 'E mërkurë', 1, '12/2'],
            ['Jakup Çunaku', 'E mërkurë', 2, '11/2'],
            ['Jakup Çunaku', 'E mërkurë', 3, '12/2'],
            ['Jakup Çunaku', 'E mërkurë', 4, '12/4'],
            ['Jakup Çunaku', 'E mërkurë', 5, '12/1'],
            ['Jakup Çunaku', 'E mërkurë', 6, '12/3'],
            ['Jakup Çunaku', 'E enjte', 1, '11/2'],
            ['Jakup Çunaku', 'E enjte', 2, '12/2'],
            ['Jakup Çunaku', 'E enjte', 3, '12/3'],
            ['Jakup Çunaku', 'E enjte', 4, '12/1'],
            ['Jakup Çunaku', 'E premte', 1, '11/2'],
            ['Jakup Çunaku', 'E premte', 2, '12/2'],
            ['Jakup Çunaku', 'E premte', 3, '12/1'],

            // 2. Shemsi Rrahimi
            ['Shemsi Rrahimi', 'E hënë', 1, '10/2'],
            ['Shemsi Rrahimi', 'E hënë', 2, '10/3'],
            ['Shemsi Rrahimi', 'E hënë', 3, '10/1'],
            ['Shemsi Rrahimi', 'E hënë', 4, '10/4'],
            ['Shemsi Rrahimi', 'E martë', 1, '10/1'],
            ['Shemsi Rrahimi', 'E martë', 2, '10/1'],
            ['Shemsi Rrahimi', 'E enjte', 1, '10/3'],
            ['Shemsi Rrahimi', 'E enjte', 2, '10/4'],
            ['Shemsi Rrahimi', 'E enjte', 3, '10/2'],
            ['Shemsi Rrahimi', 'E enjte', 4, '10/1'],

            // 3. Xh Rusinovci
            ['Xh Rusinovci', 'E hënë', 4, '12/4'],
            ['Xh Rusinovci', 'E hënë', 5, '11/2'],
            ['Xh Rusinovci', 'E hënë', 6, '10/2'],
            ['Xh Rusinovci', 'E hënë', 7, '11/3'],
            ['Xh Rusinovci', 'E martë', 4, '11/4'],
            ['Xh Rusinovci', 'E martë', 5, '12/3'],
            ['Xh Rusinovci', 'E martë', 6, '12/2'],
            ['Xh Rusinovci', 'E martë', 7, '12/1'],
            ['Xh Rusinovci', 'E mërkurë', 5, '11/1'],
            ['Xh Rusinovci', 'E mërkurë', 6, '11/3'],
            ['Xh Rusinovci', 'E mërkurë', 7, '10/1'],
            ['Xh Rusinovci', 'E enjte', 4, '12/2'],
            ['Xh Rusinovci', 'E enjte', 5, '12/1'],
            ['Xh Rusinovci', 'E enjte', 6, '11/4'],
            ['Xh Rusinovci', 'E enjte', 7, '11/2'],
            ['Xh Rusinovci', 'E premte', 5, '12/4'],
            ['Xh Rusinovci', 'E premte', 6, '10/1'],
            ['Xh Rusinovci', 'E premte', 7, '10/2'],

            // 4. M Tërnava
            ['M Tërnava', 'E hënë', 1, '11/3'],
            ['M Tërnava', 'E hënë', 2, '12/3'],
            ['M Tërnava', 'E hënë', 3, '12/4'],
            ['M Tërnava', 'E hënë', 4, '11/1'],
            ['M Tërnava', 'E hënë', 5, '12/1'],
            ['M Tërnava', 'E martë', 1, '10/2'],
            ['M Tërnava', 'E martë', 2, '11/4'],
            ['M Tërnava', 'E martë', 3, '11/5'],
            ['M Tërnava', 'E mërkurë', 1, '12/3'],
            ['M Tërnava', 'E mërkurë', 2, '12/2'],
            ['M Tërnava', 'E mërkurë', 3, '11/1'],
            ['M Tërnava', 'E mërkurë', 4, '10/2'],
            ['M Tërnava', 'E mërkurë', 5, '12/3'],
            ['M Tërnava', 'E mërkurë', 6, '10/2'],
            ['M Tërnava', 'E enjte', 1, '11/3'],
            ['M Tërnava', 'E enjte', 2, '11/5'],
            ['M Tërnava', 'E enjte', 3, '11/4'],
            ['M Tërnava', 'E enjte', 4, '11/2'],
            ['M Tërnava', 'E enjte', 5, '12/4'],
            ['M Tërnava', 'E premte', 1, '12/4'],
            ['M Tërnava', 'E premte', 2, '12/1'],
            ['M Tërnava', 'E premte', 3, '12/1'],
            ['M Tërnava', 'E premte', 4, '12/1'],
            ['M Tërnava', 'E premte', 5, '12/2'],
            ['M Tërnava', 'E premte', 6, '12/2'],
            ['M Tërnava', 'E premte', 7, '10/3'],

            // 5. Samir Ahmeti
            ['Samir Ahmeti', 'E hënë', 1, '12/4'],
            ['Samir Ahmeti', 'E hënë', 2, '11/5'],
            ['Samir Ahmeti', 'E hënë', 3, '11/2'],
            ['Samir Ahmeti', 'E martë', 1, '12/3'],
            ['Samir Ahmeti', 'E martë', 2, '11/3'],
            ['Samir Ahmeti', 'E martë', 3, '11/1'],
            ['Samir Ahmeti', 'E martë', 4, '10/3'],
            ['Samir Ahmeti', 'E mërkurë', 2, '10/2'],
            ['Samir Ahmeti', 'E mërkurë', 3, '11/2'],
            ['Samir Ahmeti', 'E mërkurë', 4, '12/3'],
            ['Samir Ahmeti', 'E mërkurë', 5, '10/2'],
            ['Samir Ahmeti', 'E mërkurë', 7, '11/5'],
            ['Samir Ahmeti', 'E enjte', 1, '11/1'],
            ['Samir Ahmeti', 'E enjte', 2, '11/4'],
            ['Samir Ahmeti', 'E enjte', 3, '11/5'],
            ['Samir Ahmeti', 'E enjte', 4, '10/4'],
            ['Samir Ahmeti', 'E enjte', 5, '12/4'],
            ['Samir Ahmeti', 'E premte', 1, '11/3'],
            ['Samir Ahmeti', 'E premte', 2, '10/4'],
            ['Samir Ahmeti', 'E premte', 3, '11/4'],

            // 6. Rrahim Aliu
            ['Rrahim Aliu', 'E hënë', 1, '11/1'],
            ['Rrahim Aliu', 'E hënë', 3, '10/1'],
            ['Rrahim Aliu', 'E hënë', 4, '11/5'],
            ['Rrahim Aliu', 'E hënë', 5, '12/1'],
            ['Rrahim Aliu', 'E hënë', 6, '11/2'],
            ['Rrahim Aliu', 'E martë', 5, '11/4'],
            ['Rrahim Aliu', 'E martë', 6, '12/4'],
            ['Rrahim Aliu', 'E mërkurë', 1, '11/5'],
            ['Rrahim Aliu', 'E mërkurë', 2, '11/4'],
            ['Rrahim Aliu', 'E mërkurë', 4, '12/2'],
            ['Rrahim Aliu', 'E mërkurë', 6, '11/3'],
            ['Rrahim Aliu', 'E mërkurë', 7, '11/1'],
            ['Rrahim Aliu', 'E enjte', 1, '12/1'],
            ['Rrahim Aliu', 'E enjte', 2, '11/3'],
            ['Rrahim Aliu', 'E enjte', 4, '12/2'],
            ['Rrahim Aliu', 'E enjte', 6, '12/4'],
            ['Rrahim Aliu', 'E enjte', 7, '12/3'],
            ['Rrahim Aliu', 'E premte', 1, '12/3'],
            ['Rrahim Aliu', 'E premte', 2, '11/2'],
            ['Rrahim Aliu', 'E premte', 3, '10/1'],
            ['Rrahim Aliu', 'E premte', 7, '12/4'],

            // 7. Adnan Simnica
            ['Adnan Simnica', 'E hënë', 3, '11/5'],
            ['Adnan Simnica', 'E hënë', 4, '11/4'],
            ['Adnan Simnica', 'E hënë', 5, '11/1'],
            ['Adnan Simnica', 'E hënë', 6, '11/2'],
            ['Adnan Simnica', 'E hënë', 7, '12/3'],
            ['Adnan Simnica', 'E martë', 4, '11/1'],
            ['Adnan Simnica', 'E martë', 6, '11/2'],
            ['Adnan Simnica', 'E martë', 7, '12/2'],
            ['Adnan Simnica', 'E mërkurë', 3, '11/4'],
            ['Adnan Simnica', 'E mërkurë', 4, '11/4'],
            ['Adnan Simnica', 'E mërkurë', 5, '11/2'],
            ['Adnan Simnica', 'E mërkurë', 6, '12/4'],
            ['Adnan Simnica', 'E mërkurë', 7, '11/2'],
            ['Adnan Simnica', 'E enjte', 4, '11/1'],
            ['Adnan Simnica', 'E enjte', 5, '11/3'],
            ['Adnan Simnica', 'E enjte', 6, '11/5'],
            ['Adnan Simnica', 'E enjte', 7, '12/1'],
            ['Adnan Simnica', 'E premte', 3, '11/3'],
            ['Adnan Simnica', 'E premte', 5, '11/1'],
            ['Adnan Simnica', 'E premte', 6, '11/4'],
            ['Adnan Simnica', 'E premte', 7, '12/1'],

            // 8. Driton Arifi
            ['Driton Arifi', 'E hënë', 1, '11/3'],
            ['Driton Arifi', 'E hënë', 2, '11/4'],
            ['Driton Arifi', 'E hënë', 3, '12/2'],
            ['Driton Arifi', 'E hënë', 4, '12/1'],
            ['Driton Arifi', 'E hënë', 5, '11/3'],
            ['Driton Arifi', 'E hënë', 6, '11/3'],
            ['Driton Arifi', 'E martë', 4, '11/3'],
            ['Driton Arifi', 'E martë', 5, '10/2'],
            ['Driton Arifi', 'E martë', 6, '12/2'],
            ['Driton Arifi', 'E martë', 7, '12/3'],
            ['Driton Arifi', 'E mërkurë', 1, '12/3'],
            ['Driton Arifi', 'E mërkurë', 2, '11/3'],
            ['Driton Arifi', 'E mërkurë', 3, '12/4'],
            ['Driton Arifi', 'E mërkurë', 4, '12/1'],
            ['Driton Arifi', 'E mërkurë', 5, '11/2'],
            ['Driton Arifi', 'E mërkurë', 6, '10/2'],
            ['Driton Arifi', 'E mërkurë', 7, '11/4'],
            ['Driton Arifi', 'E enjte', 4, '10/2'],
            ['Driton Arifi', 'E enjte', 5, '11/3'],
            ['Driton Arifi', 'E enjte', 6, '12/3'],
            ['Driton Arifi', 'E enjte', 7, '11/3'],
            ['Driton Arifi', 'E premte', 1, '10/2'],
            ['Driton Arifi', 'E premte', 2, '11/1'],
            ['Driton Arifi', 'E premte', 3, '11/3'],
            ['Driton Arifi', 'E premte', 4, '12/4'],

            // 9. Ekrem Maqedonci
            ['Ekrem Maqedonci', 'E hënë', 2, '10/1'],
            ['Ekrem Maqedonci', 'E hënë', 3, '11/1'],
            ['Ekrem Maqedonci', 'E hënë', 5, '10/1'],
            ['Ekrem Maqedonci', 'E hënë', 6, '11/5'],
            ['Ekrem Maqedonci', 'E hënë', 7, '12/2'],
            ['Ekrem Maqedonci', 'E martë', 1, '11/1'],
            ['Ekrem Maqedonci', 'E martë', 2, '10/2'],
            ['Ekrem Maqedonci', 'E martë', 3, '12/1'],
            ['Ekrem Maqedonci', 'E martë', 4, '11/5'],
            ['Ekrem Maqedonci', 'E martë', 5, '12/1'],
            ['Ekrem Maqedonci', 'E mërkurë', 1, '11/1'],
            ['Ekrem Maqedonci', 'E mërkurë', 2, '11/5'],
            ['Ekrem Maqedonci', 'E mërkurë', 3, '10/1'],
            ['Ekrem Maqedonci', 'E mërkurë', 4, '10/1'],
            ['Ekrem Maqedonci', 'E enjte', 1, '11/5'],
            ['Ekrem Maqedonci', 'E enjte', 2, '10/2'],
            ['Ekrem Maqedonci', 'E enjte', 4, '12/4'],
            ['Ekrem Maqedonci', 'E enjte', 5, '10/1'],
            ['Ekrem Maqedonci', 'E enjte', 6, '12/1'],
            ['Ekrem Maqedonci', 'E enjte', 7, '11/1'],
            ['Ekrem Maqedonci', 'E premte', 1, '12/2'],
            ['Ekrem Maqedonci', 'E premte', 2, '10/1'],
            ['Ekrem Maqedonci', 'E premte', 3, '11/1'],
            ['Ekrem Maqedonci', 'E premte', 4, '12/3'],
            ['Ekrem Maqedonci', 'E premte', 5, '11/1'],
            ['Ekrem Maqedonci', 'E premte', 6, '11/5'],

            // 10. Hysni Beka
            ['Hysni Beka', 'E hënë', 3, '11/4'],
            ['Hysni Beka', 'E hënë', 4, '11/4'],
            ['Hysni Beka', 'E martë', 3, '11/2'],
            ['Hysni Beka', 'E martë', 4, '11/2'],
            ['Hysni Beka', 'E martë', 5, '11/3'],
            ['Hysni Beka', 'E martë', 6, '11/5'],
            ['Hysni Beka', 'E martë', 7, '11/3'],
            ['Hysni Beka', 'E mërkurë', 2, '11/4'],
            ['Hysni Beka', 'E mërkurë', 3, '11/2'],
            ['Hysni Beka', 'E enjte', 1, '11/4'],
            ['Hysni Beka', 'E enjte', 3, '11/2'],
            ['Hysni Beka', 'E enjte', 4, '11/3'],
            ['Hysni Beka', 'E enjte', 5, '11/5'],
            ['Hysni Beka', 'E enjte', 7, '11/5'],
            ['Hysni Beka', 'E premte', 4, '11/2'],
            ['Hysni Beka', 'E premte', 5, '11/2'],
            ['Hysni Beka', 'E premte', 6, '11/3'],
            ['Hysni Beka', 'E premte', 7, '11/3'],

            // 11. Shkelzen Hoxha
            ['Shkelzen Hoxha', 'E hënë', 1, '10/3'],
            ['Shkelzen Hoxha', 'E hënë', 2, '10/4'],
            ['Shkelzen Hoxha', 'E hënë', 4, '10/3'],
            ['Shkelzen Hoxha', 'E hënë', 5, '10/2'],
            ['Shkelzen Hoxha', 'E hënë', 6, '11/1'],
            ['Shkelzen Hoxha', 'E hënë', 7, '11/1'],
            ['Shkelzen Hoxha', 'E martë', 1, '10/3'],
            ['Shkelzen Hoxha', 'E martë', 2, '11/1'],
            ['Shkelzen Hoxha', 'E martë', 4, '10/4'],
            ['Shkelzen Hoxha', 'E martë', 5, '10/3'],
            ['Shkelzen Hoxha', 'E martë', 6, '10/2'],
            ['Shkelzen Hoxha', 'E martë', 7, '10/1'],
            ['Shkelzen Hoxha', 'E mërkurë', 2, '10/1'],
            ['Shkelzen Hoxha', 'E mërkurë', 3, '10/4'],
            ['Shkelzen Hoxha', 'E mërkurë', 4, '10/3'],
            ['Shkelzen Hoxha', 'E mërkurë', 5, '10/1'],
            ['Shkelzen Hoxha', 'E mërkurë', 6, '11/1'],
            ['Shkelzen Hoxha', 'E mërkurë', 7, '10/2'],
            ['Shkelzen Hoxha', 'E enjte', 2, '11/1'],
            ['Shkelzen Hoxha', 'E enjte', 3, '10/4'],
            ['Shkelzen Hoxha', 'E enjte', 4, '10/3'],
            ['Shkelzen Hoxha', 'E enjte', 6, '10/1'],
            ['Shkelzen Hoxha', 'E enjte', 7, '10/2'],

            // 12. Kujtim Jashanica
            ['Kujtim Jashanica', 'E hënë', 4, '12/2'],
            ['Kujtim Jashanica', 'E hënë', 5, '12/3'],
            ['Kujtim Jashanica', 'E hënë', 6, '12/4'],
            ['Kujtim Jashanica', 'E hënë', 7, '12/1'],
            ['Kujtim Jashanica', 'E martë', 1, '12/4'],
            ['Kujtim Jashanica', 'E martë', 2, '12/3'],
            ['Kujtim Jashanica', 'E martë', 3, '12/2'],
            ['Kujtim Jashanica', 'E martë', 4, '12/1'],
            ['Kujtim Jashanica', 'E mërkurë', 1, '12/1'],
            ['Kujtim Jashanica', 'E mërkurë', 2, '12/4'],
            ['Kujtim Jashanica', 'E mërkurë', 3, '12/3'],
            ['Kujtim Jashanica', 'E mërkurë', 4, '10/4'],
            ['Kujtim Jashanica', 'E mërkurë', 5, '12/2'],
            ['Kujtim Jashanica', 'E enjte', 1, '12/3'],
            ['Kujtim Jashanica', 'E enjte', 2, '12/4'],
            ['Kujtim Jashanica', 'E enjte', 3, '12/1'],
            ['Kujtim Jashanica', 'E enjte', 4, '12/3'],
            ['Kujtim Jashanica', 'E enjte', 5, '12/2'],
            ['Kujtim Jashanica', 'E premte', 1, '12/1'],
            ['Kujtim Jashanica', 'E premte', 3, '10/4'],
            ['Kujtim Jashanica', 'E premte', 6, '12/4'],
            ['Kujtim Jashanica', 'E premte', 7, '12/2'],

            // 13. Besnik Jaha
            ['Besnik Jaha', 'E hënë', 1, '11/2'],
            ['Besnik Jaha', 'E hënë', 2, '12/1'],
            ['Besnik Jaha', 'E hënë', 4, '10/2'],
            ['Besnik Jaha', 'E hënë', 5, '12/2'],
            ['Besnik Jaha', 'E hënë', 6, '12/2'],
            ['Besnik Jaha', 'E hënë', 7, '10/1'],
            ['Besnik Jaha', 'E martë', 1, '12/1'],
            ['Besnik Jaha', 'E martë', 2, '11/2'],
            ['Besnik Jaha', 'E martë', 3, '10/1'],
            ['Besnik Jaha', 'E martë', 4, '12/2'],
            ['Besnik Jaha', 'E mërkurë', 1, '10/2'],
            ['Besnik Jaha', 'E mërkurë', 2, '11/1'],
            ['Besnik Jaha', 'E enjte', 1, '10/1'],
            ['Besnik Jaha', 'E enjte', 2, '12/1'],
            ['Besnik Jaha', 'E enjte', 3, '11/1'],
            ['Besnik Jaha', 'E premte', 1, '11/1'],
            ['Besnik Jaha', 'E premte', 2, '12/1'],
            ['Besnik Jaha', 'E premte', 3, '12/2'],
            ['Besnik Jaha', 'E premte', 4, '10/2'],
            ['Besnik Jaha', 'E premte', 5, '11/2'],
            ['Besnik Jaha', 'E premte', 6, '10/1'],

            // 14. Xhevdet Podrimja
            ['Xhevdet Podrimja', 'E martë', 5, '10/1'],
            ['Xhevdet Podrimja', 'E martë', 6, '10/2'],
            ['Xhevdet Podrimja', 'E enjte', 5, '11/2'],
            ['Xhevdet Podrimja', 'E enjte', 6, '11/1'],

            // 15. Safet Avdiu
            ['Safet Avdiu', 'E enjte', 6, '10/2'],
            ['Safet Avdiu', 'E enjte', 7, '10/1'],
            ['Safet Avdiu', 'E premte', 5, '10/1'],
            ['Safet Avdiu', 'E premte', 6, '10/2'],

            // 16. Nexhat Berisha
            ['Nexhat Berisha', 'E hënë', 1, '10/1'],
            ['Nexhat Berisha', 'E hënë', 2, '10/2'],
            ['Nexhat Berisha', 'E enjte', 1, '10/2'],
            ['Nexhat Berisha', 'E enjte', 2, '10/1'],

            // 17. Dëfrim Brajshori
            ['Dëfrim Brajshori', 'E hënë', 1, '12/1'],
            ['Dëfrim Brajshori', 'E hënë', 2, '11/1'],
            ['Dëfrim Brajshori', 'E hënë', 3, '10/2'],
            ['Dëfrim Brajshori', 'E martë', 1, '12/2'],
            ['Dëfrim Brajshori', 'E martë', 2, '12/1'],
            ['Dëfrim Brajshori', 'E martë', 3, '10/2'],
            ['Dëfrim Brajshori', 'E martë', 4, '10/1'],
            ['Dëfrim Brajshori', 'E martë', 5, '11/2'],
            ['Dëfrim Brajshori', 'E martë', 7, '11/1'],
            ['Dëfrim Brajshori', 'E enjte', 1, '12/2'],
            ['Dëfrim Brajshori', 'E enjte', 2, '11/2'],
            ['Dëfrim Brajshori', 'E enjte', 3, '10/1'],

            // 18. Islam Sejdiu
            ['Islam Sejdiu', 'E martë', 3, '10/4'],
            ['Islam Sejdiu', 'E martë', 4, '10/2'],
            ['Islam Sejdiu', 'E martë', 5, '11/1'],
            ['Islam Sejdiu', 'E martë', 6, '12/1'],
            ['Islam Sejdiu', 'E mërkurë', 1, '10/1'],
            ['Islam Sejdiu', 'E mërkurë', 2, '12/1'],
            ['Islam Sejdiu', 'E mërkurë', 3, '10/2'],
            ['Islam Sejdiu', 'E mërkurë', 5, '10/4'],
            ['Islam Sejdiu', 'E mërkurë', 6, '11/2'],
            ['Islam Sejdiu', 'E mërkurë', 7, '12/2'],

            // 19. Adem Sahiti
            ['Adem Sahiti', 'E martë', 4, '11/1'],
            ['Adem Sahiti', 'E martë', 5, '12/2'],
            ['Adem Sahiti', 'E martë', 6, '11/1'],
            ['Adem Sahiti', 'E premte', 5, '12/2'],
            ['Adem Sahiti', 'E premte', 6, '12/1'],
            ['Adem Sahiti', 'E premte', 7, '11/2'],

            // 20. Armend Qafleshi
            ['Armend Qafleshi', 'E hënë', 5, '10/1'],
            ['Armend Qafleshi', 'E hënë', 6, '10/2'],
            ['Armend Qafleshi', 'E premte', 1, '10/1'],
            ['Armend Qafleshi', 'E premte', 2, '10/2'],

            // 21. Valon Brajshori
            ['Valon Brajshori', 'E mërkurë', 5, '10/2'],
            ['Valon Brajshori', 'E mërkurë', 6, '12/1'],
            ['Valon Brajshori', 'E mërkurë', 7, '10/1'],
            ['Valon Brajshori', 'E enjte', 5, '11/1'],
            ['Valon Brajshori', 'E enjte', 6, '11/2'],
            ['Valon Brajshori', 'E enjte', 7, '12/2'],

            // 22. Hatixhe Sadriu
            ['Hatixhe Sadriu', 'E hënë', 2, '11/3'],
            ['Hatixhe Sadriu', 'E hënë', 3, '12/3'],
            ['Hatixhe Sadriu', 'E hënë', 4, '11/5'],
            ['Hatixhe Sadriu', 'E hënë', 5, '12/4'],
            ['Hatixhe Sadriu', 'E hënë', 6, '11/4'],
            ['Hatixhe Sadriu', 'E hënë', 7, '11/4'],
            ['Hatixhe Sadriu', 'E martë', 4, '12/3'],
            ['Hatixhe Sadriu', 'E martë', 6, '10/4'],
            ['Hatixhe Sadriu', 'E martë', 7, '11/4'],
            ['Hatixhe Sadriu', 'E mërkurë', 3, '11/5'],
            ['Hatixhe Sadriu', 'E mërkurë', 4, '11/3'],
            ['Hatixhe Sadriu', 'E mërkurë', 5, '11/4'],
            ['Hatixhe Sadriu', 'E mërkurë', 6, '11/5'],
            ['Hatixhe Sadriu', 'E mërkurë', 7, '12/4'],
            ['Hatixhe Sadriu', 'E enjte', 4, '11/4'],
            ['Hatixhe Sadriu', 'E enjte', 5, '11/3'],
            ['Hatixhe Sadriu', 'E enjte', 6, '11/4'],
            ['Hatixhe Sadriu', 'E enjte', 7, '10/4'],
            ['Hatixhe Sadriu', 'E premte', 4, '10/4'],
            ['Hatixhe Sadriu', 'E premte', 5, '10/3'],
            ['Hatixhe Sadriu', 'E premte', 6, '11/4'],
            ['Hatixhe Sadriu', 'E premte', 7, '12/3'],

            // 23. Valbona Asllani
            ['Valbona Asllani', 'E hënë', 1, '10/4'],
            ['Valbona Asllani', 'E hënë', 2, '10/3'],
            ['Valbona Asllani', 'E hënë', 3, '11/3'],
            ['Valbona Asllani', 'E hënë', 4, '12/3'],
            ['Valbona Asllani', 'E hënë', 5, '10/4'],
            ['Valbona Asllani', 'E hënë', 6, '12/3'],
            ['Valbona Asllani', 'E hënë', 7, '12/4'],
            ['Valbona Asllani', 'E martë', 1, '11/5'],
            ['Valbona Asllani', 'E martë', 2, '12/4'],
            ['Valbona Asllani', 'E martë', 3, '10/3'],
            ['Valbona Asllani', 'E mërkurë', 1, '10/4'],
            ['Valbona Asllani', 'E mërkurë', 2, '12/3'],
            ['Valbona Asllani', 'E mërkurë', 3, '10/3'],
            ['Valbona Asllani', 'E mërkurë', 5, '12/4'],
            ['Valbona Asllani', 'E enjte', 1, '12/4'],
            ['Valbona Asllani', 'E enjte', 2, '12/3'],
            ['Valbona Asllani', 'E enjte', 3, '10/3'],
            ['Valbona Asllani', 'E enjte', 4, '11/3'],
            ['Valbona Asllani', 'E enjte', 5, '10/4'],
            ['Valbona Asllani', 'E enjte', 6, '10/4'],
            ['Valbona Asllani', 'E enjte', 7, '12/4'],
            ['Valbona Asllani', 'E premte', 1, '11/5'],
            ['Valbona Asllani', 'E premte', 2, '12/4'],
            ['Valbona Asllani', 'E premte', 3, '10/3'],
            ['Valbona Asllani', 'E premte', 4, '10/4'],
            ['Valbona Asllani', 'E premte', 6, '12/3'],
            ['Valbona Asllani', 'E premte', 7, '10/4'],

            // 24. Shaha Memishi
            ['Shaha Memishi', 'E martë', 1, '11/4'],
            ['Shaha Memishi', 'E martë', 2, '10/4'],
            ['Shaha Memishi', 'E martë', 5, '11/5'],
            ['Shaha Memishi', 'E martë', 6, '12/3'],
            ['Shaha Memishi', 'E martë', 7, '10/4'],
            ['Shaha Memishi', 'E mërkurë', 1, '12/4'],
            ['Shaha Memishi', 'E mërkurë', 3, '11/3'],
            ['Shaha Memishi', 'E mërkurë', 4, '12/3'],
            ['Shaha Memishi', 'E mërkurë', 5, '11/5'],
            ['Shaha Memishi', 'E mërkurë', 7, '11/3'],
            ['Shaha Memishi', 'E enjte', 3, '12/4'],
            ['Shaha Memishi', 'E enjte', 4, '11/4'],
            ['Shaha Memishi', 'E enjte', 5, '10/3'],
            ['Shaha Memishi', 'E enjte', 6, '12/3'],
            ['Shaha Memishi', 'E enjte', 7, '10/3'],
            ['Shaha Memishi', 'E premte', 1, '11/4'],
            ['Shaha Memishi', 'E premte', 2, '11/5'],
            ['Shaha Memishi', 'E premte', 4, '10/3'],
            ['Shaha Memishi', 'E premte', 5, '10/4'],
            ['Shaha Memishi', 'E premte', 6, '12/4'],

            // 25. Violina Asllani
            ['Violina Asllani', 'E hënë', 1, '12/3'],
            ['Violina Asllani', 'E hënë', 2, '12/4'],
            ['Violina Asllani', 'E hënë', 3, '10/4'],
            ['Violina Asllani', 'E martë', 5, '10/4'],
            ['Violina Asllani', 'E martë', 6, '12/4'],
            ['Violina Asllani', 'E martë', 7, '10/3'],
            ['Violina Asllani', 'E premte', 4, '10/3'],
            ['Violina Asllani', 'E premte', 5, '12/3'],
            ['Violina Asllani', 'E premte', 7, '12/3'],

            // 26. Liriana Gërvalla
            ['Liriana Gërvalla', 'E martë', 2, '11/3'],
            ['Liriana Gërvalla', 'E martë', 3, '11/5'],
            ['Liriana Gërvalla', 'E martë', 4, '12/3'],
            ['Liriana Gërvalla', 'E martë', 5, '12/4'],
            ['Liriana Gërvalla', 'E premte', 4, '12/4'],
            ['Liriana Gërvalla', 'E premte', 5, '11/4'],
            ['Liriana Gërvalla', 'E premte', 6, '12/3'],

            // 27. Granita Zenuni
            ['Granita Zenuni', 'E mërkurë', 1, '11/3'],
            ['Granita Zenuni', 'E mërkurë', 2, '10/3'],
            ['Granita Zenuni', 'E mërkurë', 4, '11/5'],
            ['Granita Zenuni', 'E mërkurë', 6, '11/4'],
            ['Granita Zenuni', 'E mërkurë', 7, '10/4'],

            // 28. Erblina Krasniqi
            ['Erblina Krasniqi', 'E hënë', 3, '11/3'],
            ['Erblina Krasniqi', 'E hënë', 4, '11/4'],
            ['Erblina Krasniqi', 'E hënë', 5, '10/3'],
            ['Erblina Krasniqi', 'E hënë', 6, '11/5'],
            ['Erblina Krasniqi', 'E martë', 5, '12/4'],
            ['Erblina Krasniqi', 'E martë', 6, '10/3'],
            ['Erblina Krasniqi', 'E martë', 7, '12/3'],

            // 29. Shkurte Gashi
            ['Shkurte Gashi', 'E martë', 2, '10/4'],
            ['Shkurte Gashi', 'E martë', 3, '10/3'],
            ['Shkurte Gashi', 'E enjte', 1, '10/4'],
            ['Shkurte Gashi', 'E enjte', 2, '10/3'],

            // 30. Nita Pireva
            ['Nita Pireva', 'E hënë', 2, '11/5'],
            ['Nita Pireva', 'E hënë', 3, '10/4'],
            ['Nita Pireva', 'E hënë', 4, '10/3'],
            ['Nita Pireva', 'E enjte', 4, '11/5'],
            ['Nita Pireva', 'E enjte', 6, '10/3'],
            ['Nita Pireva', 'E enjte', 7, '10/4'],

            // 31. Zejnepe Abdyli
            ['Zejnepe Abdyli', 'E hënë', 5, '10/4'],
            ['Zejnepe Abdyli', 'E hënë', 6, '10/3'],
            ['Zejnepe Abdyli', 'E mërkurë', 1, '10/3'],
            ['Zejnepe Abdyli', 'E mërkurë', 2, '10/4'],

            // 32. Florina Sefa
            ['Florina Sefa', 'E martë', 5, '11/4'],
            ['Florina Sefa', 'E martë', 6, '11/3'],
            ['Florina Sefa', 'E martë', 7, '11/5'],
            ['Florina Sefa', 'E premte', 5, '11/3'],
            ['Florina Sefa', 'E premte', 6, '11/5'],
            ['Florina Sefa', 'E premte', 7, '11/4'],

            // 33. Kosovare Jashari
            ['Kosovare Jashari', 'E hënë', 5, '10/3'],
            ['Kosovare Jashari', 'E hënë', 7, '10/4'],
            ['Kosovare Jashari', 'E mërkurë', 6, '10/4'],
            ['Kosovare Jashari', 'E mërkurë', 7, '10/3'],
        ];
        // Hartëzimi i ditëve nga tekst në numër (1-5)
        $daysMap = [
            'E hënë' => 1,
            'E martë' => 2,
            'E mërkurë' => 3,
            'E enjte' => 4,
            'E premte' => 5,
        ];

        // Seeding për secilën celulë të tabelës
        foreach ($scheduleGrid as $item) {
            [$teacherName, $dayText, $slotNum, $className] = $item;

            $dayNumber = $daysMap[$dayText] ?? null;

            if (!$dayNumber) {
                continue; // Kalon tutje nëse dita nuk është validuar mirë
            }

            $user = User::where('name', $teacherName)->first();
            $class = ClassModel::where('name', $className)->first();

            if ($user && $class) {
                // 1. Provojmë ta gjejmë lëndën nga tabela lidhëse `class_subject`
                $subjectId = \DB::table('class_subject')
                    ->where('teacher_user_id', $user->id)
                    ->where('class_model_id', $class->id)
                    ->value('subject_id');

                // 2. Nëse nuk gjendet te class_subject, marrim lëndën e parë të atij profesori
                if (!$subjectId) {
                    $subjectId = \DB::table('class_subject')
                        ->where('teacher_user_id', $user->id)
                        ->value('subject_id');
                }

                // 3. Fallback: Nëse ende nuk ka lidhje, marrim lëndën e parë në sistem
                if (!$subjectId) {
                    $subjectId = Subject::value('id');
                }

                if ($subjectId) {
                    TimetableSlot::updateOrCreate(
                        [
                            'day_of_week' => $dayNumber, // Tani kalon numri (1, 2, 3, 4, 5)
                            'slot_number' => $slotNum,
                            'class_id' => $class->id,
                            'academic_year_id' => $academicYear->id,
                        ],
                        [
                            'subject_id' => $subjectId,
                            'teacher_user_id' => $user->id,
                        ]
                    );
                }
            }
        }
    }
}