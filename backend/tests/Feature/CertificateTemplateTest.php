<?php
namespace Tests\Feature;

use App\Models\{User, Subject};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CertificateTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_director_uploads_maps_and_activates_template_with_revision_check(): void
    {
        Storage::fake('local');
        $this->actingAs(User::factory()->create(['role'=>'director']));
        $subject=Subject::create(['name'=>'Matematikë','category'=>'Matematikë','level'=>10]);
        $file=UploadedFile::fake()->createWithContent('blank.png',file_get_contents(base_path('../frontend/src/assets/logo.png')));
        $this->post('/api/v1/certificate-templates/10',['image'=>$file,'name'=>'Dëftesa 10','width_mm'=>210,'height_mm'=>297],['Accept'=>'application/json'])->assertOk()->assertJsonPath('data.active',false)->assertJsonPath('data.fields',[]);
        $fields=[['key'=>'student_name','x'=>15,'y'=>20,'width'=>60,'size'=>12,'align'=>'left'],['key'=>'grade:'.$subject->id,'x'=>80,'y'=>40,'width'=>10,'size'=>10,'align'=>'center']];
        $this->putJson('/api/v1/certificate-templates/10',['fields'=>$fields,'active'=>true,'revision'=>1])->assertOk()->assertJsonPath('data.active',true)->assertJsonPath('data.revision',2);
        $this->putJson('/api/v1/certificate-templates/10',['fields'=>$fields,'active'=>true,'revision'=>1])->assertStatus(409);
        $fields[0]['x']=90;
        $this->putJson('/api/v1/certificate-templates/10',['fields'=>$fields,'active'=>true,'revision'=>2])->assertStatus(422);
        $this->actingAs(User::factory()->create(['role'=>'teacher']));
        $this->getJson('/api/v1/certificate-templates/10')->assertOk()->assertJsonPath('data.active',true);
        $this->putJson('/api/v1/certificate-templates/10',['fields'=>[],'active'=>false,'revision'=>2])->assertForbidden();
    }

    public function test_students_cannot_access_templates_and_secretary_cannot_upload(): void
    {
        $this->actingAs(User::factory()->create(['role'=>'student']));
        $this->getJson('/api/v1/certificate-templates/10')->assertForbidden();
        $this->actingAs(User::factory()->create(['role'=>'secretary']));
        $this->postJson('/api/v1/certificate-templates/10',[])->assertForbidden();
        $this->getJson('/api/v1/certificate-templates/9')->assertNotFound();
    }
}
