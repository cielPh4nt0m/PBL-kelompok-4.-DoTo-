<?php

declare(strict_types=1);

namespace App\Services;

use App\Database;
use App\Http\ConflictException;
use App\Http\NotFoundException;
use App\Repositories\ProjectRepository;
use App\Support\Uuid;

final class ProjectService
{
    private const DEFAULT_ARCHIVE_AFTER_HOURS = 72;

    public static function createProject(string $key, string $name, string $createdBy): array
    {
        $pdo = Database::connection();

        if (ProjectRepository::findByKey($pdo, $key) !== null) {
            throw new ConflictException('A project with this key already exists');
        }

        $row = [
            'id' => Uuid::v4(),
            'key' => $key,
            'name' => $name,
            'next_seq' => 1,
            'archive_after_hours' => self::DEFAULT_ARCHIVE_AFTER_HOURS,
            'created_by' => $createdBy,
            'created_at' => Database::nowMs(),
        ];

        ProjectRepository::insert($pdo, $row);

        return $row;
    }

    public static function listProjects(): array
    {
        return ProjectRepository::listAll(Database::connection());
    }

    public static function getProjectByKeyOrThrow(string $key): array
    {
        $project = ProjectRepository::findByKey(Database::connection(), $key);
        if ($project === null) {
            throw new NotFoundException('Project not found');
        }
        return $project;
    }
}
