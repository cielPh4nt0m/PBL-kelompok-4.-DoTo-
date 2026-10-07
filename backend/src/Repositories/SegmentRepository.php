<?php

declare(strict_types=1);

namespace App\Repositories;

final class SegmentRepository
{
    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM segments WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByProjectAndName(\PDO $pdo, string $projectId, string $name): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM segments WHERE project_id = :project_id AND name = :name');
        $stmt->execute(['project_id' => $projectId, 'name' => $name]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function listByProject(\PDO $pdo, string $projectId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM segments WHERE project_id = :project_id ORDER BY position ASC');
        $stmt->execute(['project_id' => $projectId]);
        return $stmt->fetchAll();
    }

    public static function maxPosition(\PDO $pdo, string $projectId): int
    {
        $stmt = $pdo->prepare('SELECT MAX(position) AS max_position FROM segments WHERE project_id = :project_id');
        $stmt->execute(['project_id' => $projectId]);
        $value = $stmt->fetchColumn();
        return $value === null ? 0 : (int) $value;
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO segments (id, project_id, name, position, created_at)
             VALUES (:id, :project_id, :name, :position, :created_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'project_id' => $row['project_id'],
            'name' => $row['name'],
            'position' => $row['position'],
            'created_at' => $row['created_at'],
        ]);
    }
}
