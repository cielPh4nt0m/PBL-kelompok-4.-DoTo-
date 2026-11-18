# Permintaan ke Backend: pengaturan & pemicu notifikasi

## Pesan siap kirim
Halaman **Settings > Notification** sudah jalan di frontend (`notify.js`). Sekarang notifikasi memakai Chrome Notification API dan pengecekan berkala (tiap 30 detik) ke API. Tolong sediakan hal di bawah supaya pengaturan tersimpan di akun (bukan di browser) dan nanti bisa diganti ke push.

## 1. Simpan pengaturan per akun
- `GET /me/notification-preferences` → `{ "g": { "tasks": true, "deadline": true, "comments": true, "team": true, "ai": true }, "i": { "taskNew": true, ... } }`
- `PUT /me/notification-preferences` dengan body yang sama (ganti seluruhnya). Validasi: kunci harus dikenal, nilai boolean.
- Tabel saran: `notification_preferences(user_id PK, prefs JSON, updated_at)`.
- Kunci `g`: `tasks, deadline, comments, team, ai`. Kunci `i` (default di dalam kurung):
  `taskNew(on) taskUpdated(on) taskStatus(on) taskDeadline(on) taskDone(on)` · `dl1d(on) dl1h(off) dlLate(on) dlPending(off)` · `mention(on) comment(on) reply(off)` · `memberAdded(on) memberChange(off) announcement(on) important(off)` · `agentDone(on) agentFail(off) agentApproval(on) agentReport(off)`.
- Setelah ini ada, frontend cukup mengganti `loadPrefs/savePrefs` di `notify.js` ke endpoint tersebut.

## 2. Syarat data agar pengecekan frontend akurat
- `tasks.updated_at` **harus berubah** setiap ada perubahan field, status, prioritas, penugasan, dan **komentar baru** (frontend memakai perubahan `updatedAt` sebagai tanda untuk mengambil riwayat).
- DTO tugas memuat `createdBy` (id user pembuat), `assigneeId`, `updatedAt`, `dueDate`.
- `GET /tasks/:id/history?limit=N` memuat `id, actorUserId, actorUsername, actorChannel ('web'|'agent'|...), action, fieldName, newValue, comment, createdAt`, urut terbaru dulu.
- `GET /tasks/search` tanpa filter mengembalikan semua tugas yang boleh dilihat user (frontend memakainya sebagai sumber cek).

## 3. Pemicu yang belum punya sumber data
Pengaturan ini sudah ada di UI tetapi belum ada kejadian yang memicunya. Frontend menyediakan `window.DotoNotify.emit(kind, judul, isi, url)`:
- `announcement` (Pengumuman proyek), `important` (Aktivitas penting) → butuh fitur/endpoint pengumuman dan definisi "aktivitas penting".
- `agentFail`, `agentApproval`, `agentReport` → perlu status kejadian dari Agen AI (gagal, menunggu persetujuan, laporan). Halaman Agen AI bisa memanggil `emit` saat kejadian itu terjadi.

## 4. Ke depan: push dari server
Polling 30 detik cukup untuk prototype. Untuk produksi, pertimbangkan SSE (`GET /me/events`) atau Web Push (service worker) supaya notifikasi tetap muncul saat tab Doto ditutup.
