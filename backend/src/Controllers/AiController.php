<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Authenticator;
use App\Config;
use App\Request;
use App\Response;
use App\Services\ProjectMemberService;
use App\Services\ProjectService;
use App\Services\TaskService;
use App\Support\Validator;

final class AiController
{
    public static function chat(Request $req): Response
    {
        $auth = Authenticator::resolveUser($req);
        $body = $req->body();

        $projectKey = isset($body['projectKey']) && is_string($body['projectKey']) && trim($body['projectKey']) !== ''
            ? strtoupper(trim($body['projectKey']))
            : 'K4';
        $message = trim(Validator::requireString($body, 'message'));
        $history = isset($body['history']) && is_array($body['history']) ? $body['history'] : [];

        try {
            $project = ProjectService::getProjectByKeyOrThrow($projectKey);
        } catch (\Throwable) {
            $projects = ProjectService::listProjects();
            if ($projects === []) {
                $project = ProjectService::createProject('K4', 'Kelompok 4 PBL', $auth->user['id']);
            } else {
                $project = $projects[0];
            }
        }

        $board = TaskService::getBoard($project, false);
        $members = ProjectMemberService::list($project);

        $apiKey = Config::googleApiKey();
        if ($apiKey !== '' && function_exists('curl_init')) {
            $llmResult = self::callGemini($apiKey, $project, $board, $members, $auth->user, $message, $history);
            if ($llmResult !== null) {
                return Response::json([
                    'reply' => $llmResult['reply'],
                    'proposals' => $llmResult['proposals'],
                    'mode' => 'llm',
                ]);
            }
        }

        $fallback = self::fallbackSmartAssistant($project, $board, $members, $auth->user, $message);
        return Response::json([
            'reply' => $fallback['reply'],
            'proposals' => $fallback['proposals'],
            'mode' => 'fallback',
        ]);
    }

    /**
     * @return array{reply:string,proposals:array}|null
     */
    private static function callGemini(
        string $apiKey,
        array $project,
        array $board,
        array $members,
        array $currentUser,
        string $message,
        array $history
    ): ?array {
        $segments = array_map(static fn (array $s) => $s['segment']['name'], $board['segments']);
        if ($segments === []) {
            $segments = ['To Do'];
        }

        $tasksSummary = [];
        foreach ($board['segments'] as $segGroup) {
            $segName = $segGroup['segment']['name'];
            foreach ($segGroup['tasks'] as $t) {
                $tasksSummary[] = sprintf(
                    '- %s: "%s" [segment=%s, status=%s, priority=%s, dueDate=%s, assignee=%s]',
                    $t['displayId'],
                    $t['title'],
                    $segName,
                    $t['status'],
                    $t['priority'],
                    $t['dueDate'] ?? 'none',
                    $t['assigneeEmail'] ?? $t['assigneeUsername'] ?? 'unassigned'
                );
            }
        }
        $tasksBlock = $tasksSummary !== [] ? implode("\n", array_slice($tasksSummary, 0, 50)) : '(Belum ada task aktif)';

        $membersSummary = array_map(
            static fn (array $m) => sprintf('- %s (@%s, %s)', $m['name'], $m['username'], $m['email']),
            $members
        );
        $membersBlock = $membersSummary !== [] ? implode("\n", $membersSummary) : '(Belum ada daftar anggota)';

        $today = date('Y-m-d');
        $defaultDue = date('Y-m-d', strtotime('+14 days'));
        $segmentsStr = implode(', ', $segments);

        $systemPrompt = <<<PROMPT
Kamu adalah Asisten AI resmi aplikasi manajemen tugas tim **DoTo** untuk proyek "{$project['name']}" (kode proyek: {$project['key']}).
Hari ini: {$today}. Pengguna yang sedang berbicara: {$currentUser['name']} (@{$currentUser['username']}, {$currentUser['email']}).

Daftar Segment di proyek {$project['key']}:
{$segmentsStr}

Daftar Anggota Tim:
{$membersBlock}

Daftar Tugas Aktif di Board saat ini:
{$tasksBlock}

TUGASMU:
Jawab pertanyaan/perintah pengguna dalam Bahasa Indonesia yang ringkas, jelas, dan membantu.
Jika pengguna meminta pembuatan tugas, pengubahan status, pengubahan prioritas, pengubahan tenggat (due date), penugasan ulang (reassign), atau penambahan komentar pada tugas, sertakan objek aksi di dalam array `proposals` supaya pengguna dapat menekan tombol **Accept** di antarmuka web.

Format respons WAJIB berupa JSON valid dengan skema berikut:
{
  "reply": "Penjelasan/jawaban ramah dalam Bahasa Indonesia",
  "proposals": [
    {
      "kind": "create_task | update_status | update_priority | update_due_date | reassign_task | add_comment",
      "title": "Judul singkat tombol aksi",
      "detail": "Ringkasan perubahan",
      "payload": { ... }
    }
  ]
}

Aturan `payload` untuk setiap `kind`:
1. `create_task`: `{"projectKey": "{$project['key']}", "segmentName": "<pilih dari segment yang ada>", "title": "<judul tugas>", "description": "<deskripsi>", "priority": "low|medium|high|urgent", "status": "idea|todo|in_progress|needs_review", "dueDate": "YYYY-MM-DD (default {$defaultDue})", "target": "<nama anggota atau Semua tim>", "assigneeEmail": "<email anggota bila disebut>"}`
2. `update_status`: `{"displayId": "K4-1", "status": "idea|todo|in_progress|needs_review|done"}`
3. `update_priority`: `{"displayId": "K4-1", "priority": "low|medium|high|urgent"}`
4. `update_due_date`: `{"displayId": "K4-1", "dueDate": "YYYY-MM-DD"}`
5. `reassign_task`: `{"displayId": "K4-1", "assigneeEmail": "email@anggota"}`
6. `add_comment`: `{"displayId": "K4-1", "comment": "Isi komentar"}`

Jika pengguna hanya bertanya atau meminta ringkasan tanpa aksi perubahan data, kembalikan `"proposals": []` (atau 1 saran aksi yang paling relevan bila membantu).
PROMPT;

        $contents = [];
        foreach (array_slice($history, -6) as $turn) {
            if (!is_array($turn) || empty($turn['content'])) {
                continue;
            }
            $role = ($turn['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => (string) $turn['content']]],
            ];
        }
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $message]],
        ];

        $isVertexKey = str_starts_with($apiKey, 'AQ.');
        $endpoint = $isVertexKey
            ? 'https://aiplatform.googleapis.com/v1beta1/publishers/google/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey)
            : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey);

        $reqBody = [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.25,
                'responseMimeType' => 'application/json',
            ],
        ];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($reqBody, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 25,
        ]);
        $raw = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!is_string($raw) || $httpCode < 200 || $httpCode >= 300) {
            return null;
        }

        $resp = json_decode($raw, true);
        $text = $resp['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!is_string($text) || trim($text) === '') {
            return null;
        }

        $clean = trim($text);
        if (str_starts_with($clean, '```')) {
            $clean = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $clean) ?? $clean;
        }
        $parsed = json_decode($clean, true);
        if (!is_array($parsed) || empty($parsed['reply'])) {
            return [
                'reply' => $clean,
                'proposals' => [],
            ];
        }

        $proposals = [];
        if (isset($parsed['proposals']) && is_array($parsed['proposals'])) {
            foreach ($parsed['proposals'] as $p) {
                if (is_array($p) && !empty($p['kind']) && isset($p['payload']) && is_array($p['payload'])) {
                    $proposals[] = [
                        'kind' => (string) $p['kind'],
                        'title' => (string) ($p['title'] ?? 'Usulan Aksi AI'),
                        'detail' => (string) ($p['detail'] ?? ''),
                        'payload' => $p['payload'],
                    ];
                }
            }
        }

        return [
            'reply' => (string) $parsed['reply'],
            'proposals' => $proposals,
        ];
    }

    private static function implodeSegments(array $segments): string
    {
        return implode(', ', $segments);
    }

    /**
     * Fallback analisis cerdas di sisi server apabila API key LLM tidak aktif/mengalami gangguan.
     *
     * @return array{reply:string,proposals:array}
     */
    private static function fallbackSmartAssistant(
        array $project,
        array $board,
        array $members,
        array $currentUser,
        string $message
    ): array {
        $lower = mb_strtolower($message);
        $allTasks = [];
        $segments = [];
        foreach ($board['segments'] as $s) {
            $segments[] = $s['segment']['name'];
            foreach ($s['tasks'] as $t) {
                $allTasks[] = $t;
            }
        }
        $defaultSegment = $segments[0] ?? 'To Do';

        // Cek display ID (mis. K4-1)
        $displayId = null;
        if (preg_match('/\b([A-Za-z][A-Za-z0-9]{1,9}-\d+)\b/', $message, $m)) {
            $displayId = strtoupper($m[1]);
        }

        if ($displayId !== null && preg_match('/\b(komentar|komen|comment|catat|note)\b/i', $lower)) {
            $comment = trim((string) preg_replace(
                '/^\s*(tambah(kan)?|buat(kan)?|add|leave|tulis(kan)?)?\s*(komentar|komen|comment|catat|note)\s*(di|pada|ke|on|for|untuk|task)?\s*' . preg_quote($displayId, '/') . '\s*[:：-]?\s*/i',
                '',
                $message
            ));
            if ($comment === '' || strcasecmp($comment, $message) === 0) {
                $comment = trim(str_ireplace($displayId, '', $message));
            }
            if ($comment === '') {
                $comment = 'Catatan tindak lanjut dari Asisten AI.';
            }
            return [
                'reply' => "Siap, saya sudah menyiapkan komentar untuk tugas {$displayId}. Klik Accept untuk mengirimkannya:",
                'proposals' => [[
                    'kind' => 'add_comment',
                    'title' => "Tambah komentar pada {$displayId}",
                    'detail' => $comment,
                    'payload' => ['displayId' => $displayId, 'comment' => $comment],
                ]],
            ];
        }

        if ($displayId !== null && preg_match('/\b(deadline|tenggat|due\s*date|tanggal)\b/i', $lower) && preg_match('/(\d{4}-\d{2}-\d{2})/', $message, $dm)) {
            return [
                'reply' => "Siap, saya usulkan perubahan tenggat tugas {$displayId} menjadi {$dm[1]}:",
                'proposals' => [[
                    'kind' => 'update_due_date',
                    'title' => "Ubah tenggat {$displayId} → {$dm[1]}",
                    'detail' => "Tenggat baru: {$dm[1]}",
                    'payload' => ['displayId' => $displayId, 'dueDate' => $dm[1]],
                ]],
            ];
        }

        if ($displayId !== null && preg_match('/\b(prioritas|priority|naikkan|turunkan)\b/i', $lower)) {
            $prio = 'high';
            if (preg_match('/\b(urgent|mendesak|darurat)\b/i', $lower)) {
                $prio = 'urgent';
            } elseif (preg_match('/\b(low|rendah)\b/i', $lower)) {
                $prio = 'low';
            } elseif (preg_match('/\b(medium|sedang)\b/i', $lower)) {
                $prio = 'medium';
            }
            return [
                'reply' => "Oke, berikut usulan perubahan prioritas untuk {$displayId} menjadi {$prio}:",
                'proposals' => [[
                    'kind' => 'update_priority',
                    'title' => "Ubah prioritas {$displayId} → {$prio}",
                    'detail' => "Prioritas baru: {$prio}",
                    'payload' => ['displayId' => $displayId, 'priority' => $prio],
                ]],
            ];
        }

        if ($displayId !== null && preg_match('/\b(status|pindah|move|tandai|ubah|done|selesai|in_progress|proses|needs_review|review|todo|idea)\b/i', $lower)) {
            $status = 'done';
            if (preg_match('/\b(needs_review|review|tinjau)\b/i', $lower)) {
                $status = 'needs_review';
            } elseif (preg_match('/\b(in_progress|in progress|proses|dikerjakan)\b/i', $lower)) {
                $status = 'in_progress';
            } elseif (preg_match('/\b(todo|to do|antre)\b/i', $lower)) {
                $status = 'todo';
            } elseif (preg_match('/\b(idea|ide)\b/i', $lower)) {
                $status = 'idea';
            }
            return [
                'reply' => "Siap, saya usulkan perubahan status {$displayId} menjadi {$status}:",
                'proposals' => [[
                    'kind' => 'update_status',
                    'title' => "Ubah status {$displayId} → {$status}",
                    'detail' => "Status baru: {$status}",
                    'payload' => ['displayId' => $displayId, 'status' => $status],
                ]],
            ];
        }

        if (preg_match('/\b(buat|buatkan|tambah|tambahkan|bikin|create|add)\b/i', $lower)) {
            $prio = 'medium';
            if (preg_match('/\b(urgent|mendesak)\b/i', $lower)) {
                $prio = 'urgent';
            } elseif (preg_match('/\b(high|tinggi|penting)\b/i', $lower)) {
                $prio = 'high';
            } elseif (preg_match('/\b(low|rendah)\b/i', $lower)) {
                $prio = 'low';
            }
            $dueDate = date('Y-m-d', strtotime('+14 days'));
            if (preg_match('/(\d{4}-\d{2}-\d{2})/', $message, $dm)) {
                $dueDate = $dm[1];
            }
            $title = trim((string) preg_replace([
                '/^\s*(tolong\s+)?(buat(kan)?|tambah(kan)?|bikin(kan)?|create|add)\s+(task|tugas)?(\s+baru)?\s*/i',
                '/\b(dengan\s+)?(prioritas|priority)\s+(urgent|mendesak|tinggi|high|sedang|medium|rendah|low)\b/i',
            ], '', $message));
            if ($title === '') {
                $title = 'Tugas baru';
            }
            $title = ucfirst($title);

            return [
                'reply' => "Siap! Berikut draf tugas baru untuk proyek {$project['key']}. Silakan klik Accept untuk menyimpannya ke database:",
                'proposals' => [[
                    'kind' => 'create_task',
                    'title' => "Buat tugas baru di {$project['key']}",
                    'detail' => $title,
                    'payload' => [
                        'projectKey' => $project['key'],
                        'segmentName' => $defaultSegment,
                        'title' => $title,
                        'description' => "Dibuat melalui Asisten AI: \"{$message}\"",
                        'priority' => $prio,
                        'status' => 'todo',
                        'dueDate' => $dueDate,
                    ],
                ]],
            ];
        }

        // Default: ringkasan cerdas kondisi board saat ini
        $counts = ['idea' => 0, 'todo' => 0, 'in_progress' => 0, 'needs_review' => 0, 'done' => 0];
        foreach ($allTasks as $t) {
            if (isset($counts[$t['status']])) {
                $counts[$t['status']]++;
            }
        }
        $total = count($allTasks);
        return [
            'reply' => "Ringkasan proyek {$project['name']} ({$project['key']}): terdapat {$total} tugas aktif " .
                "({$counts['idea']} idea, {$counts['todo']} todo, {$counts['in_progress']} in progress, {$counts['needs_review']} needs review, {$counts['done']} done). " .
                "Kamu bisa meminta saya membuat tugas baru, mengubah status/prioritas/deadline tugas, atau menambahkan komentar.",
            'proposals' => [],
        ];
    }
}
