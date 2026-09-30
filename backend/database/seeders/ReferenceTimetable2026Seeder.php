<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Services\ReferenceTimetableImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, File};

// Explicit import only; never run as part of the default database seed.
class ReferenceTimetable2026Seeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('label', '2026-2027')->where('is_active', true)->firstOrFail();
        $dir = storage_path('app/private/backups');
        File::ensureDirectoryExists($dir);
        $backup = [];
        foreach (['subjects', 'class_subject', 'timetable_slots'] as $table) $backup[$table] = DB::table($table)->get();
        File::put($dir.'/before-timetable-2026-'.now()->format('Ymd-His').'.json', json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        $reference = json_decode(File::get(database_path('data/timetable-2026-reference.json')), true, 512, JSON_THROW_ON_ERROR);
        $result = app(ReferenceTimetableImporter::class)->import($year, $reference, replaceSlots: true);
        $this->command?->info(json_encode($result));
    }
}
