<?php

declare(strict_types=1);

namespace App\Services;

use App\Database;
use App\Http\ConflictException;
use App\Http\NotFoundException;
use App\Repositories\ApiTokenRepository;
use App\Repositories\UserRepository;
use App\Support\Token;
use App\Support\Uuid;

final class UserService
{
    private const SYSTEM_USERNAME = 'system';
    private const SYSTEM_EMAIL = 'system@doto.local';

    public static function register(string $username, string $email, string $password): array
    {
        $pdo = Database::connection();

        // "system" dicadangkan untuk user otomatis (archive).
        if (strtolower($username) === self::SYSTEM_USERNAME || UserRepository::findByUsername($pdo, $username) !== null) {
            throw new ConflictException('Username is already taken');
        }
        if (UserRepository::findByEmail($pdo, $email) !== null) {
            throw new ConflictException('Email is already registered');
        }

        $row = [
            'id' => Uuid::v4(),
            'username' => $username,
            'email' => $email,
            'name' => $username,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'created_at' => Database::nowMs(),
        ];

        UserRepository::insert($pdo, $row);

        return $row;
    }

    // Cari user berdasarkan username ATAU email, lalu cocokkan password.
    public static function verifyCredentials(string $login, string $password): ?array
    {
        $pdo = Database::connection();
        $user = str_contains($login, '@')
            ? UserRepository::findByEmail($pdo, $login)
            : UserRepository::findByUsername($pdo, $login);

        if ($user === null || $user['password_hash'] === null) {
            return null;
        }

        return password_verify($password, $user['password_hash']) ? $user : null;
    }

    public static function findUserByEmail(string $email): ?array
    {
        return UserRepository::findByEmail(Database::connection(), $email);
    }

    public static function getUserOrThrow(string $email): array
    {
        $user = self::findUserByEmail($email);
        if ($user === null) {
            throw new NotFoundException('User not found');
        }
        return $user;
    }

    // User khusus untuk mencatat aksi otomatis (archive). Tidak bisa login karena tanpa password.
    public static function getOrCreateSystemUser(): array
    {
        $existing = self::findUserByEmail(self::SYSTEM_EMAIL);
        if ($existing !== null) {
            return $existing;
        }

        $row = [
            'id' => Uuid::v4(),
            'username' => self::SYSTEM_USERNAME,
            'email' => self::SYSTEM_EMAIL,
            'name' => 'Doto system',
            'password_hash' => null,
            'created_at' => Database::nowMs(),
        ];
        UserRepository::insert(Database::connection(), $row);

        return $row;
    }

    public static function listTokens(string $userId): array
    {
        $rows = ApiTokenRepository::listByUser(Database::connection(), $userId);

        return array_map(static fn (array $r) => [
            'id' => $r['id'],
            'label' => $r['label'],
            'createdAt' => (int) $r['created_at'],
            'lastUsedAt' => $r['last_used_at'] !== null ? (int) $r['last_used_at'] : null,
            'revokedAt' => $r['revoked_at'] !== null ? (int) $r['revoked_at'] : null,
        ], $rows);
    }

    /**
     * @return array{token:string,id:string,label:string}
     */
    public static function createTokenForUser(string $userId, string $label): array
    {
        $pdo = Database::connection();
        $generated = Token::generate();
        $id = Uuid::v4();

        ApiTokenRepository::insert($pdo, [
            'id' => $id,
            'user_id' => $userId,
            'token_hash' => $generated['hash'],
            'label' => $label,
            'created_at' => Database::nowMs(),
        ]);

        return ['token' => $generated['token'], 'id' => $id, 'label' => $label];
    }

    public static function revokeToken(string $userId, string $tokenId): void
    {
        $pdo = Database::connection();
        $token = ApiTokenRepository::findById($pdo, $tokenId);

        // Token milik user lain diperlakukan seperti tidak ada.
        if ($token === null || $token['user_id'] !== $userId) {
            throw new NotFoundException('Token not found');
        }

        if ($token['revoked_at'] === null) {
            ApiTokenRepository::revoke($pdo, $tokenId, Database::nowMs());
        }
    }
}
