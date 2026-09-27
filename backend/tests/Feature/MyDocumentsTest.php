<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassModel;
use App\Models\Document;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MyDocumentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_my_documents_returns_only_linked_docs(): void
    {
        // Create student user
        $studentUser = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => 'student',
        ]);

        // Create academic year and class
        $academicYear = AcademicYear::create([
            'label' => '2025-2026',
            'is_active' => true,
        ]);

        $class = ClassModel::create([
            'name' => '10A',
            'section' => 'A',
            'academic_year_id' => $academicYear->id,
        ]);

        // Create student
        $student = Student::create([
            'student_id' => 'STD-2025-0001',
            'first_name' => 'Test',
            'municipality' => 'Prishtinë',
            'parent_name' => 'Prind testues',
            'parent_phone' => '000000000',
            'last_name' => 'Student',
            'class_id' => $class->id,
            'type' => 'Regular',
            'status' => 'Active',
            'user_id' => $studentUser->id,
        ]);

        // Create documents
        $doc1 = Document::create([
            'title' => 'Document 1',
            'description' => 'First document',
            'file_url' => '/docs/doc1.pdf',
            'uploaded_by_user_id' => $studentUser->id,
            'visibility' => 'All',
        ]);

        $doc2 = Document::create([
            'title' => 'Document 2',
            'description' => 'Second document',
            'file_url' => '/docs/doc2.pdf',
            'uploaded_by_user_id' => $studentUser->id,
            'visibility' => 'All',
        ]);

        $doc3 = Document::create([
            'title' => 'Document 3',
            'description' => 'Third document (not linked)',
            'file_url' => '/docs/doc3.pdf',
            'uploaded_by_user_id' => $studentUser->id,
            'visibility' => 'All',
        ]);

        // Link only doc1 and doc2 to student
        StudentDocument::create([
            'student_id' => $student->id,
            'document_id' => $doc1->id,
            'issued_at' => now(),
        ]);

        StudentDocument::create([
            'student_id' => $student->id,
            'document_id' => $doc2->id,
            'issued_at' => now(),
        ]);

        // Get token
        $token = $studentUser->createToken('test-token')->plainTextToken;

        // Request my-documents
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/documents/my-documents');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(2, 'data');

        // Verify the documents are the linked ones
        $data = $response->json('data');
        $documentIds = collect($data)->pluck('document_id')->toArray();
        $this->assertContains($doc1->id, $documentIds);
        $this->assertContains($doc2->id, $documentIds);
        $this->assertNotContains($doc3->id, $documentIds);
    }
}
