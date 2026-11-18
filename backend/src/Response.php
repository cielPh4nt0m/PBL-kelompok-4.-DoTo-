<?php

declare(strict_types=1);

namespace App;

final class Response
{
    /** @var array<int,array{name:string,value:string,options:array}> */
    private array $cookies = [];

    private function __construct(
        private readonly int $status,
        private readonly mixed $data,
        private readonly bool $hasBody
    ) {
    }

    public static function json(mixed $data, int $status = 200): self
    {
        return new self($status, $data, true);
    }

    public static function noContent(): self
    {
        return new self(204, null, false);
    }

    public function withCookie(string $name, string $value, array $options = []): self
    {
        $this->cookies[] = ['name' => $name, 'value' => $value, 'options' => $options];
        return $this;
    }

    public function withClearedCookie(string $name, array $options = []): self
    {
        $this->cookies[] = ['name' => $name, 'value' => '', 'options' => array_merge($options, ['expires' => 1])];
        return $this;
    }

    public function send(): void
    {
        foreach ($this->cookies as $cookie) {
            setcookie($cookie['name'], $cookie['value'], $cookie['options']);
        }

        http_response_code($this->status);

        if (!$this->hasBody) {
            return;
        }

        header('Content-Type: application/json');
        echo json_encode($this->data, JSON_UNESCAPED_SLASHES);
    }
}
