<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Config;
use App\Http\UnauthorizedException;
use App\Http\ValidationException;
use App\Request;
use App\Response;
use App\Services\UserService;
use App\Support\Validator;

final class AuthController
{
    public static function publicConfig(Request $req): Response
    {
        $clientId = Config::googleClientId();
        $apiKey = Config::googleApiKey();
        $provider = Config::aiProvider();
        return Response::json([
            'googleClientId' => $clientId !== '' ? $clientId : null,
            'aiEnabled' => true,
            'aiProvider' => $apiKey !== ''
                ? ($provider === 'vertex' ? 'gemini-vertex' : 'gemini-aistudio')
                : 'smart-rule',
            'aiModel' => $apiKey !== '' ? Config::aiModel() : null,
        ]);
    }

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

    public static function google(Request $req): Response
    {
        $body = $req->body();
        $credential = $body['credential'] ?? $body['idToken'] ?? null;
        if (!is_string($credential) || trim($credential) === '') {
            throw new ValidationException('Google ID token diperlukan');
        }

        $payload = self::verifyGoogleIdToken(trim($credential));
        $sub = (string) ($payload['sub'] ?? '');
        $email = (string) ($payload['email'] ?? '');
        $name = (string) ($payload['name'] ?? '');

        if ($sub === '' || $email === '') {
            throw new UnauthorizedException('Token Google tidak memuat informasi akun yang lengkap');
        }

        $user = UserService::findOrCreateGoogleUser($sub, $email, $name);
        Authenticator::logIn($user['id']);

        return Response::json(MeController::toMeDTO($user));
    }

    public static function logout(Request $req): Response
    {
        Authenticator::logOut($req);

        return Response::json(['ok' => true]);
    }

    /**
     * @return array<string,mixed>
     */
    private static function verifyGoogleIdToken(string $idToken): array
    {
        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
        $raw = null;
        $statusCode = 0;

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            $res = curl_exec($ch);
            $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if (is_string($res)) {
                $raw = $res;
            }
        } else {
            $ctx = stream_context_create(['http' => ['timeout' => 10, 'ignore_errors' => true]]);
            $res = @file_get_contents($url, false, $ctx);
            if (is_string($res)) {
                $raw = $res;
                $statusCode = 200;
            }
        }

        if ($raw === null || $statusCode !== 200) {
            throw new UnauthorizedException('Verifikasi token Google gagal atau kedaluwarsa');
        }

        $data = json_decode($raw, true);
        if (!is_array($data) || isset($data['error'])) {
            throw new UnauthorizedException('Token Google tidak valid');
        }

        $iss = (string) ($data['iss'] ?? '');
        if ($iss !== 'accounts.google.com' && $iss !== 'https://accounts.google.com') {
            throw new UnauthorizedException('Issuer token Google tidak sesuai');
        }

        $expectedAud = Config::googleClientId();
        if ($expectedAud !== '' && ($data['aud'] ?? '') !== $expectedAud) {
            throw new UnauthorizedException('Client ID Google tidak cocok');
        }

        $exp = (int) ($data['exp'] ?? 0);
        if ($exp > 0 && $exp < time()) {
            throw new UnauthorizedException('Token Google sudah kedaluwarsa');
        }

        $emailVerified = $data['email_verified'] ?? false;
        if ($emailVerified !== true && $emailVerified !== 'true') {
            throw new UnauthorizedException('Email Google belum terverifikasi');
        }

        return $data;
    }
}
