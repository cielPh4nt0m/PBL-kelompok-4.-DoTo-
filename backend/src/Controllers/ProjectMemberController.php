<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Request;
use App\Response;
use App\Services\ProjectMemberService;
use App\Services\ProjectService;
use App\Support\Validator;

final class ProjectMemberController
{
    public static function list(Request $req): Response
    {
        Authenticator::resolveUser($req);
        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        return Response::json(ProjectMemberService::list($project));
    }

    public static function add(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        $email = Validator::requireString($req->body(), 'email');
        return Response::json(ProjectMemberService::add($project, $email, $auth->user['id']), 201);
    }

    public static function remove(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $project = ProjectService::getProjectByKeyOrThrow($req->params['key']);
        ProjectMemberService::remove($project, $req->params['userId'], $auth->user['id']);
        return Response::json(['ok' => true]);
    }
}
