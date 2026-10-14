<?php

declare(strict_types=1);

// Arsipkan tugas "done" yang sudah melewati archive_after_hours.
// Jadwalkan tiap jam via crontab, mis.:
//   0 * * * * php -d extension=pdo_mysql /path/ke/backend/bin/archive-cron.php
// (Board juga menjalankan pengecekan yang sama setiap kali dibuka.)

require __DIR__ . '/../autoload.php';

use App\Config;
use App\Services\TaskService;

Config::load(dirname(__DIR__));

$count = TaskService::archiveEligibleTasks();

echo "Diarsipkan: {$count} tugas\n";
