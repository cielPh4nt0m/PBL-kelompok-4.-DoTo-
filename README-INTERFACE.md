# DoTo – versi interface saja

Semua halaman bisa dibuka **tanpa PHP, MySQL, atau backend yang menyala**.
Endpoint `/api/*` ditiru di browser oleh `assets/js/mock-api.js` (data contoh disimpan di localStorage).
File HTML/JS/CSS dari backend tidak diubah, kecuali satu baris `<script src="assets/js/mock-api.js">` di tiap HTML.

## Cara membuka
Jangan klik dua kali file HTML (modul ES diblokir browser kalau lewat `file://`). Pakai salah satu:

- **VS Code:** pasang ekstensi *Live Server*, klik kanan `index.html` > *Open with Live Server*
- **Python:** `python -m http.server 8000` di folder ini, lalu buka http://localhost:8000
- **Node:** `npx serve .`

## Login
Mode interface menerima username/email dan password (minimal 6 karakter) apa saja. Akun dibuat otomatis kalau belum ada.
Data awal: 4 anggota tim, proyek K4 (Kelompok 4 PBL), UIUX, MENGAJAR, DRAFT. Tugas K4 diisi otomatis oleh `fe-shell.js` saat Welcome/Calendar dibuka pertama kali.

## Reset data
Tombol **Reset** di pojok kanan bawah (atau `DotoMock.reset()` di console).

## Kembali ke backend asli
Ubah `USE_MOCK` di `assets/js/mock-api.js` menjadi `false`, atau hapus tag `<script src="assets/js/mock-api.js">` dari HTML.

## Tidak disertakan
`backend/`, `cli/`, `mcp/`, `docs/`, `graphify-out/`, `public/router.php`, `public/api/`.

## Calendar (menggantikan To-do list)
- `calendar.html` menampilkan tugas pada tanggal tenggatnya. Tugas baru dari Kanban, sidebar (+), atau Asisten AI otomatis muncul.
- Tenggat bawaan tugas baru = **14 hari**. Bisa diubah di form tambah tugas, atau di `task.html` (kolom **Due date**).
- `todo.html` dihapus. Submenu sidebar: Calendar, Kanban Board, Asisten AI.

## Kontrak yang dibutuhkan backend nanti (belum dikerjakan)
Mock sudah memakai field **`dueDate`** (`YYYY-MM-DD` atau `null`) pada tugas:
- DTO tugas mengembalikan `dueDate`; `POST /projects/:key/tasks` dan `PATCH /tasks/:id` menerimanya.
- Bila tidak dikirim saat membuat tugas: server mengisi hari ini + 14 hari.
- Perubahan tenggat dicatat di riwayat (`field_updated`, `fieldName: dueDate`).
- Kolom database: `ALTER TABLE tasks ADD COLUMN due_date DATE NULL;` (tugas lama dibiarkan NULL, tidak tampil di kalender).
