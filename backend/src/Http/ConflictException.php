<?php

declare(strict_types=1);

namespace App\Http;

class ConflictException extends HttpException
{
    public function __construct(string $message = 'Conflict')
    {
        parent::__construct(409, $message);
    }
}
