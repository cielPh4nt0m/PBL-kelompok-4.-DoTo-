<?php

declare(strict_types=1);

// Terapkan schema.sql ke database. Aman dijalankan berulang (CREATE ... IF NOT EXISTS).
//   php -d extension=pdo_mysql backend/database/migrate.php

require __DIR__ . '/../autoload.php';

use App\Config;
use App\Database;

Config::load(dirname(__DIR__));

$sql = file_get_contents(__DIR__ . '/schema.sql');
if ($sql === false) {
    fwrite(STDERR, "Gagal membaca schema.sql\n");
    exit(1);
}

// Hapus komentar baris, lalu jalankan per statement.
$sql = preg_replace('/^\s*--.*$/m', '', $sql);
$pdo = Database::connection();
foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
    $pdo->exec($statement);
}

echo 'Migrasi selesai ke database ' . Config::databaseName() . "\n";
