<?php

declare(strict_types=1);

// Front controller semua endpoint /api/*. Kode backend ada di ../../backend
// (di luar web root supaya .env dan source PHP tidak bisa diakses langsung).

$backend = dirname(__DIR__, 2) . '/backend';
require $backend . '/autoload.php';

use App\Config;
use App\Http\HttpException;
use App\Http\ValidationException;
use App\Request;
use App\Response;
use App\Router;

Config::load($backend);

$router = new Router();
(require $backend . '/routes.php')($router);

try {
    $response = $router->dispatch(Request::fromGlobals());
} catch (ValidationException $e) {
    $response = Response::json(['error' => $e->getMessage(), 'details' => $e->details], $e->statusCode);
} catch (HttpException $e) {
    $response = Response::json(['error' => $e->getMessage()], $e->statusCode);
} catch (\Throwable $e) {
    error_log((string) $e);
    $response = Response::json(['error' => 'Internal server error'], 500);
}

$response->send();
