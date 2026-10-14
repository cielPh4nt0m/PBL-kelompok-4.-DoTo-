<?php

declare(strict_types=1);

namespace App\Auth;

final class AuthContext
{
    public function __construct(
        public readonly array $user,
        public readonly string $channel,
        public readonly ?string $agentName
    ) {
    }
}
