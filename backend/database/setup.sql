-- Setup awal database DoTo (jalankan sekali sebagai admin MariaDB/MySQL):
--   sudo mariadb < backend/database/setup.sql
-- Pengguna XAMPP bisa melewati file ini dan cukup membuat database `doto`
-- lewat phpMyAdmin, lalu isi DB_USER=root dan DB_PASS kosong di backend/.env.

CREATE DATABASE IF NOT EXISTS doto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'doto'@'localhost' IDENTIFIED BY 'doto';
GRANT ALL PRIVILEGES ON doto.* TO 'doto'@'localhost';
FLUSH PRIVILEGES;
