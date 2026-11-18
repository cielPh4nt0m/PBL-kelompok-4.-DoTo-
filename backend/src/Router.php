<?php

declare(strict_types=1);

namespace App;

use App\Http\NotFoundException;

final class Router
{
    /** @var array<int,array{method:string,regex:string,handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'regex' => $this->compile($pattern),
            'handler' => $handler,
        ];
    }

    private function compile(string $pattern): string
    {
        $regex = preg_replace('#:([a-zA-Z_][a-zA-Z0-9_]*)#', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $regex . '$#';
    }

    public function dispatch(Request $req): Response
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $req->method) {
                continue;
            }
            if (preg_match($route['regex'], $req->path, $matches) === 1) {
                $params = array_filter(
                    $matches,
                    static fn ($key) => !is_int($key),
                    ARRAY_FILTER_USE_KEY
                );
                $handler = $route['handler'];
                return $handler($req->withParams($params));
            }
        }

        throw new NotFoundException('Route not found');
    }
}
