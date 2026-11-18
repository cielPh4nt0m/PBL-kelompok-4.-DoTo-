<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Http\ValidationException;
use App\Request;
use App\Response;
use App\Services\UserService;
use App\Support\Validator;

final class MeController
{
    public static function me(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);

        return Response::json(self::toMeDTO($auth->user));
    }

    public static function check(Request $req): Response
    {
        $auth = Authenticator::resolveOptionalUser($req);
        $username = isset($req->query['username']) ? trim((string) $req->query['username']) : null;
        $email = isset($req->query['email']) ? trim((string) $req->query['email']) : null;
        $currentUserId = $auth?->user['id'] ?? null;

        $res = UserService::checkAvailability($username, $email, $currentUserId);
        return Response::json($res);
    }

    public static function update(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $body = $req->body();

        $input = [];
        if (array_key_exists('name', $body)) {
            $name = trim(Validator::requireString($body, 'name', 2));
            if (mb_strlen($name) > 60) {
                throw new ValidationException('Invalid request', ['name' => 'maximum 60 characters']);
            }
            $input['name'] = $name;
        }

        if (array_key_exists('username', $body)) {
            $username = strtolower(trim(Validator::requireString($body, 'username')));
            if (!preg_match('/^[a-z0-9._]{3,15}$/', $username)) {
                throw new ValidationException('Invalid request', ['username' => 'must match ^[a-z0-9._]{3,15}$']);
            }
            $input['username'] = $username;
        }

        if (array_key_exists('email', $body)) {
            $input['email'] = Validator::requireEmail($body, 'email');
        }

        if (array_key_exists('role', $body)) {
            $role = Validator::optionalString($body, 'role');
            if ($role !== null && mb_strlen($role) > 40) {
                throw new ValidationException('Invalid request', ['role' => 'maximum 40 characters']);
            }
            $input['role'] = $role;
        }

        if (array_key_exists('bio', $body)) {
            $bio = Validator::optionalString($body, 'bio');
            if ($bio !== null && mb_strlen($bio) > 200) {
                throw new ValidationException('Invalid request', ['bio' => 'maximum 200 characters']);
            }
            $input['bio'] = $bio;
        }

        if (array_key_exists('teamKey', $body)) {
            $teamKey = Validator::optionalString($body, 'teamKey');
            if ($teamKey !== null && mb_strlen($teamKey) > 16) {
                throw new ValidationException('Invalid request', ['teamKey' => 'maximum 16 characters']);
            }
            $input['teamKey'] = $teamKey;
        }

        if (array_key_exists('avatarUrl', $body)) {
            $avatarUrl = Validator::optionalString($body, 'avatarUrl');
            if ($avatarUrl !== null && strlen($avatarUrl) > 300000) {
                throw new ValidationException('Invalid request', ['avatarUrl' => 'maximum 300KB']);
            }
            $input['avatarUrl'] = $avatarUrl;
        }

        $user = UserService::updateProfile($auth->user['id'], $input);
        return Response::json(self::toMeDTO($user));
    }

    public static function verifyEmail(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $user = UserService::verifyEmail($auth->user['id']);
        return Response::json(self::toMeDTO($user));
    }

    public static function changePassword(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $body = $req->body();

        $currentPassword = isset($body['currentPassword']) && is_string($body['currentPassword']) ? $body['currentPassword'] : null;
        $newPassword = Validator::requireString($body, 'newPassword', 6);

        UserService::changePassword($auth->user['id'], $currentPassword, $newPassword);
        return Response::json(['ok' => true]);
    }

    public static function getNotificationPreferences(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $prefs = UserService::getNotificationPreferences($auth->user['id']);
        return Response::json($prefs);
    }

    public static function saveNotificationPreferences(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $body = $req->body();
        if (!is_array($body)) {
            throw new ValidationException('Invalid request', ['prefs' => 'must be object']);
        }
        $saved = UserService::saveNotificationPreferences($auth->user['id'], $body);
        return Response::json($saved);
    }

    public static function toMeDTO(array $user): array
    {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'] ?? null,
            'bio' => $user['bio'] ?? null,
            'teamKey' => $user['team_key'] ?? null,
            'emailVerified' => (bool) ($user['email_verified'] ?? false),
            'avatarUrl' => $user['avatar_data'] ?? null,
            'hasPassword' => ($user['password_hash'] !== null && $user['password_hash'] !== ''),
        ];
    }
}
