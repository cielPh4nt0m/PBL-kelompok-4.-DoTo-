<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Database;
use App\Request;
use App\Response;
use App\Services\ProjectService;
use App\Services\SegmentService;
use App\Services\TaskService;
use App\Support\Enums;
use App\Support\Validator;

final class TaskController
{
    public static function create(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);

        $body = $req->body();
        $segmentName = Validator::requireString($body, 'segmentName');
        $segment = SegmentService::getSegmentByNameOrThrow($project['id'], $segmentName);

        $input = [
            'title' => Validator::requireString($body, 'title'),
            'description' => Validator::optionalString($body, 'description'),
            'status' => Validator::optionalEnum($body, 'status', Enums::TASK_STATUSES),
            'priority' => Validator::optionalEnum($body, 'priority', Enums::TASK_PRIORITIES),
            'tags' => Validator::optionalArrayOfString($body, 'tags'),
            'assigneeEmail' => Validator::optionalEmail($body, 'assigneeEmail'),
        ];

        $task = TaskService::createTask($project, $segment, $input, $auth);

        return Response::json($task, 201);
    }

    public static function search(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $query = [
            'q' => $req->query['q'] ?? null,
            'project' => $req->query['project'] ?? null,
            'status' => Validator::optionalEnum($req->query, 'status', Enums::TASK_STATUSES),
            'assignee' => $req->query['assignee'] ?? null,
            'includeArchived' => Validator::coerceBoolQuery($req->query['includeArchived'] ?? null),
        ];

        return Response::json(TaskService::searchTasks($query));
    }

    public static function get(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);

        return Response::json(TaskService::toTaskDTO(Database::connection(), $task));
    }

    public static function updateFields(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $body = $req->body();

        $input = [];
        if (array_key_exists('title', $body)) {
            $input['title'] = Validator::requireString($body, 'title');
        }
        if (array_key_exists('description', $body)) {
            $input['description'] = Validator::optionalString($body, 'description');
        }
        if (array_key_exists('segmentId', $body)) {
            $input['segmentId'] = Validator::requireString($body, 'segmentId');
        }
        if (array_key_exists('links', $body)) {
            $input['links'] = Validator::optionalLinksArray($body, 'links') ?? [];
        }
        if (array_key_exists('tags', $body)) {
            $input['tags'] = Validator::optionalArrayOfString($body, 'tags') ?? [];
        }

        return Response::json(TaskService::updateTaskFields($task, $input, $auth));
    }

    public static function updateStatus(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $status = Validator::requireEnum($req->body(), 'status', Enums::TASK_STATUSES);

        return Response::json(TaskService::updateTaskStatus($task, $status, $auth));
    }

    public static function updatePriority(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $priority = Validator::requireEnum($req->body(), 'priority', Enums::TASK_PRIORITIES);

        return Response::json(TaskService::updateTaskPriority($task, $priority, $auth));
    }

    public static function reassign(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $email = Validator::requireEmail($req->body(), 'assigneeEmail');

        return Response::json(TaskService::reassignTask($task, $email, $auth));
    }

    public static function addComment(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $comment = Validator::requireString($req->body(), 'comment');

        return Response::json(TaskService::addComment($task, $comment, $auth), 201);
    }

    public static function history(Request $req): Response
    {
        Authenticator::resolveUser($req);
        $task = TaskService::getTaskByDisplayIdOrThrow($req->params['displayId']);
        $limit = isset($req->query['limit']) ? (int) $req->query['limit'] : 50;

        return Response::json(TaskService::getTaskHistory($task['id'], $limit));
    }
}
