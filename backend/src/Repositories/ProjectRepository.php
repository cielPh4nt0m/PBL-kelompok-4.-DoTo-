<?php

declare(strict_types=1);

namespace App\Repositories;

final class ProjectRepository
{
    public static function findByKey(\PDO $pdo, string $key): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE `key` = :key');
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function listAll(\PDO $pdo): array
    {
        $stmt = $pdo->query('SELECT * FROM projects ORDER BY created_at ASC');
        return $stmt->fetchAll();
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO projects (id, `key`, name, next_seq, archive_after_hours, created_by, created_at)
             VALUES (:id, :key, :name, :next_seq, :archive_after_hours, :created_by, :created_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'key' => $row['key'],
            'name' => $row['name'],
            'next_seq' => $row['next_seq'],
            'archive_after_hours' => $row['archive_after_hours'],
            'created_by' => $row['created_by'],
            'created_at' => $row['created_at'],
        ]);
    }

    /**
     * Atomically increments next_seq and returns the sequence number that
     * should be assigned to the task being created (the pre-increment value).
     */
    public static function incrementNextSeqAndGet(\PDO $pdo, string $projectId): int
    {
        $pdo->prepare('UPDATE projects SET next_seq = next_seq + 1 WHERE id = :id')
            ->execute(['id' => $projectId]);

        $stmt = $pdo->prepare('SELECT next_seq FROM projects WHERE id = :id');
        $stmt->execute(['id' => $projectId]);
        $newNextSeq = (int) $stmt->fetchColumn();

        return $newNextSeq - 1;
    }
}
