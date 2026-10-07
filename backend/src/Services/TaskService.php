<?php

declare(strict_types=1);

namespace App\Services;

use App\Auth\AuthContext;
use App\Database;
use App\Http\NotFoundException;
use App\Repositories\ProjectRepository;
use App\Repositories\SegmentRepository;
use App\Repositories\TaskHistoryRepository;
use App\Repositories\TaskRepository;
use App\Repositories\TaskTagRepository;
use App\Repositories\UserRepository;
use App\Support\Enums;
use App\Support\Uuid;

final class TaskService
{
    private const SYSTEM_ACTOR_CHANNEL = 'agent';
    private const SYSTEM_ACTOR_AGENT_NAME = 'archive-job';

    public static function getTaskByDisplayIdOrThrow(string $displayId): array
    {
        $row = TaskRepository::findByDisplayId(Database::connection(), $displayId);
        if ($row === null) {
            throw new NotFoundException('Task not found');
        }
        return $row;
    }

    public static function toTaskDTO(\PDO $pdo, array $row): array
    {
        $tags = TaskTagRepository::findByTaskId($pdo, $row['id']);

        $assigneeEmail = null;
        $assigneeName = null;
        $assigneeUsername = null;
        if ($row['assignee_id'] !== null) {
            $assignee = UserRepository::findById($pdo, $row['assignee_id']);
            if ($assignee !== null) {
                $assigneeEmail = $assignee['email'];
                $assigneeName = $assignee['name'];
                $assigneeUsername = $assignee['username'];
            }
        }

        $links = $row['links'] !== null ? (json_decode($row['links'], true) ?: []) : [];

        return [
            'id' => $row['id'],
            'projectId' => $row['project_id'],
            'segmentId' => $row['segment_id'],
            'seq' => (int) $row['seq'],
            'displayId' => $row['display_id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'status' => $row['status'],
            'priority' => $row['priority'],
            'assigneeId' => $row['assignee_id'],
            'assigneeEmail' => $assigneeEmail,
            'assigneeName' => $assigneeName,
            'assigneeUsername' => $assigneeUsername,
            'createdBy' => $row['created_by'],
            'tags' => $tags,
            'links' => $links,
            'statusChangedAt' => (int) $row['status_changed_at'],
            'archivedAt' => $row['archived_at'] !== null ? (int) $row['archived_at'] : null,
            'createdAt' => (int) $row['created_at'],
            'updatedAt' => (int) $row['updated_at'],
        ];
    }

    public static function toProjectDTO(array $row): array
    {
        return [
            'id' => $row['id'],
            'key' => $row['key'],
            'name' => $row['name'],
            'nextSeq' => (int) $row['next_seq'],
            'archiveAfterHours' => (int) $row['archive_after_hours'],
            'createdBy' => $row['created_by'],
            'createdAt' => (int) $row['created_at'],
        ];
    }

    public static function toSegmentDTO(array $row): array
    {
        return [
            'id' => $row['id'],
            'projectId' => $row['project_id'],
            'name' => $row['name'],
            'position' => (int) $row['position'],
            'createdAt' => (int) $row['created_at'],
        ];
    }

    public static function toHistoryDTO(array $row): array
    {
        return [
            'id' => $row['id'],
            'taskId' => $row['task_id'],
            'actorUserId' => $row['actor_user_id'],
            'actorChannel' => $row['actor_channel'],
            'agentName' => $row['agent_name'],
            'action' => $row['action'],
            'fieldName' => $row['field_name'],
            'oldValue' => $row['old_value'],
            'newValue' => $row['new_value'],
            'comment' => $row['comment'],
            'createdAt' => (int) $row['created_at'],
        ];
    }

    public static function getBoard(array $project, bool $includeArchived): array
    {
        $pdo = Database::connection();
        $segments = SegmentRepository::listByProject($pdo, $project['id']);

        $boardSegments = [];
        foreach ($segments as $segment) {
            $tasks = TaskRepository::findBySegment($pdo, $segment['id'], $includeArchived);
            $boardSegments[] = [
                'segment' => self::toSegmentDTO($segment),
                'tasks' => array_map(fn (array $t) => self::toTaskDTO($pdo, $t), $tasks),
            ];
        }

        return [
            'project' => self::toProjectDTO($project),
            'segments' => $boardSegments,
        ];
    }

    /**
     * @param array{title:string,description?:?string,status?:?string,priority?:?string,tags?:?string[],assigneeEmail?:?string} $input
     */
    public static function createTask(array $project, array $segment, array $input, AuthContext $actor): array
    {
        $assigneeId = $actor->user['id'];
        if (!empty($input['assigneeEmail'])) {
            $assigneeId = UserService::getUserOrThrow($input['assigneeEmail'])['id'];
        }

        return Database::transaction(function (\PDO $pdo) use ($project, $segment, $input, $actor, $assigneeId) {
            $seq = ProjectRepository::incrementNextSeqAndGet($pdo, $project['id']);
            $displayId = $project['key'] . '-' . $seq;
            $now = Database::nowMs();
            $taskId = Uuid::v4();

            TaskRepository::insert($pdo, [
                'id' => $taskId,
                'project_id' => $project['id'],
                'segment_id' => $segment['id'],
                'seq' => $seq,
                'display_id' => $displayId,
                'title' => $input['title'],
                'description' => $input['description'] ?? null,
                'status' => $input['status'] ?? Enums::DEFAULT_STATUS,
                'priority' => $input['priority'] ?? Enums::DEFAULT_PRIORITY,
                'assignee_id' => $assigneeId,
                'created_by' => $actor->user['id'],
                'links' => null,
                'status_changed_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if (!empty($input['tags'])) {
                TaskTagRepository::insertMany($pdo, $taskId, $input['tags']);
            }

            self::recordHistory($pdo, $taskId, $actor, 'created', newValue: $displayId, createdAt: $now);

            return self::toTaskDTO($pdo, TaskRepository::findById($pdo, $taskId));
        });
    }

    public static function updateTaskStatus(array $task, string $status, AuthContext $actor): array
    {
        if ($task['status'] === $status) {
            return self::toTaskDTO(Database::connection(), $task);
        }

        return Database::transaction(function (\PDO $pdo) use ($task, $status, $actor) {
            $now = Database::nowMs();
            TaskRepository::updateStatus($pdo, $task['id'], $status, $now, $now);
            self::recordHistory($pdo, $task['id'], $actor, 'status_changed', 'status', $task['status'], $status, $now);

            return self::toTaskDTO($pdo, TaskRepository::findById($pdo, $task['id']));
        });
    }

    public static function updateTaskPriority(array $task, string $priority, AuthContext $actor): array
    {
        if ($task['priority'] === $priority) {
            return self::toTaskDTO(Database::connection(), $task);
        }

        return Database::transaction(function (\PDO $pdo) use ($task, $priority, $actor) {
            $now = Database::nowMs();
            TaskRepository::updatePriority($pdo, $task['id'], $priority, $now);
            self::recordHistory($pdo, $task['id'], $actor, 'priority_changed', 'priority', $task['priority'], $priority, $now);

            return self::toTaskDTO($pdo, TaskRepository::findById($pdo, $task['id']));
        });
    }

    public static function reassignTask(array $task, string $assigneeEmail, AuthContext $actor): array
    {
        $newAssignee = UserService::getUserOrThrow($assigneeEmail);

        if ($task['assignee_id'] === $newAssignee['id']) {
            return self::toTaskDTO(Database::connection(), $task);
        }

        return Database::transaction(function (\PDO $pdo) use ($task, $newAssignee, $actor) {
            $now = Database::nowMs();
            $oldAssignee = $task['assignee_id'] !== null ? UserRepository::findById($pdo, $task['assignee_id']) : null;

            TaskRepository::updateAssignee($pdo, $task['id'], $newAssignee['id'], $now);
            self::recordHistory(
                $pdo,
                $task['id'],
                $actor,
                'assignee_changed',
                'assigneeEmail',
                $oldAssignee['email'] ?? null,
                $newAssignee['email'],
                $now
            );

            return self::toTaskDTO($pdo, TaskRepository::findById($pdo, $task['id']));
        });
    }

    /**
     * @param array{title?:?string,description?:?string,segmentId?:?string,links?:?array,tags?:?string[]} $input
     */
    public static function updateTaskFields(array $task, array $input, AuthContext $actor): array
    {
        return Database::transaction(function (\PDO $pdo) use ($task, $input, $actor) {
            $now = Database::nowMs();
            $columns = [];

            if (array_key_exists('title', $input) && $input['title'] !== $task['title']) {
                $columns['title'] = $input['title'];
                self::recordHistory($pdo, $task['id'], $actor, 'field_updated', 'title', $task['title'], $input['title'], $now);
            }

            if (array_key_exists('description', $input) && $input['description'] !== $task['description']) {
                $columns['description'] = $input['description'];
                self::recordHistory($pdo, $task['id'], $actor, 'field_updated', 'description', $task['description'], $input['description'], $now);
            }

            if (array_key_exists('segmentId', $input) && $input['segmentId'] !== $task['segment_id']) {
                $segment = SegmentService::getSegmentByIdOrThrow($input['segmentId']);
                if ($segment['project_id'] !== $task['project_id']) {
                    throw new NotFoundException('Segment not found');
                }
                $columns['segment_id'] = $input['segmentId'];
                self::recordHistory($pdo, $task['id'], $actor, 'segment_changed', 'segmentId', $task['segment_id'], $input['segmentId'], $now);
            }

            if (array_key_exists('links', $input)) {
                $newLinksJson = json_encode($input['links'] ?? []);
                if ($newLinksJson !== ($task['links'] ?? json_encode([]))) {
                    $columns['links'] = $newLinksJson;
                    self::recordHistory($pdo, $task['id'], $actor, 'field_updated', 'links', $task['links'], $newLinksJson, $now);
                }
            }

            $touched = $columns !== [];

            if (array_key_exists('tags', $input)) {
                $oldTags = TaskTagRepository::findByTaskId($pdo, $task['id']);
                $newTags = array_values(array_unique($input['tags'] ?? []));
                sort($oldTags);
                $sortedNewTags = $newTags;
                sort($sortedNewTags);

                if ($oldTags !== $sortedNewTags) {
                    TaskTagRepository::deleteAllForTask($pdo, $task['id']);
                    if ($newTags !== []) {
                        TaskTagRepository::insertMany($pdo, $task['id'], $newTags);
                    }
                    self::recordHistory(
                        $pdo,
                        $task['id'],
                        $actor,
                        'field_updated',
                        'tags',
                        implode(',', $oldTags),
                        implode(',', $sortedNewTags),
                        $now
                    );
                    $touched = true;
                }
            }

            if ($touched) {
                TaskRepository::updateFields($pdo, $task['id'], $columns, $now);
            }

            return self::toTaskDTO($pdo, TaskRepository::findById($pdo, $task['id']));
        });
    }

    public static function addComment(array $task, string $comment, AuthContext $actor): array
    {
        return Database::transaction(function (\PDO $pdo) use ($task, $comment, $actor) {
            $now = Database::nowMs();
            $id = Uuid::v4();

            TaskHistoryRepository::insert($pdo, [
                'id' => $id,
                'task_id' => $task['id'],
                'actor_user_id' => $actor->user['id'],
                'actor_channel' => $actor->channel,
                'agent_name' => $actor->agentName,
                'action' => 'comment',
                'comment' => $comment,
                'created_at' => $now,
            ]);

            $stmt = $pdo->prepare('SELECT * FROM task_history WHERE id = :id');
            $stmt->execute(['id' => $id]);

            return self::toHistoryDTO($stmt->fetch());
        });
    }

    public static function getTaskHistory(string $taskId, int $limit = 50): array
    {
        $rows = TaskHistoryRepository::findByTaskId(Database::connection(), $taskId, $limit);
        return array_map(fn (array $r) => self::toHistoryDTO($r), $rows);
    }

    /**
     * @param array{q?:?string,project?:?string,status?:?string,assignee?:?string,includeArchived:bool} $query
     */
    public static function searchTasks(array $query): array
    {
        $pdo = Database::connection();

        $projectId = null;
        if (!empty($query['project'])) {
            $projectId = ProjectService::getProjectByKeyOrThrow($query['project'])['id'];
        }

        $assigneeId = null;
        if (!empty($query['assignee'])) {
            $assigneeId = UserService::getUserOrThrow($query['assignee'])['id'];
        }

        $rows = TaskRepository::search($pdo, [
            'q' => $query['q'] ?? null,
            'projectId' => $projectId,
            'status' => $query['status'] ?? null,
            'assigneeId' => $assigneeId,
            'includeArchived' => $query['includeArchived'],
        ]);

        return array_map(fn (array $r) => self::toTaskDTO($pdo, $r), $rows);
    }

    public static function archiveEligibleTasks(): int
    {
        $pdo = Database::connection();
        $systemActor = null;

        $archivedCount = 0;
        $projects = ProjectRepository::listAll($pdo);

        foreach ($projects as $project) {
            $cutoff = Database::nowMs() - ($project['archive_after_hours'] * 3600 * 1000);
            $eligible = TaskRepository::archiveEligible($pdo, $project['id'], $cutoff);
            if ($eligible === []) {
                continue;
            }
            // System user baru dibuat saat benar-benar ada yang perlu diarsipkan.
            $systemActor ??= new AuthContext(
                UserService::getOrCreateSystemUser(),
                self::SYSTEM_ACTOR_CHANNEL,
                self::SYSTEM_ACTOR_AGENT_NAME
            );

            foreach ($eligible as $task) {
                $archived = Database::transaction(function (\PDO $tx) use ($task, $systemActor) {
                    $now = Database::nowMs();
                    if (!TaskRepository::markArchived($tx, $task['id'], $now)) {
                        return false;
                    }
                    self::recordHistory($tx, $task['id'], $systemActor, 'archived', createdAt: $now);
                    return true;
                });
                if ($archived) {
                    $archivedCount++;
                }
            }
        }

        return $archivedCount;
    }

    private static function recordHistory(
        \PDO $pdo,
        string $taskId,
        AuthContext $actor,
        string $action,
        ?string $fieldName = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?int $createdAt = null
    ): void {
        TaskHistoryRepository::insert($pdo, [
            'id' => Uuid::v4(),
            'task_id' => $taskId,
            'actor_user_id' => $actor->user['id'],
            'actor_channel' => $actor->channel,
            'agent_name' => $actor->agentName,
            'action' => $action,
            'field_name' => $fieldName,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'created_at' => $createdAt ?? Database::nowMs(),
        ]);
    }
}
