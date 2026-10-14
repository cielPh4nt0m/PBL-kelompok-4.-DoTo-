<?php

declare(strict_types=1);

namespace App\Repositories;

final class UserRepository
{
    public static function findByEmail(\PDO $pdo, string $email): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByUsername(\PDO $pdo, string $username): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(\PDO $pdo, string $id): ?array
    {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function insert(\PDO $pdo, array $row): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO users (id, username, email, name, password_hash, created_at)
             VALUES (:id, :username, :email, :name, :password_hash, :created_at)'
        );
        $stmt->execute([
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'name' => $row['name'],
            'password_hash' => $row['password_hash'],
            'created_at' => $row['created_at'],
        ]);
    }
}
