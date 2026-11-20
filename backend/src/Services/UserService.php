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
            'role' => null,
            'bio' => null,
            'team_key' => null,
            'email_verified' => 0,
            'avatar_data' => null,
            'google_sub' => null,
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
            'role' => null,
            'bio' => null,
            'team_key' => null,
            'email_verified' => 1,
            'avatar_data' => null,
            'google_sub' => null,
            'created_at' => Database::nowMs(),
        ];
        UserRepository::insert(Database::connection(), $row);

        return $row;
    }

    public static function checkAvailability(?string $username, ?string $email, ?string $currentUserId): array
    {
        $pdo = Database::connection();
        if ($username !== null) {
            $user = UserRepository::findByUsername($pdo, $username);
            $available = ($user === null || ($currentUserId !== null && $user['id'] === $currentUserId));
            return ['available' => $available];
        }
        if ($email !== null) {
            $user = UserRepository::findByEmail($pdo, $email);
            $available = ($user === null || ($currentUserId !== null && $user['id'] === $currentUserId));
            return ['available' => $available];
        }
        return ['available' => true];
    }

    public static function updateProfile(string $userId, array $input): array
    {
        $pdo = Database::connection();
        $user = UserRepository::findById($pdo, $userId);
        if ($user === null) {
            throw new NotFoundException('User not found');
        }

        $columns = [];

        if (array_key_exists('username', $input) && $input['username'] !== $user['username']) {
            $existing = UserRepository::findByUsername($pdo, $input['username']);
            if ($existing !== null && $existing['id'] !== $userId) {
                throw new ConflictException('Username is already taken');
            }
            $columns['username'] = $input['username'];
        }

        if (array_key_exists('email', $input) && strtolower($input['email']) !== strtolower($user['email'])) {
            $existing = UserRepository::findByEmail($pdo, $input['email']);
            if ($existing !== null && $existing['id'] !== $userId) {
                throw new ConflictException('Email is already registered');
            }
            $columns['email'] = $input['email'];
            $columns['email_verified'] = 0;
        }

        if (array_key_exists('name', $input) && $input['name'] !== $user['name']) {
            $columns['name'] = $input['name'];
        }

        if (array_key_exists('role', $input) && $input['role'] !== $user['role']) {
            $columns['role'] = $input['role'];
        }

        if (array_key_exists('bio', $input) && $input['bio'] !== $user['bio']) {
            $columns['bio'] = $input['bio'];
        }

        if (array_key_exists('teamKey', $input) && $input['teamKey'] !== $user['team_key']) {
            $columns['team_key'] = $input['teamKey'];
        }

        if (array_key_exists('avatarUrl', $input) && $input['avatarUrl'] !== $user['avatar_data']) {
            $columns['avatar_data'] = $input['avatarUrl'];
        }

        if ($columns !== []) {
            UserRepository::updateFields($pdo, $userId, $columns);
            $user = UserRepository::findById($pdo, $userId);
        }

        return $user;
    }

    public static function verifyEmail(string $userId): array
    {
        $pdo = Database::connection();
        UserRepository::updateFields($pdo, $userId, ['email_verified' => 1]);
        $user = UserRepository::findById($pdo, $userId);
        if ($user === null) {
            throw new NotFoundException('User not found');
        }
        return $user;
    }

    public static function changePassword(string $userId, ?string $currentPassword, string $newPassword): void
    {
        $pdo = Database::connection();
        $user = UserRepository::findById($pdo, $userId);
        if ($user === null) {
            throw new NotFoundException('User not found');
        }

        $hasPassword = ($user['password_hash'] !== null && $user['password_hash'] !== '');
        if ($hasPassword) {
            if ($currentPassword === null || $currentPassword === '' || !password_verify($currentPassword, $user['password_hash'])) {
                throw new \App\Http\UnauthorizedException('Password lama tidak sesuai');
            }
        }

        if (mb_strlen($newPassword) < 6) {
            throw new \App\Http\ValidationException('Password minimal 6 karakter');
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        UserRepository::updateFields($pdo, $userId, ['password_hash' => $hash]);
    }

    public static function getNotificationPreferences(string $userId): array
    {
        $pdo = Database::connection();
        $prefs = UserRepository::getNotificationPreferences($pdo, $userId);
        if ($prefs !== null) {
            return $prefs;
        }

        return [
            'g' => ['tasks' => true, 'deadline' => true, 'comments' => true, 'team' => true, 'ai' => true],
            'i' => [
                'taskNew' => true, 'taskUpdated' => true, 'taskStatus' => true, 'taskDeadline' => true, 'taskDone' => true,
                'dl1d' => true, 'dl1h' => false, 'dlLate' => true, 'dlPending' => false,
                'mention' => true, 'comment' => true, 'reply' => false,
                'memberAdded' => true, 'memberChange' => false, 'announcement' => true, 'important' => false,
                'agentDone' => true, 'agentFail' => false, 'agentApproval' => true, 'agentReport' => false,
            ],
        ];
    }

    public static function saveNotificationPreferences(string $userId, array $prefs): array
    {
        $pdo = Database::connection();
        UserRepository::saveNotificationPreferences($pdo, $userId, $prefs, Database::nowMs());
        return $prefs;
    }

    public static function findOrCreateGoogleUser(string $sub, string $email, string $name): array
    {
        $pdo = Database::connection();
        $user = UserRepository::findByGoogleSub($pdo, $sub);
        if ($user !== null) {
            $cols = [];
            if ((int) $user['email_verified'] !== 1) {
                $cols['email_verified'] = 1;
            }
            if ($cols !== []) {
                UserRepository::updateFields($pdo, $user['id'], $cols);
                $user = UserRepository::findById($pdo, $user['id']);
            }
            self::ensureUserInK4Project($pdo, $user['id']);
            return $user;
        }

        $user = UserRepository::findByEmail($pdo, $email);
        if ($user !== null) {
            $cols = ['google_sub' => $sub, 'email_verified' => 1];
            UserRepository::updateFields($pdo, $user['id'], $cols);
            $user = UserRepository::findById($pdo, $user['id']);
            self::ensureUserInK4Project($pdo, $user['id']);
            return $user;
        }

        // Akun baru dari Google
        $baseUsername = strtolower(preg_replace('/[^a-z0-9._]/i', '', explode('@', $email)[0]));
        if (strlen($baseUsername) < 3) {
            $baseUsername = 'u.' . $baseUsername;
        }
        $baseUsername = substr($baseUsername, 0, 11);
        $candidate = $baseUsername;
        $i = 1;
        while (UserRepository::findByUsername($pdo, $candidate) !== null) {
            $candidate = substr($baseUsername, 0, 10) . $i;
            $i++;
        }

        $row = [
            'id' => Uuid::v4(),
            'username' => $candidate,
            'email' => $email,
            'name' => $name !== '' ? $name : $candidate,
            'password_hash' => null,
            'role' => null,
            'bio' => null,
            'team_key' => 'K4',
            'email_verified' => 1,
            'avatar_data' => null,
            'google_sub' => $sub,
            'created_at' => Database::nowMs(),
        ];
        UserRepository::insert($pdo, $row);
        self::ensureUserInK4Project($pdo, $row['id']);
        return $row;
    }

    private static function ensureUserInK4Project(\PDO $pdo, string $userId): void
    {
        $project = \App\Repositories\ProjectRepository::findByKey($pdo, 'K4');
        if ($project !== null && !\App\Repositories\ProjectMemberRepository::isMember($pdo, $project['id'], $userId)) {
            \App\Repositories\ProjectMemberRepository::add($pdo, $project['id'], $userId, Database::nowMs());
        }
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
