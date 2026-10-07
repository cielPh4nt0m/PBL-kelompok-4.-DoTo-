<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\MeController;
use App\Controllers\ProjectController;
use App\Controllers\SegmentController;
use App\Controllers\TaskController;
use App\Controllers\TokenController;
use App\Router;

return function (Router $router): void {
    $router->add('POST', '/api/auth/register', [AuthController::class, 'register']);
    $router->add('POST', '/api/auth/login', [AuthController::class, 'login']);
    $router->add('POST', '/api/auth/logout', [AuthController::class, 'logout']);

    $router->add('GET', '/api/me', [MeController::class, 'me']);
    $router->add('GET', '/api/me/tokens', [TokenController::class, 'list']);
    $router->add('POST', '/api/me/tokens', [TokenController::class, 'create']);
    $router->add('DELETE', '/api/tokens/:id', [TokenController::class, 'revoke']);

    $router->add('GET', '/api/projects', [ProjectController::class, 'list']);
    $router->add('POST', '/api/projects', [ProjectController::class, 'create']);
    $router->add('GET', '/api/projects/:key', [ProjectController::class, 'get']);
    $router->add('GET', '/api/projects/:key/board', [ProjectController::class, 'board']);

    $router->add('GET', '/api/projects/:key/segments', [SegmentController::class, 'list']);
    $router->add('POST', '/api/projects/:key/segments', [SegmentController::class, 'create']);

    $router->add('POST', '/api/projects/:key/tasks', [TaskController::class, 'create']);

    // Harus didaftarkan sebelum /api/tasks/:displayId: router ini mencocokkan
    // berurutan, tidak memprioritaskan path statis seperti Fastify.
    $router->add('GET', '/api/tasks/search', [TaskController::class, 'search']);

    $router->add('GET', '/api/tasks/:displayId', [TaskController::class, 'get']);
    $router->add('PATCH', '/api/tasks/:displayId', [TaskController::class, 'updateFields']);
    $router->add('PATCH', '/api/tasks/:displayId/status', [TaskController::class, 'updateStatus']);
    $router->add('PATCH', '/api/tasks/:displayId/priority', [TaskController::class, 'updatePriority']);
    $router->add('PATCH', '/api/tasks/:displayId/assignee', [TaskController::class, 'reassign']);
    $router->add('POST', '/api/tasks/:displayId/comments', [TaskController::class, 'addComment']);
    $router->add('GET', '/api/tasks/:displayId/history', [TaskController::class, 'history']);
};
