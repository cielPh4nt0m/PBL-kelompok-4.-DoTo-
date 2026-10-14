<?php

declare(strict_types=1);

namespace App;

use App\Http\ValidationException;

final class Request
{
    /** @var array<string,string> */
    private array $headers;

    /** @var array<string,string> */
    public array $params = [];

    /** @var array<string,mixed>|null */
    private ?array $jsonBody = null;
    private bool $bodyParsed = false;

    private function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        array $headers,
        private readonly array $cookies,
        private readonly string $rawBody
    ) {
        $normalized = [];
        foreach ($headers as $name => $value) {
            $normalized[strtolower($name)] = $value;
        }
        $this->headers = $normalized;
    }

    public static function fromGlobals(): self
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        // Buang prefix sebelum /api supaya route tetap cocok walau app ada di
        // subfolder (mis. XAMPP: /doto/public/api/projects -> /api/projects).
        $apiPos = strpos($path, '/api/');
        if ($apiPos !== false) {
            $path = substr($path, $apiPos);
        }
        $headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
        $rawBody = file_get_contents('php://input') ?: '';

        return new self($method, $path, $_GET, $headers, $_COOKIE, $rawBody);
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function cookie(string $name): ?string
    {
        return $this->cookies[$name] ?? null;
    }

    /**
     * @return array<string,mixed>
     */
    public function body(): array
    {
        if ($this->bodyParsed) {
            return $this->jsonBody ?? [];
        }

        $this->bodyParsed = true;

        if (trim($this->rawBody) === '') {
            $this->jsonBody = [];
            return $this->jsonBody;
        }

        $decoded = json_decode($this->rawBody, true);
        if (!is_array($decoded)) {
            throw new ValidationException('Invalid JSON body');
        }

        $this->jsonBody = $decoded;
        return $this->jsonBody;
    }

    public function withParams(array $params): self
    {
        $clone = clone $this;
        $clone->params = $params;
        return $clone;
    }
}
