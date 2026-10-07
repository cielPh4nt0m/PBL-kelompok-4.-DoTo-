# DoTo

Doto: manajemen tugas tim & agen AI. Proyek PBL kelompok 4.

Konsepnya: setiap **proyek** (mis. `WEB`) punya beberapa **segment** (kolom board). Di dalam segment ada **tugas** (`WEB-1`, `WEB-2`, …) dengan status `idea → todo → in_progress → needs_review → done`, prioritas, assignee, tag, komentar, dan riwayat perubahan lengkap. Riwayat mencatat dari mana perubahan datang: web, CLI, atau agent AI. Tugas yang sudah `done` lebih dari 72 jam otomatis diarsipkan.

DoTo bisa diakses lewat tiga jalur:

- **Web**: HTML/CSS/JS polos, login dengan username/email + password.
- **CLI** `doto`: Node.js, login dengan API token.
- **MCP server**: untuk agent AI (Claude, dll.), login dengan API token.

## Struktur

```
public/      web root: halaman HTML, assets, dan api/index.php (front controller)
backend/     kode PHP native (tidak bisa diakses langsung dari browser)
  src/         Controllers → Services → Repositories (PDO MySQL)
  database/    setup.sql, schema.sql, migrate.php
  bin/         archive-cron.php
cli/doto.js  CLI (Node ≥ 20, tanpa dependency)
mcp/         MCP server (Node ≥ 20)
```

## Kebutuhan

- PHP ≥ 8.1 dengan ekstensi `pdo_mysql`
- MySQL atau MariaDB
- Node.js ≥ 20 (hanya untuk CLI dan MCP)

## Menjalankan di lokal

### 1. Siapkan database

**MariaDB/MySQL biasa:** buat database `doto` dan user `doto` (password `doto`):

```bash
sudo mariadb < backend/database/setup.sql
```

**XAMPP:** buat database `doto` lewat phpMyAdmin, lalu di `backend/.env` isi `DB_USER=root` dan kosongkan `DB_PASS=`.

### 2. Konfigurasi dan migrasi

```bash
cp backend/.env.example backend/.env    # sesuaikan bila perlu
php -d extension=pdo_mysql backend/database/migrate.php
```

> Flag `-d extension=pdo_mysql` diperlukan kalau `pdo_mysql` belum aktif di `php.ini` (mis. PHP bawaan Arch Linux). Di XAMPP ekstensi ini sudah aktif, jadi flag-nya boleh dihapus.

### 3. Jalankan server

```bash
php -d extension=pdo_mysql -S localhost:8000 -t public public/router.php
```

Buka http://localhost:8000, lalu **Register** untuk membuat akun.

**XAMPP:** salin folder repo ke `htdocs/`, lalu buka `http://localhost/<nama-folder>/public/`. File `public/api/.htaccess` sudah mengarahkan request API ke `index.php`.

### 4. Archive otomatis (opsional)

Board sudah mengarsipkan tugas setiap kali dibuka. Kalau ingin tetap jalan tanpa ada yang membuka board, jadwalkan cron tiap jam:

```
0 * * * * php -d extension=pdo_mysql /path/ke/repo/backend/bin/archive-cron.php
```

## CLI

Buat token di halaman **Tokens**, lalu:

```bash
node cli/doto.js config set-url http://localhost:8000
node cli/doto.js config set-token doto_xxxxx
node cli/doto.js board WEB
node cli/doto.js task create WEB "To Do" "Tulis laporan" -p high -t docs
node cli/doto.js task status WEB-1 in_progress
node cli/doto.js help          # semua perintah
```

Config CLI disimpan di `~/.config/doto/config.json`.

## MCP server (agent AI)

```bash
cd mcp && npm install
```

Contoh konfigurasi di MCP client (mis. Claude Desktop / Claude Code):

```json
{
  "mcpServers": {
    "doto": {
      "command": "node",
      "args": ["/path/ke/repo/mcp/server.js"],
      "env": {
        "DOTO_API_URL": "http://localhost:8000",
        "DOTO_API_TOKEN": "doto_xxxxx",
        "DOTO_AGENT_NAME": "claude"
      }
    }
  }
}
```

Tool yang tersedia: `list_projects`, `get_board`, `get_task`, `create_task`, `update_task_status`, `update_task_priority`, `reassign_task`, `add_comment`, `get_task_history`, dan `search_tasks`.

## API

Semua endpoint ada di bawah `/api` dan memakai JSON. Request harus terautentikasi lewat salah satu dari:

- cookie sesi `doto_session` (dari login web), atau
- header `Authorization: Bearer doto_...`

Header opsional `X-Client-Channel: web|cli|agent` dan `X-Agent-Name` dicatat di riwayat tugas.

| Method | Path | Keterangan |
|---|---|---|
| POST | /auth/register | `{username, email, password}` (tanpa login) |
| POST | /auth/login | `{login, password}`, login bisa username atau email (tanpa login) |
| POST | /auth/logout | |
| GET | /me | user yang sedang login |
| GET/POST | /me/tokens | daftar token / buat token `{label}` |
| DELETE | /tokens/:id | cabut token milik sendiri |
| GET/POST | /projects | daftar / buat proyek `{key, name}` |
| GET | /projects/:key | |
| GET | /projects/:key/board | `?includeArchived=true` |
| GET/POST | /projects/:key/segments | `{name}` |
| POST | /projects/:key/tasks | `{segmentName, title, description?, status?, priority?, tags?, assigneeEmail?}` |
| GET | /tasks/search | `?q&project&status&assignee&includeArchived` |
| GET/PATCH | /tasks/:id | PATCH: `{title?, description?, segmentId?, links?, tags?}` |
| PATCH | /tasks/:id/status | `{status}` |
| PATCH | /tasks/:id/priority | `{priority}` |
| PATCH | /tasks/:id/assignee | `{assigneeEmail}` |
| POST | /tasks/:id/comments | `{comment}` |
| GET | /tasks/:id/history | `?limit` |
