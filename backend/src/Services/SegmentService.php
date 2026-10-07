<?php

declare(strict_types=1);

namespace App\Services;

use App\Database;
use App\Http\ConflictException;
use App\Http\NotFoundException;
use App\Repositories\SegmentRepository;
use App\Support\Uuid;

final class SegmentService
{
    public static function createSegment(string $projectId, string $name): array
    {
        $pdo = Database::connection();

        if (SegmentRepository::findByProjectAndName($pdo, $projectId, $name) !== null) {
            throw new ConflictException('A segment with this name already exists in this project');
        }

        $position = SegmentRepository::maxPosition($pdo, $projectId) + 1;

        $row = [
            'id' => Uuid::v4(),
            'project_id' => $projectId,
            'name' => $name,
            'position' => $position,
            'created_at' => Database::nowMs(),
        ];

        SegmentRepository::insert($pdo, $row);

        return $row;
    }

    public static function listSegments(string $projectId): array
    {
        return SegmentRepository::listByProject(Database::connection(), $projectId);
    }

    public static function getSegmentByNameOrThrow(string $projectId, string $name): array
    {
        $segment = SegmentRepository::findByProjectAndName(Database::connection(), $projectId, $name);
        if ($segment === null) {
            throw new NotFoundException('Segment not found');
        }
        return $segment;
    }

    public static function getSegmentByIdOrThrow(string $id): array
    {
        $segment = SegmentRepository::findById(Database::connection(), $id);
        if ($segment === null) {
            throw new NotFoundException('Segment not found');
        }
        return $segment;
    }
}
