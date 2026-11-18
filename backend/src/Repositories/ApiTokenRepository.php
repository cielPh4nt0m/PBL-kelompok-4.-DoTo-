<?php

declare(strict_types=1);

namespace App\Repositories;

final class ApiTokenRepository
{
    public static function findByHash(\PDO $pdo, string $hash): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM api_tokens WHERE token_hash = :hash');
        $stmt->execute(['hash' => $hash]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM api_tokens WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function listByUser(\PDO $pdo, string $userId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM api_tokens WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO api_tokens (id, user_id, token_hash, label, created_at, last_used_at, revoked_at)
             VALUES (:id, :user_id, :token_hash, :label, :created_at, NULL, NULL)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'token_hash' => $row['token_hash'],
            'label' => $row['label'],
            'created_at' => $row['created_at'],
        ]);
    }

    public static function touchLastUsed(\PDO $pdo, string $id, int $nowMs): void
    {
        $stmt = $pdo->prepare('UPDATE api_tokens SET last_used_at = :now WHERE id = :id');
        $stmt->execute(['now' => $nowMs, 'id' => $id]);
    }

    public static function revoke(\PDO $pdo, string $id, int $nowMs): void
    {
        $stmt = $pdo->prepare('UPDATE api_tokens SET revoked_at = :now WHERE id = :id');
        $stmt->execute(['now' => $nowMs, 'id' => $id]);
    }
}
