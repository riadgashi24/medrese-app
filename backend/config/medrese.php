<?php

return [
    // Default password assigned to newly created student user accounts.
    // Override via .env: DEFAULT_STUDENT_PASSWORD
    'default_student_password' => env('DEFAULT_STUDENT_PASSWORD', 'medrese2026'),

    // Financat mbeten të gatshme për aktivizim në të ardhmen.
    // Vendos FINANCE_FEATURE_ENABLED=true në .env kur moduli të aprovohet.
    'features' => [
        'finance' => env('FINANCE_FEATURE_ENABLED', false),
    ],
];
