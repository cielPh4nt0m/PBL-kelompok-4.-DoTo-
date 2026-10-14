<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Request;
use App\Response;

final class MeController
{
    public static function me(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);

        return Response::json(self::toMeDTO($auth->user));
    }

    public static function toMeDTO(array $user): array
    {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'name' => $user['name'],
        ];
    }
}
