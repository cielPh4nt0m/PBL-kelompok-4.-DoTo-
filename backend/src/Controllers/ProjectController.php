<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Request;
use App\Response;
use App\Services\ProjectService;
use App\Services\TaskService;
use App\Support\Validator;

final class ProjectController
{
    public static function list(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $projects = array_map(
            static fn (array $p) => TaskService::toProjectDTO($p),
            ProjectService::listProjects()
        );

        return Response::json($projects);
    }

    public static function create(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $body = $req->body();

        $key = Validator::requireProjectKey($body, 'key');
        $name = Validator::requireString($body, 'name');

        $project = ProjectService::createProject($key, $name, $auth->user['id']);

        return Response::json(TaskService::toProjectDTO($project), 201);
    }

    public static function get(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);

        return Response::json(TaskService::toProjectDTO($project));
    }

    public static function board(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        $includeArchived = Validator::coerceBoolQuery($req->query['includeArchived'] ?? null);

        // Archive "malas": dicek setiap board dibuka, jadi tidak wajib ada cron saat demo.
        TaskService::archiveEligibleTasks();

        return Response::json(TaskService::getBoard($project, $includeArchived));
    }
}
