<?php

declare(strict_types=1);

namespace App;

use App\Http\HttpException;

final class Database
{
    private static ?\PDO $pdo = null;

    public static function connection(): \PDO
    {
        if (self::$pdo === null) {
            if (!extension_loaded('pdo_mysql')) {
                throw new \RuntimeException('Ekstensi pdo_mysql belum aktif. Jalankan PHP dengan: php -d extension=pdo_mysql ...');
            }

            try {
                self::$pdo = new \PDO(Config::dsn(), Config::dbUser(), Config::dbPass(), [
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                    // Prepared statement asli: angka dari DB kembali sebagai int, bukan string.
                    \PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (\PDOException $e) {
                // Detail asli (user/host) cukup di log server, jangan dikirim ke browser.
                error_log((string) $e);
                throw new HttpException(503, 'Database is not reachable. Check backend/.env and run the database setup (see README).');
            }
        }

        return self::$pdo;
    }

    public static function transaction(callable $fn): mixed
    {
        $pdo = self::connection();
        $pdo->beginTransaction();

        try {
            $result = $fn($pdo);
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }
}
