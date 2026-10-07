<?php

declare(strict_types=1);

namespace App\Repositories;

final class TaskHistoryRepository
{
    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO task_history
                (id, task_id, actor_user_id, actor_channel, agent_name, action, field_name, old_value, new_value, comment, created_at)
             VALUES
                (:id, :task_id, :actor_user_id, :actor_channel, :agent_name, :action, :field_name, :old_value, :new_value, :comment, :created_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'task_id' => $row['task_id'],
            'actor_user_id' => $row['actor_user_id'],
            'actor_channel' => $row['actor_channel'],
            'agent_name' => $row['agent_name'] ?? null,
            'action' => $row['action'],
            'field_name' => $row['field_name'] ?? null,
            'old_value' => $row['old_value'] ?? null,
            'new_value' => $row['new_value'] ?? null,
            'comment' => $row['comment'] ?? null,
            'created_at' => $row['created_at'],
        ]);
    }

    public static function findByTaskId(\PDO $pdo, string $taskId, int $limit = 50): array
    {
        $stmt = $pdo->prepare(
            'SELECT * FROM task_history WHERE task_id = :task_id ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue('task_id', $taskId);
        $stmt->bindValue('limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
