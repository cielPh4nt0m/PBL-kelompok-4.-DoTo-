<?php

declare(strict_types=1);

namespace App\Http;

class ValidationException extends HttpException
{
    public function __construct(
        string $message = 'Invalid request',
        public readonly array $details = []
    ) {
        parent::__construct(400, $message);
    }
}
