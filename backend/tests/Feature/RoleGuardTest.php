<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RoleGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_guard_denies_unauthorized_role(): void
    {
        // Create a student user
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => 'student',
        ]);

        $token = $student->createToken('test-token')->plainTextToken;

        // Try to access director-only endpoint (create student)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/students', [
            'student_id' => 'STD-2025-9999',
            'first_name' => 'Test',
            'parent_name' => 'Prind testues',
            'parent_phone' => '000000000',
            'municipality' => 'Prishtinë',
            'last_name' => 'Student',
            'class_id' => 1,
            'type' => 'Regular',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED_ROLE',
                ],
            ]);
    }

    public function test_role_guard_allows_authorized_role(): void
    {
        // Create a director user
        $director = User::create([
            'name' => 'Director User',
            'email' => 'director@example.com',
            'password' => Hash::make('password123'),
            'role' => 'director',
        ]);

        $token = $director->createToken('test-token')->plainTextToken;

        // Create academic year and class first
        $academicYear = \App\Models\AcademicYear::create([
            'label' => '2025-2026',
            'is_active' => true,
        ]);

        $class = \App\Models\ClassModel::create([
            'name' => '10A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ]);

        // Try to create a student (director role allowed)
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/students', [
            'student_id' => 'STD-2025-9999',
            'first_name' => 'Test',
            'municipality' => 'Prishtinë',
            'last_name' => 'Student',
            'class_id' => $class->id,
            'parent_name' => 'Prind testues',
            'parent_phone' => '000000000',
            'type' => 'Regular',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_unauthenticated_request_denied(): void
    {
        $response = $this->getJson('/api/v1/students');

        $response->assertStatus(401);
    }
}
