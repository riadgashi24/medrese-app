<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Invalid credentials.',
                    'code' => 'INVALID_CREDENTIALS',
                ],
            ], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => $this->formatUser($user, $request),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Logged out successfully.'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatUser($request->user(), $request),
        ]);
    }

    private function formatUser(User $user, Request $request): array
    {
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'photo_url' => $user->staff?->photo || $user->photo
                ? $request->getSchemeAndHttpHost() . '/storage/' . ltrim($user->staff?->photo ?: $user->photo, '/')
                : null,
        ];

        if ($user->role === 'student' || $user->role === 'boarding') {
            $student = $user->student;
            if ($student) {
                $data['student_id'] = $student->student_id;
                $data['class_id'] = $student->class_id;
                $data['class_name'] = $student->class?->name;
            }
        }

        return $data;
    }
}
