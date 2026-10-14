<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Request;
use App\Response;
use App\Services\ProjectService;
use App\Services\SegmentService;
use App\Services\TaskService;
use App\Support\Validator;

final class SegmentController
{
    public static function list(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        $segments = array_map(
            static fn (array $s) => TaskService::toSegmentDTO($s),
            SegmentService::listSegments($project['id'])
        );

        return Response::json($segments);
    }

    public static function create(Request $req): Response
    {
        Authenticator::resolveUser($req);

        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        $name = Validator::requireString($req->body(), 'name');

        $segment = SegmentService::createSegment($project['id'], $name);

        return Response::json(TaskService::toSegmentDTO($segment), 201);
    }
}
