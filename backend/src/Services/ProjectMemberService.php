<?php

declare(strict_types=1);

namespace App\Services;

use App\Database;
use App\Http\ConflictException;
use App\Http\HttpException;
use App\Http\NotFoundException;
use App\Http\ValidationException;
use App\Repositories\ProjectMemberRepository;

final class ProjectMemberService
{
    public static function isMember(string $projectId, string $userId): bool
    {
        return ProjectMemberRepository::isMember(Database::connection(), $projectId, $userId);
    }

    public static function list(array $project): array
    {
        return array_map(static fn (array $row) => [
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'name' => $row['name'],
            'joinedAt' => (int) $row['joined_at'],
        ], ProjectMemberRepository::listByProject(Database::connection(), $project['id']));
    }

    public static function add(array $project, string $email, string $actorId): array
    {
        self::requireCreator($project, $actorId);
        $user = UserService::getUserOrThrow($email);
        $pdo = Database::connection();
        if (ProjectMemberRepository::isMember($pdo, $project['id'], $user['id'])) {
            throw new ConflictException('Pengguna sudah menjadi anggota proyek');
        }
        $joinedAt = Database::nowMs();
        ProjectMemberRepository::add($pdo, $project['id'], $user['id'], $joinedAt);
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'name' => $user['name'],
            'joinedAt' => $joinedAt,
        ];
    }

    public static function remove(array $project, string $userId, string $actorId): void
    {
        self::requireCreator($project, $actorId);
        if ($userId === $project['created_by']) {
            throw new ValidationException('Pembuat proyek harus tetap menjadi anggota');
        }
        $pdo = Database::connection();
        if (!ProjectMemberRepository::isMember($pdo, $project['id'], $userId)) {
            throw new NotFoundException('Anggota proyek tidak ditemukan');
        }
        if (ProjectMemberRepository::hasAssignedTasks($pdo, $project['id'], $userId)) {
            throw new ConflictException('Alihkan tugas anggota sebelum menghapus keanggotaan');
        }
        ProjectMemberRepository::remove($pdo, $project['id'], $userId);
    }

    private static function requireCreator(array $project, string $actorId): void
    {
        if ($project['created_by'] !== $actorId) {
            throw new HttpException(403, 'Hanya pembuat proyek yang dapat mengelola anggota');
        }
    }
}
