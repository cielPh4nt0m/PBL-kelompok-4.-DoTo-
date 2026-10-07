<?php

declare(strict_types=1);

namespace App;

final class Config
{
    private static array $values = [];
    private static bool $loaded = false;

    // Baca backend/.env (format KEY=VALUE). Env var sistem tetap diprioritaskan.
    public static function load(string $rootDir): void
    {
        $envFile = rtrim($rootDir, '/') . '/.env';

        if (is_readable($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                self::$values[trim($key)] = trim($value);
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        if (!self::$loaded) {
            throw new \RuntimeException('Config::load() must be called before Config::get()');
        }

        $fromEnv = getenv($key);
        if ($fromEnv !== false) {
            return $fromEnv;
        }

        return self::$values[$key] ?? $default;
    }

    public static function dsn(): string
    {
        return sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            self::get('DB_HOST', '127.0.0.1'),
            self::get('DB_PORT', '3306'),
            self::databaseName()
        );
    }

    public static function databaseName(): string
    {
        return self::get('DB_NAME', 'doto');
    }

    public static function dbUser(): string
    {
        return self::get('DB_USER', 'root');
    }

    public static function dbPass(): string
    {
        return self::get('DB_PASS', '');
    }

    public static function cookieSecure(): bool
    {
        return self::get('COOKIE_SECURE', 'false') === 'true';
    }
}
