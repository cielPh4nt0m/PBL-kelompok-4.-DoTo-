<?php

declare(strict_types=1);

namespace App\Repositories;

final class TaskTagRepository
{
    /**
     * @return string[]
     */
    public static function findByTaskId(\PDO $pdo, string $taskId): array
    {
        $stmt = $pdo->prepare('SELECT label FROM task_tags WHERE task_id = :task_id ORDER BY label ASC');
        $stmt->execute(['task_id' => $taskId]);
        return array_map(static fn (array $row) => $row['label'], $stmt->fetchAll());
    }

    /**
     * @param string[] $labels
     */
    public static function insertMany(\PDO $pdo, string $taskId, array $labels): void
    {
        $stmt = $pdo->prepare('INSERT INTO task_tags (task_id, label) VALUES (:task_id, :label)');
        foreach (array_unique($labels) as $label) {
            $stmt->execute(['task_id' => $taskId, 'label' => $label]);
        }
    }

    public static function deleteAllForTask(\PDO $pdo, string $taskId): void
    {
        $stmt = $pdo->prepare('DELETE FROM task_tags WHERE task_id = :task_id');
        $stmt->execute(['task_id' => $taskId]);
    }
}
