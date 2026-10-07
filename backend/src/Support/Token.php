<?php

declare(strict_types=1);

namespace App\Support;

final class Token
{
    private const PREFIX = 'doto_';

    /**
     * @return array{token: string, hash: string}
     */
    public static function generate(): array
    {
        $raw = self::PREFIX . self::base64url(random_bytes(32));

        return [
            'token' => $raw,
            'hash' => self::hash($raw),
        ];
    }

    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    private static function base64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
