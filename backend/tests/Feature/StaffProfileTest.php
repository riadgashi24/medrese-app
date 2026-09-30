<?php

namespace Tests\Feature;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_detail_serializes_photo_and_profile_with_request(): void
    {
        $user = User::factory()->create(['role' => 'director']);
        $staff = Staff::create(['first_name' => 'Profesor', 'last_name' => 'Test', 'gender' => 'Male', 'position' => 'Profesor', 'photo' => 'staff/test.png']);
        $this->actingAs($user)->getJson('/api/v1/staff/'.$staff->id)->assertOk()
            ->assertJsonPath('data.name', 'Profesor Test')
            ->assertJsonPath('data.photo_url', 'http://localhost/storage/staff/test.png');
    }
}
