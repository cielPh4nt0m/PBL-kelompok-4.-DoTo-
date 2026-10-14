<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Request;
use App\Response;
use App\Services\UserService;
use App\Support\Validator;

// API token milik user yang sedang login (dipakai CLI dan MCP).
final class TokenController
{
    public static function list(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);

        return Response::json(UserService::listTokens($auth->user['id']));
    }

    public static function create(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $label = trim(Validator::requireString($req->body(), 'label'));

        return Response::json(UserService::createTokenForUser($auth->user['id'], $label), 201);
    }

    public static function revoke(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        UserService::revokeToken($auth->user['id'], $req->params['id']);

        return Response::noContent();
    }
}
