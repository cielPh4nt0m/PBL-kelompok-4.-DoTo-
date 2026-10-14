<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Http\UnauthorizedException;
use App\Request;
use App\Response;
use App\Services\UserService;
use App\Support\Validator;

final class AuthController
{
    public static function register(Request $req): Response
    {
        $body = $req->body();
        $username = Validator::requireUsername($body, 'username');
        $email = Validator::requireEmail($body, 'email');
        $password = Validator::requireString($body, 'password', 6);

        $user = UserService::register($username, $email, $password);
        Authenticator::logIn($user['id']);

        return Response::json(MeController::toMeDTO($user), 201);
    }

    public static function login(Request $req): Response
    {
        $body = $req->body();
        $login = trim(Validator::requireString($body, 'login'));
        $password = Validator::requireString($body, 'password');

        $user = UserService::verifyCredentials($login, $password);
        if ($user === null) {
            // Pesan sengaja umum: jangan bocorkan apakah username/email terdaftar.
            throw new UnauthorizedException('Wrong username/email or password');
        }

        Authenticator::logIn($user['id']);

        return Response::json(MeController::toMeDTO($user));
    }

    public static function logout(Request $req): Response
    {
        Authenticator::logOut($req);

        return Response::json(['ok' => true]);
    }
}
