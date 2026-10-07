<?php

declare(strict_types=1);

namespace App\Auth;

use App\Config;
use App\Database;
use App\Http\UnauthorizedException;
use App\Repositories\ApiTokenRepository;
use App\Repositories\UserRepository;
use App\Request;
use App\Support\Enums;
use App\Support\Token;

final class Authenticator
{
    public const SESSION_COOKIE = 'doto_session';

    /**
     * Dua cara login:
     * - Header "Authorization: Bearer doto_..." untuk CLI dan MCP (API token).
     * - Sesi PHP (cookie doto_session) untuk web, dibuat saat login/register.
     */
    public static function resolveUser(Request $req): AuthContext
    {
        $bearer = self::extractBearer($req);

        if ($bearer !== null) {
            $pdo = Database::connection();
            $record = ApiTokenRepository::findByHash($pdo, Token::hash($bearer));
            if ($record === null || $record['revoked_at'] !== null) {
                throw new UnauthorizedException('Invalid or revoked token');
            }
            ApiTokenRepository::touchLastUsed($pdo, $record['id'], Database::nowMs());
            $userId = $record['user_id'];
        } else {
            $userId = self::sessionUserId($req);
            if ($userId === null) {
                throw new UnauthorizedException('Missing credentials');
            }
            $pdo = Database::connection();
        }

        $user = UserRepository::findById($pdo, $userId);
        if ($user === null) {
            throw new UnauthorizedException('Invalid credentials');
        }

        $channel = self::extractChannel($req);
        $agentName = $channel === 'agent' ? $req->header('X-Agent-Name') : null;

        return new AuthContext($user, $channel, $agentName);
    }

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name(self::SESSION_COOKIE);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => Config::cookieSecure(),
        ]);
        session_start();
    }

    public static function logIn(string $userId): void
    {
        self::startSession();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    public static function logOut(Request $req): void
    {
        if ($req->cookie(self::SESSION_COOKIE) === null) {
            return;
        }

        self::startSession();
        $_SESSION = [];
        session_destroy();
        setcookie(self::SESSION_COOKIE, '', [
            'expires' => 1,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => Config::cookieSecure(),
        ]);
    }

    private static function sessionUserId(Request $req): ?string
    {
        // Jangan buat sesi baru untuk request yang memang belum punya cookie.
        if ($req->cookie(self::SESSION_COOKIE) === null) {
            return null;
        }

        self::startSession();
        $userId = $_SESSION['user_id'] ?? null;
        // Sesi hanya dibaca: lepas lock file sesi agar request paralel tidak antre.
        session_write_close();

        return is_string($userId) ? $userId : null;
    }

    private static function extractBearer(Request $req): ?string
    {
        $authHeader = $req->header('Authorization');
        if ($authHeader !== null && str_starts_with($authHeader, 'Bearer ')) {
            return trim(substr($authHeader, strlen('Bearer ')));
        }

        return null;
    }

    private static function extractChannel(Request $req): string
    {
        $value = $req->header('X-Client-Channel');
        if ($value !== null && in_array($value, Enums::ACTOR_CHANNELS, true)) {
            return $value;
        }

        return 'web';
    }
}
