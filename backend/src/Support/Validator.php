<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\ValidationException;

final class Validator
{
    public static function requireString(array $data, string $field, int $minLen = 1): string
    {
        $value = $data[$field] ?? null;
        if (!is_string($value) || mb_strlen($value) < $minLen) {
            throw new ValidationException("Invalid request", [$field => "must be a string with at least $minLen character(s)"]);
        }
        return $value;
    }

    public static function optionalString(array $data, string $field): ?string
    {
        $value = $data[$field] ?? null;
        if ($value === null) {
            return null;
        }
        if (!is_string($value)) {
            throw new ValidationException('Invalid request', [$field => 'must be a string']);
        }
        return $value;
    }

    public static function requireEmail(array $data, string $field): string
    {
        $value = self::requireString($data, $field);
        if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            throw new ValidationException('Invalid request', [$field => 'must be a valid email']);
        }
        return $value;
    }

    public static function optionalEmail(array $data, string $field): ?string
    {
        $value = self::optionalString($data, $field);
        if ($value === null) {
            return null;
        }
        if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            throw new ValidationException('Invalid request', [$field => 'must be a valid email']);
        }
        return $value;
    }

    /**
     * @param string[] $allowed
     */
    public static function requireEnum(array $data, string $field, array $allowed): string
    {
        $value = self::requireString($data, $field);
        if (!in_array($value, $allowed, true)) {
            throw new ValidationException('Invalid request', [$field => 'must be one of: ' . implode(', ', $allowed)]);
        }
        return $value;
    }

    /**
     * @param string[] $allowed
     */
    public static function optionalEnum(array $data, string $field, array $allowed): ?string
    {
        $value = self::optionalString($data, $field);
        if ($value === null) {
            return null;
        }
        if (!in_array($value, $allowed, true)) {
            throw new ValidationException('Invalid request', [$field => 'must be one of: ' . implode(', ', $allowed)]);
        }
        return $value;
    }

    /**
     * @return string[]|null
     */
    public static function optionalArrayOfString(array $data, string $field): ?array
    {
        $value = $data[$field] ?? null;
        if ($value === null) {
            return null;
        }
        if (!is_array($value)) {
            throw new ValidationException('Invalid request', [$field => 'must be an array of strings']);
        }
        foreach ($value as $item) {
            if (!is_string($item)) {
                throw new ValidationException('Invalid request', [$field => 'must be an array of strings']);
            }
        }
        return array_values($value);
    }

    /**
     * @return array<int,array{url:string,label:string}>|null
     */
    public static function optionalLinksArray(array $data, string $field): ?array
    {
        $value = $data[$field] ?? null;
        if ($value === null) {
            return null;
        }
        if (!is_array($value)) {
            throw new ValidationException('Invalid request', [$field => 'must be an array of {url,label}']);
        }

        $links = [];
        foreach ($value as $item) {
            if (!is_array($item) || !isset($item['url'], $item['label']) || !is_string($item['url']) || !is_string($item['label'])) {
                throw new ValidationException('Invalid request', [$field => 'each link must have url and label']);
            }
            if (filter_var($item['url'], FILTER_VALIDATE_URL) === false) {
                throw new ValidationException('Invalid request', [$field => 'each link url must be valid']);
            }
            $links[] = ['url' => $item['url'], 'label' => $item['label']];
        }

        return $links;
    }

    public static function requireUsername(array $data, string $field = 'username'): string
    {
        $value = trim(self::requireString($data, $field));
        if (!preg_match('/^[A-Za-z0-9_.]{3,32}$/', $value)) {
            throw new ValidationException('Invalid request', [$field => 'must be 3-32 characters: letters, numbers, _ or .']);
        }
        return $value;
    }

    public static function requireProjectKey(array $data, string $field = 'key'): string
    {
        $value = self::requireString($data, $field);
        if (!preg_match('/^[A-Z][A-Z0-9]*$/', $value) || mb_strlen($value) < 2 || mb_strlen($value) > 10) {
            throw new ValidationException('Invalid request', [$field => 'must match ^[A-Z][A-Z0-9]*$ and be 2-10 characters']);
        }
        return $value;
    }

    public static function coerceBoolQuery(?string $value, bool $default = false): bool
    {
        if ($value === null) {
            return $default;
        }
        return in_array(strtolower($value), ['true', '1'], true);
    }
}
