# Alat pengembang DoTo PBL

Repo ini memakai PHP native dan MySQL/MariaDB. Perintah di bawah dijalankan dari
root repo. Konfigurasi koneksi dibaca dari `backend/.env`; variabel lingkungan
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASS` dapat menggantikannya.

| Alat | Kegunaan | Perintah |
|---|---|---|
| `backend/database/migrate.php` | Membuat/memperbarui skema, backfill keanggotaan lama sekali, lalu memasang ulang empat trigger. | `php -d extension=pdo_mysql backend/database/migrate.php` |
| `backend/tests/trigger_integration.php` | Menguji nomor tiket, riwayat status, jadwal arsip, validasi anggota, dan rollback pada database sementara. Menolak database yang namanya tidak diawali `doto_trigger_scratch`. | `DB_NAME=doto_trigger_scratch ... php -d extension=pdo_mysql backend/tests/trigger_integration.php` |
| `backend/bin/archive-cron.php` | Menjalankan pengarsipan tugas `done` yang sudah melewati retensi; trigger hanya membuat jadwal. | `php -d extension=pdo_mysql backend/bin/archive-cron.php` |

Untuk database yang berisi data, buat backup terlebih dahulu dan jalankan
migrasi saat tidak ada penulisan tugas bersamaan. Pemasangan ulang trigger
memakai `DROP TRIGGER` lalu `CREATE TRIGGER`; perintah migrasi tidak melakukan
deploy ke server. Rincian relasi dan dampak trigger ada di
[`docs/database.md`](../database.md#trigger-mysqlmariadb).
