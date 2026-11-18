# Permintaan ke Backend: AI Preferences (pengaturan, izin, dan riwayat Agen AI)

## Pesan siap kirim
Halaman **Settings > AI Preferences** sudah jalan di frontend (`ai-prefs.js`, `ai-preferences.html`) dan sudah tersambung ke halaman Agen AI (`pages/ai.js`) serta pengingat Chrome (`notify.js`). Saat ini semuanya disimpan di browser per akun. Tolong sediakan hal di bawah supaya tersimpan di server dan, yang terpenting, **izin AI ditegakkan di sisi server** (UI saja tidak cukup karena CLI/MCP memakai token API). Bentuk request/respons mengikuti contoh agar frontend tinggal mengganti `loadAiPrefs/saveAiPrefs/loadLog/addLog/updateLog/clearLog` di `ai-prefs.js`.

## 1. Preferensi AI per akun (bukan per proyek)
- `GET /me/ai-preferences` dan `PUT /me/ai-preferences` (ganti seluruhnya), body sama dengan respons:
```json
{ "style": "concise", "tone": "professional", "format": "bullets",
  "perms": { "read": true, "team": true, "modify": true, "delete": false, "confirm": true },
  "behavior": { "summary": true, "suggestions": true, "priority": "deadline", "reminder": "30" },
  "retention": "30" }
```
- Nilai valid: `style` concise|detailed · `tone` professional|friendly · `format` paragraph|bullets · `behavior.priority` deadline|priority|workload · `behavior.reminder` off|30|60|180|1440 (menit sebelum deadline) · `retention` 7|30|90|forever (hari). Selain itu 400. Field yang tidak dikirim memakai default di atas.
- Tabel saran: `ai_preferences(user_id PK, prefs JSON, updated_at)`.
- **Tidak ada** "Response Language": bahasa pesan AI mengikuti pilihan Language pengguna. Kalau pesan disusun di server, butuh `language` (`id`|`en`) di profil user.

## 2. Penegakan izin di server (wajib)
Berlaku untuk request yang memakai token API / channel `agent` (CLI, MCP, Agen AI). Izin efektif = **irisan** preferensi user dengan role, izin proyek, dan kebijakan tim (UI menulis: "Akses mengikuti role, izin proyek, dan kebijakan tim").

| Izin | Jika `false`, request agent ditolak |
|---|---|
| `read` | semua `GET` data proyek/tugas/riwayat → 403 `AI read access is disabled` |
| `team` | daftar anggota/user, dan menugaskan ke orang selain pemilik token → 403 |
| `modify` | `POST/PATCH` tugas, komentar, status, prioritas → 403 |
| `delete` | penghapusan tugas (belum ada fitur hapus; saat ada, agent butuh izin ini **dan** konfirmasi eksplisit) |
| `confirm` | jika `true`, aksi yang mengubah data tidak langsung jalan, lihat bagian 3 |

## 3. Persetujuan aksi (Confirm before important actions)
Saat `confirm = true`, aksi mengubah data dari agent masuk antrean persetujuan. Frontend sekarang memunculkan kartu "Proposed action" di chat (Accept/Reject); backend perlu padanannya:
- Tabel `agent_pending_actions(id, user_id, type, payload JSON, summary, status pending|approved|rejected|expired, created_at, resolved_at)`.
- `POST /agent/actions` (diajukan agent) → 202 + id · `GET /me/agent/actions?status=pending` · `POST /me/agent/actions/:id/approve` (server menjalankan aksi) · `POST /me/agent/actions/:id/reject`.
- Saat `confirm = false` dan `modify = true`, aksi dijalankan langsung dan tetap dicatat di riwayat.

## 4. Riwayat aktivitas AI (menu "AI Activity & Privacy")
- Tabel `ai_activity(id, user_id, ts, kind session|auto|action, title, detail, status NULL, task_id NULL, output BOOL)`.
  - `session` = chat dibuka · `auto` = pesan otomatis (ringkasan, saran, pengingat) · `action` = aksi AI dengan `status` menunggu|selesai|otomatis|ditolak|gagal|diblokir.
  - `output = true` untuk hal yang tampil di panel "Hasil Pekerjaan".
- Endpoint: `GET /me/ai-activity?kind=&limit=&before=` (terbaru dulu) · `POST /me/ai-activity` (dipakai frontend mencatat sesi/pesan otomatis; aksi agent sebaiknya dicatat otomatis oleh server) · `PATCH /me/ai-activity/:id` (ubah `status`, `detail`) · `DELETE /me/ai-activity` (hapus semua riwayat milik user; frontend memintanya lewat tombol tahan 1,2 detik).
- **Retensi:** job harian menghapus entri yang lebih tua dari `retention` hari (dan langsung dijalankan saat pilihan retensi diubah). `forever` = tidak dihapus. Frontend membatasi 300 entri per akun; backend boleh memakai batas sendiri.
- Panel di UI: Riwayat Aktivitas (semua), Status Pekerjaan (`kind=action` dikelompokkan per status), Hasil Pekerjaan (`output=true`), Informasi Penggunaan Data (teks tetap), Retensi & Penghapusan.
- Privasi: data aktivitas tidak dipakai di luar proyek pengguna tanpa izin eksplisit. Sediakan juga ekspor data akun bila memungkinkan.

## 5. Pesan otomatis & pengingat (logika yang sekarang ada di frontend)
Dihitung dari `GET /tasks/search` (butuh `priority`, `dueDate`, `projectId`, `status`, dan Target di deskripsi atau kolom `target` nanti).
- **Tugas milik user** = Target sama dengan username/nama user; tugas tanpa Target memakai penanggung jawab. Hanya yang belum `done`.
- **Urutan rekomendasi** (`behavior.priority`): `deadline` = tenggat terdekat · `priority` = urgent > high > medium > low, lalu tenggat · `workload` = periode (minggu) dengan jumlah tugas aktif terbanyak lebih dulu ("Workload" = jumlah seluruh pekerjaan yang diberikan kepada user dalam jangka waktu tertentu), lalu tenggat.
- **Deadline** dihitung sampai akhir hari tenggat (23:59:59, zona waktu user) karena tugas hanya punya tanggal. Bila nanti ada jam tenggat, pakai itu.
- **Pesan otomatis saat chat dibuka:** ringkasan (jika `summary`), saran (jika `suggestions`), pengingat (jika `reminder` ≠ off dan ada tugas dalam jendela waktunya). Gaya (singkat 3 butir / detail 5 butir + alasan), tone, format (poin / paragraf), dan bahasa mengikuti preferensi. Kalau `read = false`, diganti satu pemberitahuan.
- **Notifikasi Chrome untuk pengingat AI** (dijaga agar tidak terlalu sering): satu notifikasi ringkasan per putaran, paling sering 1x per 30 menit per user, tiap tugas hanya sekali per jendela waktu, hanya jika izin Chrome diberikan, `read = true`, dan master "AI Agent Updates" di Settings > Notification menyala. Untuk produksi, pindahkan ke server (Web Push) dengan aturan yang sama; tanpa itu notifikasi hanya muncul saat ada tab Doto terbuka.
