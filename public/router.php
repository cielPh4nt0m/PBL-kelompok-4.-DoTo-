<?php

// Router khusus PHP built-in server:
//   php -d extension=pdo_mysql -S localhost:8000 -t public public/router.php
// /api/* diteruskan ke api/index.php, selain itu file statis dilayani apa adanya.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}

// Alias case-insensitive untuk halaman HTML lama (mis. /Login.html, /Todo.html, /Welcome.html)
$aliases = [
    '/login.html' => __DIR__ . '/login.html',
    '/todo.html' => __DIR__ . '/todo.html',
    '/welcome.html' => __DIR__ . '/welcome.html',
    '/register.html' => __DIR__ . '/register.html',
    '/projects.html' => __DIR__ . '/projects.html',
    '/board.html' => __DIR__ . '/board.html',
    '/task.html' => __DIR__ . '/task.html',
    '/ai.html' => __DIR__ . '/ai.html',
    '/tokens.html' => __DIR__ . '/tokens.html',
    '/calendar.html' => __DIR__ . '/calendar.html',
    '/members.html' => __DIR__ . '/members.html',
    '/settings.html' => __DIR__ . '/settings.html',
    '/profile.html' => __DIR__ . '/profile.html',
    '/notifications.html' => __DIR__ . '/notifications.html',
    '/security.html' => __DIR__ . '/security.html',
    '/appearance.html' => __DIR__ . '/appearance.html',
    '/compact.html' => __DIR__ . '/compact.html',
    '/ai-preferences.html' => __DIR__ . '/ai-preferences.html',
];

$lower = strtolower($path);
if (isset($aliases[$lower]) && $path !== $lower && is_file($aliases[$lower])) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($aliases[$lower]);
    return true;
}

return false;
