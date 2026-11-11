<?php

declare(strict_types=1);

namespace App\Repositories;

final class UserRepository
{
    public static function findByEmail(\PDO $pdo, string $email): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByUsername(\PDO $pdo, string $username): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByGoogleSub(\PDO $pdo, string $googleSub): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE google_sub = :google_sub');
        $stmt->execute(['google_sub' => $googleSub]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO users
                (id, username, email, name, password_hash, role, bio, team_key, email_verified, avatar_data, google_sub, created_at)
             VALUES
                (:id, :username, :email, :name, :password_hash, :role, :bio, :team_key, :email_verified, :avatar_data, :google_sub, :created_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'name' => $row['name'],
            'password_hash' => $row['password_hash'] ?? null,
            'role' => $row['role'] ?? null,
            'bio' => $row['bio'] ?? null,
            'team_key' => $row['team_key'] ?? null,
            'email_verified' => isset($row['email_verified']) ? (int) (bool) $row['email_verified'] : 0,
            'avatar_data' => $row['avatar_data'] ?? null,
            'google_sub' => $row['google_sub'] ?? null,
            'created_at' => $row['created_at'],
        ]);
    }

    /**
     * @param array<string,mixed> $columns
     */
    public static function updateFields(\PDO $pdo, string $id, array $columns): void
    {
        if ($columns === []) {
            return;
        }
        $assignments = [];
        $params = ['id' => $id];
        foreach ($columns as $col => $val) {
            $assignments[] = "`$col` = :$col";
            $params[$col] = $val;
        }
        $sql = 'UPDATE users SET ' . implode(', ', $assignments) . ' WHERE id = :id';
        $pdo->prepare($sql)->execute($params);
    }

    public static function getNotificationPreferences(\PDO $pdo, string $userId): ?array
    {
        $stmt = $pdo->prepare('SELECT prefs FROM notification_preferences WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
        $json = $stmt->fetchColumn();
        if (!is_string($json) || $json === '') {
            return null;
        }
        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : null;
    }

    public static function saveNotificationPreferences(\PDO $pdo, string $userId, array $prefs, int $updatedAt): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO notification_preferences (user_id, prefs, updated_at)
             VALUES (:user_id, :prefs, :updated_at)
             ON DUPLICATE KEY UPDATE prefs = VALUES(prefs), updated_at = VALUES(updated_at)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'prefs' => json_encode($prefs, JSON_UNESCAPED_UNICODE),
            'updated_at' => $updatedAt,
        ]);
    }
}
