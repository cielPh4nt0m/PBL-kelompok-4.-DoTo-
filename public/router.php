<?php

// Router khusus PHP built-in server:
//   php -d extension=pdo_mysql -S localhost:8000 -t public public/router.php
// /api/* diteruskan ke api/index.php, selain itu file statis dilayani apa adanya.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}

return false;
