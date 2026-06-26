<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Unauthenticated.',
                    'code' => 'UNAUTHENTICATED',
                ],
            ], 401);
        }

        if (empty($roles) || in_array($request->user()->role, $roles)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => [
                'message' => 'Unauthorized. Required role: ' . implode('|', $roles),
                'code' => 'UNAUTHORIZED_ROLE',
            ],
        ], 403);
    }
}
