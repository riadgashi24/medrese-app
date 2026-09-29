<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CheckR2 extends Command
{
    protected $signature = 'medrese:check-r2 {--write : Upload, read and remove one temporary test file}';

    protected $description = 'Kontrollon konfigurimin dhe lidhjen private me Cloudflare R2';

    public function handle(): int
    {
        foreach (['key', 'secret', 'bucket', 'endpoint'] as $field) {
            if (! config("filesystems.disks.r2.$field")) {
                $this->error('Plotëso backend/.env.r2 dhe pastaj ekzekuto php artisan config:clear.');
                return self::FAILURE;
            }
        }

        if (! $this->option('write')) {
            $this->info('Konfigurimi është plotësuar. Përdor --write për të provuar lidhjen me R2.');
            return self::SUCCESS;
        }

        $path = '_connection-checks/'.Str::uuid().'.txt';
        $disk = Storage::disk('r2');
        $ok = false;
        try {
            $payload = (string) Str::uuid();
            $disk->put($path, $payload);
            $ok = $disk->get($path) === $payload;
        } catch (Throwable) {
            $this->error('Lidhja dështoi. Kontrollo endpoint-in, bucket-in dhe lejet e çelësit.');
        } finally {
            try {
                $disk->delete($path);
            } catch (Throwable) {
                $ok = false;
                $this->error('Pastrimi dështoi. Kontrollo skedarin e provës: '.$path);
            }
        }

        if ($ok) {
            $this->info('R2 funksionon: skedari u ngarkua, u lexua dhe u fshi.');
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
