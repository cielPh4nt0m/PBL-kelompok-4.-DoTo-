/* Mock API untuk mode INTERFACE-ONLY.
   Meniru endpoint /api/* dari backend PHP langsung di browser (data disimpan di localStorage),
   jadi semua halaman bisa dibuka TANPA PHP, MySQL, maupun backend yang menyala.
   Dimuat paling awal di <head>. Kode halaman lain (api.js, fe-shell.js, pages/*.js) tidak diubah.
   Saat backend asli sudah siap: ubah USE_MOCK menjadi false (atau hapus tag <script> file ini). */
(function () {
  'use strict';
  var USE_MOCK = true;
  if (!USE_MOCK || window.__dotoMock) return;
  window.__dotoMock = true;

  var KEY = 'doto-mock-db-v2';
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  var uid = function () {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  };
  var HOUR = 36e5;
  var dayStr = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var DUE_RE = /^\d{4}-\d{2}-\d{2}$/;

  /* ---------- penyimpanan ---------- */
  var db;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* tetap jalan di memori */ } }
  function load() { try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* abaikan */ } return null; }

  function seed() {
    var t = Date.now() - 30 * 24 * HOUR;
    db = { users: [], session: null, projects: [], members: [], segments: [], tasks: [], history: [], tokens: [] };
    [['erhan', 'erhan@polinema.ac.id', 'Erhan'], ['rasyiq', 'rasyiqsatriomusthafa@gmail.com', 'Rasyiq'],
     ['hamas', 'nexthamas95@gmail.com', 'Hamas'], ['fadila', 'fadila@polinema.ac.id', 'Fadila']]
      .forEach(function (u, i) { db.users.push({ id: uid(), username: u[0], email: u[1], name: u[2], createdAt: t + i }); });
    var owner = db.users[0];
    [['K4', 'Kelompok 4 PBL', []],
     ['UIUX', 'Agenda Lomba UI/UX', [['Riset kompetitor lomba', 'in_progress', 'high', 3], ['Susun moodboard', 'todo', 'medium', 9], ['Kumpulkan referensi desain', 'done', 'low', -4]]],
     ['MENGAJAR', 'Polinema Mengajar', [['Siapkan materi pertemuan 1', 'todo', 'medium', 5], ['Rekap kehadiran peserta', 'idea', 'low', 16]]],
     ['DRAFT', 'Draft Proyek', [['Tulis ide awal proyek', 'idea', 'medium', 12]]]]
      .forEach(function (p, i) {
        var proj = mkProject(p[0], p[1], owner.id, t + i * 1000);
        db.users.forEach(function (u) { addMember(proj.id, u.id, t + i * 1000); });   // 4 anggota tim ikut di semua proyek contoh
        p[2].forEach(function (x) {
          mkTask(proj, 'To Do', { title: x[0], status: x[1], priority: x[2], dueDate: dayStr(x[3]) }, owner, t + 5000 + i);
        });
      });
    save();
  }

  /* ---------- model ---------- */
  function E(status, msg, details) { var e = new Error(msg); e.status = status; e.details = details; return e; }
  function me() {
    var u = db.users.filter(function (x) { return x.id === db.session; })[0];
    if (!u) throw E(401, 'Missing credentials');
    return u;
  }
  var meDTO = function (u) { return { id: u.id, username: u.username, email: u.email, name: u.name, role: u.role || null, bio: u.bio || null, teamKey: u.teamKey || null, emailVerified: u.emailVerified !== false }; };
  var userById = function (id) { return db.users.filter(function (u) { return u.id === id; })[0] || null; };
  var userByLogin = function (l) { l = String(l).toLowerCase(); return db.users.filter(function (u) { return u.username.toLowerCase() === l || u.email.toLowerCase() === l; })[0] || null; };
  var projectByKey = function (k) {
    var p = db.projects.filter(function (x) { return x.key === String(k).toUpperCase(); })[0];
    if (!p) throw E(404, 'Project not found'); return p;
  };
  var isMember = function (pid, uid_) { return db.members.some(function (m) { return m.projectId === pid && m.userId === uid_; }); };
  var addMember = function (pid, uid_, at) { if (!isMember(pid, uid_)) db.members.push({ projectId: pid, userId: uid_, joinedAt: at || Date.now() }); };
  var joinAll = function (u) { db.projects.forEach(function (p) { addMember(p.id, u.id); }); };

  function mkProject(key, name, creator, at) {
    var p = { id: uid(), key: key, name: name, nextSeq: 1, archiveAfterHours: 72, createdBy: creator, createdAt: at || Date.now() };
    db.projects.push(p);
    addMember(p.id, creator, p.createdAt);
    mkSegment(p, 'To Do', p.createdAt);
    return p;
  }
  function mkSegment(p, name, at) {
    var s = { id: uid(), projectId: p.id, name: name, position: db.segments.filter(function (x) { return x.projectId === p.id; }).length + 1, createdAt: at || Date.now() };
    db.segments.push(s); return s;
  }
  function segByName(p, name) {
    var s = db.segments.filter(function (x) { return x.projectId === p.id && x.name === name; })[0];
    if (!s) throw E(404, 'Segment not found'); return s;
  }
  function actorOf(ctx) { return { id: me().id, channel: ctx && ctx.headers['x-client-channel'] || 'web', agent: ctx && ctx.headers['x-agent-name'] || null }; }
  function hist(task, actor, action, field, oldV, newV, comment, at) {
    var h = { id: uid(), taskId: task.id, actorUserId: actor.id, actorChannel: actor.channel, agentName: actor.agent, action: action,
      fieldName: field || null, oldValue: oldV == null ? null : String(oldV), newValue: newV == null ? null : String(newV), comment: comment || null, createdAt: at || Date.now() };
    db.history.push(h); return h;
  }
  function mkTask(p, segName, input, actor, at) {
    var now = at || Date.now(), seg = segByName(p, segName), actorUser = actor.id ? actor : userById(actor);
    var seq = p.nextSeq++;
    var t = { id: uid(), projectId: p.id, segmentId: seg.id, seq: seq, displayId: p.key + '-' + seq, title: input.title,
      description: input.description == null ? null : input.description, status: input.status || 'idea', priority: input.priority || 'medium',
      assigneeId: input.assigneeId || actorUser.id, createdBy: actorUser.id, tags: (input.tags || []).slice(), links: [], dueDate: input.dueDate || null,
      statusChangedAt: now, archivedAt: null, createdAt: now, updatedAt: now };
    db.tasks.push(t);
    hist(t, { id: actorUser.id, channel: 'web', agent: null }, 'created', null, null, t.displayId, null, now);
    return t;
  }
  function taskByDisplay(id) {
    var t = db.tasks.filter(function (x) { return x.displayId === String(id); })[0];
    if (!t) throw E(404, 'Task not found'); sweep(); return t;
  }
  // Tugas done lebih dari archiveAfterHours otomatis diarsipkan (di backend asli: cron + trigger).
  function sweep() {
    var now = Date.now(), ch = false;
    db.tasks.forEach(function (t) {
      var p = db.projects.filter(function (x) { return x.id === t.projectId; })[0];
      if (t.status === 'done' && !t.archivedAt && p && now - t.statusChangedAt > p.archiveAfterHours * HOUR) { t.archivedAt = now; ch = true; }
    });
    if (ch) save();
  }
  function taskDTO(t) {
    var a = userById(t.assigneeId) || {};
    return Object.assign({}, t, { tags: t.tags.slice(), links: t.links.slice(), assigneeEmail: a.email || null, assigneeName: a.name || null, assigneeUsername: a.username || null });
  }
  var histDTO = function (h) { var a = userById(h.actorUserId); return Object.assign({}, h, { actorUsername: a ? a.username : null }); };

  /* ---------- validasi ---------- */
  var STATUSES = ['idea', 'todo', 'in_progress', 'needs_review', 'done'];
  var PRIORITIES = ['low', 'medium', 'high', 'urgent'];
  var bad = function (f, m) { return E(400, 'Invalid request', (function (o) { o[f] = m; return o; })({})); };
  function str(b, f) { var v = b && b[f]; if (typeof v !== 'string' || !v.trim()) throw bad(f, 'must be a string'); return v.trim(); }
  function enumOf(b, f, list) { var v = b && b[f]; if (list.indexOf(v) < 0) throw bad(f, 'must be one of: ' + list.join(', ')); return v; }
  function email(b, f) { var v = str(b, f); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw bad(f, 'must be a valid email'); return v; }
  var uname = function (v) { if (!/^[a-z0-9._]{3,15}$/.test(v)) throw bad('username', 'must be 3-15 characters: lowercase letters, numbers, _ or .'); return v; };

  db = load();               // dipanggil setelah semua helper terdefinisi
  if (!db) seed();

  /* ---------- routes ---------- */
  var routes = [];
  function route(method, pattern, fn) {
    var keys = [];
    var re = new RegExp('^' + pattern.replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method: method, re: re, keys: keys, fn: fn });
  }
  function startSession(u) { joinAll(u); db.session = u.id; }

  route('POST', '/auth/register', function (c) {
    var username = uname(str(c.body, 'username')), mail = email(c.body, 'email'), pw = str(c.body, 'password');
    if (pw.length < 6) throw bad('password', 'must be at least 6 characters');
    if (userByLogin(username)) throw E(409, 'Username is already taken');
    if (userByLogin(mail)) throw E(409, 'Email is already registered');
    var u = { id: uid(), username: username, email: mail, name: username, emailVerified: false, createdAt: Date.now() };
    db.users.push(u); startSession(u);
    return [201, meDTO(u)];
  });
  // MODE INTERFACE: login menerima kredensial apa saja; akun dibuat otomatis bila belum ada.
  route('POST', '/auth/login', function (c) {
    var login = str(c.body, 'login'); str(c.body, 'password');
    var u = userByLogin(login);
    if (!u) {
      var isMail = login.indexOf('@') > 0, base = (isMail ? login.split('@')[0] : login).toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'user';
      while (base.length < 3) base += '_';
      base = base.slice(0, 15); var name = base, n = 1;
      while (userByLogin(name)) name = base.slice(0, 12) + (++n);
      u = { id: uid(), username: name, email: isMail ? login : name + '@doto.local', name: name, emailVerified: false, createdAt: Date.now() };
      db.users.push(u);
    }
    startSession(u);
    return [200, meDTO(u)];
  });
  route('POST', '/auth/logout', function () { db.session = null; return [200, { ok: true }]; });
  route('GET', '/me', function () { return [200, meDTO(me())]; });

  // ---- profil ----
  route('GET', '/users/check', function (c) {
    var u = me(), other;
    if (c.query.username) other = db.users.filter(function (x) { return x.username === c.query.username && x.id !== u.id; })[0];
    else if (c.query.email) other = db.users.filter(function (x) { return x.email.toLowerCase() === String(c.query.email).toLowerCase() && x.id !== u.id; })[0];
    else throw bad('username', 'username or email is required');
    return [200, { available: !other }];
  });
  route('PATCH', '/me', function (c) {
    var u = me(), b = c.body || {}, upd = {};
    if ('name' in b) { var nm = str(b, 'name'); if (nm.length < 2 || nm.length > 60) throw bad('name', 'must be 2-60 characters'); upd.name = nm; }
    if ('username' in b) {
      var un = uname(str(b, 'username'));
      if (un !== u.username && db.users.some(function (x) { return x.username === un; })) throw E(409, 'Username is already taken');
      upd.username = un;
    }
    if ('email' in b) {
      var em = email(b, 'email');
      if (em.toLowerCase() !== u.email.toLowerCase()) {
        if (db.users.some(function (x) { return x.email.toLowerCase() === em.toLowerCase() && x.id !== u.id; })) throw E(409, 'Email is already registered');
        upd.email = em; upd.emailVerified = false;   // email baru harus diverifikasi ulang
      }
    }
    ['role', 'bio'].forEach(function (f) {
      if (f in b) { var v = b[f] == null ? '' : String(b[f]).trim(), max = f === 'role' ? 40 : 200; if (v.length > max) throw bad(f, 'must be at most ' + max + ' characters'); upd[f] = v || null; }
    });
    if ('teamKey' in b) {
      if (!b.teamKey) upd.teamKey = null;
      else { var p = projectByKey(b.teamKey); if (!isMember(p.id, u.id)) throw bad('teamKey', 'must be a project you are a member of'); upd.teamKey = p.key; }
    }
    Object.assign(u, upd);
    return [200, meDTO(u)];
  });
  // Placeholder: backend asli mengirim email berisi tautan; di sini tombol "Klik untuk verifikasi" langsung memverifikasi.
  route('POST', '/me/email/verify', function () { var u = me(); u.emailVerified = true; return [200, meDTO(u)]; });

  route('GET', '/me/tokens', function () {
    var u = me();
    return [200, db.tokens.filter(function (t) { return t.userId === u.id; }).map(function (t) { return { id: t.id, label: t.label, createdAt: t.createdAt, lastUsedAt: t.lastUsedAt, revokedAt: t.revokedAt }; }).reverse()];
  });
  route('POST', '/me/tokens', function (c) {
    var u = me(), label = str(c.body, 'label'), tok = 'doto_' + uid().replace(/-/g, '') + uid().replace(/-/g, '').slice(0, 8);
    var t = { id: uid(), userId: u.id, label: label, createdAt: Date.now(), lastUsedAt: null, revokedAt: null };
    db.tokens.push(t);
    return [201, { token: tok, id: t.id, label: label }];
  });
  route('DELETE', '/tokens/:id', function (c) {
    var u = me(), t = db.tokens.filter(function (x) { return x.id === c.params.id && x.userId === u.id; })[0];
    if (!t) throw E(404, 'Token not found');
    if (!t.revokedAt) t.revokedAt = Date.now();
    return [204];
  });

  route('GET', '/projects', function () { me(); return [200, db.projects.slice()]; });
  route('POST', '/projects', function (c) {
    var u = me(), key = str(c.body, 'key').toUpperCase(), name = str(c.body, 'name');
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(key)) throw bad('key', 'must match ^[A-Z][A-Z0-9]*$ and be 2-10 characters');
    if (db.projects.some(function (p) { return p.key === key; })) throw E(409, 'A project with this key already exists');
    return [201, mkProject(key, name, u.id)];
  });
  route('GET', '/projects/:key', function (c) { me(); return [200, projectByKey(c.params.key)]; });
  route('GET', '/projects/:key/board', function (c) {
    me(); var p = projectByKey(c.params.key), inc = c.query.includeArchived === 'true' || c.query.includeArchived === '1'; sweep();
    var segs = db.segments.filter(function (s) { return s.projectId === p.id; }).sort(function (a, b) { return a.position - b.position; });
    return [200, { project: p, segments: segs.map(function (s) {
      return { segment: s, tasks: db.tasks.filter(function (t) { return t.segmentId === s.id && (inc || !t.archivedAt); }).sort(function (a, b) { return a.createdAt - b.createdAt; }).map(taskDTO) };
    }) }];
  });

  var memberDTO = function (m) { var u = userById(m.userId); return { id: u.id, username: u.username, email: u.email, name: u.name, joinedAt: m.joinedAt }; };
  route('GET', '/projects/:key/members', function (c) {
    me(); var p = projectByKey(c.params.key);
    return [200, db.members.filter(function (m) { return m.projectId === p.id; }).map(memberDTO)];
  });
  route('POST', '/projects/:key/members', function (c) {
    var u = me(), p = projectByKey(c.params.key), mail = email(c.body, 'email');
    if (p.createdBy !== u.id) throw E(403, 'Only the project creator can manage members');
    var target = userByLogin(mail); if (!target) throw E(404, 'User not found');
    if (isMember(p.id, target.id)) throw E(409, 'User is already a project member');
    addMember(p.id, target.id);
    return [201, memberDTO(db.members[db.members.length - 1])];
  });
  route('DELETE', '/projects/:key/members/:userId', function (c) {
    var u = me(), p = projectByKey(c.params.key);
    if (p.createdBy !== u.id) throw E(403, 'Only the project creator can manage members');
    if (c.params.userId === p.createdBy) throw E(409, 'Project creator cannot be removed');
    if (db.tasks.some(function (t) { return t.projectId === p.id && t.assigneeId === c.params.userId; })) throw E(409, 'Member still has assigned tasks');
    db.members = db.members.filter(function (m) { return !(m.projectId === p.id && m.userId === c.params.userId); });
    return [204];
  });

  route('GET', '/projects/:key/segments', function (c) { me(); var p = projectByKey(c.params.key); return [200, db.segments.filter(function (s) { return s.projectId === p.id; })]; });
  route('POST', '/projects/:key/segments', function (c) {
    me(); var p = projectByKey(c.params.key), name = str(c.body, 'name');
    if (db.segments.some(function (s) { return s.projectId === p.id && s.name === name; })) throw E(409, 'A segment with this name already exists in this project');
    return [201, mkSegment(p, name)];
  });

  route('POST', '/projects/:key/tasks', function (c) {
    var u = me(), p = projectByKey(c.params.key), b = c.body || {};
    var segName = str(b, 'segmentName'), title = str(b, 'title'), seg = segByName(p, segName);
    var status = b.status == null ? undefined : enumOf(b, 'status', STATUSES), priority = b.priority == null ? undefined : enumOf(b, 'priority', PRIORITIES);
    if (status === 'done') throw E(400, 'Buat tugas aktif dahulu, lalu ubah status menjadi done');
    var due = b.dueDate == null || b.dueDate === '' ? dayStr(14) : b.dueDate;   // default tenggat: 2 minggu
    if (typeof due !== 'string' || !DUE_RE.test(due)) throw bad('dueDate', 'must be a date in YYYY-MM-DD format');
    var assignee = u;
    if (b.assigneeEmail) { assignee = userByLogin(email(b, 'assigneeEmail')); if (!assignee) throw E(404, 'User not found'); }
    if (!isMember(p.id, assignee.id)) throw E(400, 'Assignee bukan anggota proyek');
    var tags = Array.isArray(b.tags) ? b.tags.filter(function (x) { return typeof x === 'string' && x.trim(); }).map(function (x) { return x.trim(); }) : [];
    var t = mkTask(p, seg.name, { title: title, description: typeof b.description === 'string' ? b.description : null, status: status, priority: priority, tags: tags, assigneeId: assignee.id, dueDate: due },
      { id: u.id }, Date.now());
    t.segmentId = seg.id;
    return [201, taskDTO(t)];
  });

  route('GET', '/tasks/search', function (c) {
    me(); sweep();
    var q = (c.query.q || '').toLowerCase(), inc = c.query.includeArchived === 'true' || c.query.includeArchived === '1', pid = null, aid = null;
    if (c.query.project) pid = projectByKey(c.query.project).id;
    if (c.query.assignee) { var a = userByLogin(c.query.assignee); if (!a) throw E(404, 'User not found'); aid = a.id; }
    if (c.query.status) enumOf(c.query, 'status', STATUSES);
    return [200, db.tasks.filter(function (t) {
      return (inc || !t.archivedAt) && (!pid || t.projectId === pid) && (!c.query.status || t.status === c.query.status) && (!aid || t.assigneeId === aid)
        && (!q || (t.title + ' ' + (t.description || '') + ' ' + t.displayId).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) { return b.createdAt - a.createdAt; }).map(taskDTO)];
  });
  route('GET', '/tasks/:id', function (c) { me(); return [200, taskDTO(taskByDisplay(c.params.id))]; });
  route('PATCH', '/tasks/:id', function (c) {
    var u = me(), t = taskByDisplay(c.params.id), b = c.body || {}, a = actorOf(c), now = Date.now(), touched = false;
    if ('title' in b && b.title !== t.title) { var nt = str(b, 'title'); hist(t, a, 'field_updated', 'title', t.title, nt, null, now); t.title = nt; touched = true; }
    if ('description' in b && b.description !== t.description) { hist(t, a, 'field_updated', 'description', t.description, b.description, null, now); t.description = b.description; touched = true; }
    if ('dueDate' in b && (b.dueDate || null) !== t.dueDate) {
      if (b.dueDate !== null && (typeof b.dueDate !== 'string' || !DUE_RE.test(b.dueDate))) throw bad('dueDate', 'must be a date in YYYY-MM-DD format or null');
      hist(t, a, 'field_updated', 'dueDate', t.dueDate, b.dueDate || null, null, now); t.dueDate = b.dueDate || null; touched = true;
    }
    if ('segmentId' in b && b.segmentId !== t.segmentId) {
      var s = db.segments.filter(function (x) { return x.id === b.segmentId && x.projectId === t.projectId; })[0];
      if (!s) throw E(404, 'Segment not found');
      hist(t, a, 'segment_changed', 'segmentId', t.segmentId, s.id, null, now); t.segmentId = s.id; touched = true;
    }
    if ('links' in b && JSON.stringify(b.links || []) !== JSON.stringify(t.links)) { hist(t, a, 'field_updated', 'links', JSON.stringify(t.links), JSON.stringify(b.links || []), null, now); t.links = b.links || []; touched = true; }
    if ('tags' in b) {
      var nw = Array.from(new Set((b.tags || []).filter(Boolean))).sort(), old = t.tags.slice().sort();
      if (nw.join(',') !== old.join(',')) { hist(t, a, 'field_updated', 'tags', old.join(','), nw.join(','), null, now); t.tags = nw; touched = true; }
    }
    if (touched) t.updatedAt = now;
    return [200, taskDTO(t)];
  });
  route('PATCH', '/tasks/:id/status', function (c) {
    me(); var t = taskByDisplay(c.params.id), st = enumOf(c.body, 'status', STATUSES);
    if (t.status !== st) {
      var now = Date.now();
      hist(t, actorOf(c), 'status_changed', 'status', t.status, st, null, now);
      t.status = st; t.statusChangedAt = now; t.updatedAt = now; if (st !== 'done') t.archivedAt = null;
    }
    return [200, taskDTO(t)];
  });
  route('PATCH', '/tasks/:id/priority', function (c) {
    me(); var t = taskByDisplay(c.params.id), pr = enumOf(c.body, 'priority', PRIORITIES);
    if (t.priority !== pr) { var now = Date.now(); hist(t, actorOf(c), 'priority_changed', 'priority', t.priority, pr, null, now); t.priority = pr; t.updatedAt = now; }
    return [200, taskDTO(t)];
  });
  route('PATCH', '/tasks/:id/assignee', function (c) {
    me(); var t = taskByDisplay(c.params.id), mail = email(c.body, 'assigneeEmail'), n = userByLogin(mail);
    if (!n) throw E(404, 'User not found');
    if (!isMember(t.projectId, n.id)) throw E(400, 'Assignee bukan anggota proyek');
    if (t.assigneeId !== n.id) {
      var now = Date.now(), o = userById(t.assigneeId);
      hist(t, actorOf(c), 'assignee_changed', 'assigneeEmail', o && o.email, n.email, null, now); t.assigneeId = n.id; t.updatedAt = now;
    }
    return [200, taskDTO(t)];
  });
  route('POST', '/tasks/:id/comments', function (c) {
    me(); var t = taskByDisplay(c.params.id), text = str(c.body, 'comment'), now = Date.now();
    var h = hist(t, actorOf(c), 'comment', null, null, null, text, now); t.updatedAt = now;
    return [201, histDTO(h)];
  });
  route('GET', '/tasks/:id/history', function (c) {
    me(); var t = taskByDisplay(c.params.id), lim = c.query.limit ? Math.max(1, parseInt(c.query.limit, 10) || 50) : 50;
    return [200, db.history.filter(function (h) { return h.taskId === t.id; }).sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, lim).map(histDTO)];
  });

  /* ---------- pencegat fetch ---------- */
  function lowerKeys(h) {
    var o = {}; if (!h) return o;
    if (typeof Headers !== 'undefined' && h instanceof Headers) { h.forEach(function (v, k) { o[k.toLowerCase()] = v; }); return o; }
    Object.keys(h).forEach(function (k) { o[k.toLowerCase()] = h[k]; }); return o;
  }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var m = url.match(/(?:^|\/)api(\/[^?#]*)(?:\?([^#]*))?/);
    if (!m) return realFetch ? realFetch(input, init) : Promise.reject(new TypeError('fetch tidak tersedia'));
    init = init || {};
    var method = (init.method || 'GET').toUpperCase(), path = m[1].replace(/\/+$/, '') || '/', q = {};
    new URLSearchParams(m[2] || '').forEach(function (v, k) { q[k] = v; });
    var body = null; try { body = init.body ? JSON.parse(init.body) : null; } catch (e) { body = null; }
    var ctx = { query: q, body: body, headers: lowerKeys(init.headers), params: {} };
    var out;
    try {
      var r = routes.filter(function (x) { return x.method === method && x.re.test(path); })[0];
      if (!r) throw E(404, 'Not found');
      var mm = path.match(r.re); r.keys.forEach(function (k, i) { ctx.params[k] = decodeURIComponent(mm[i + 1]); });
      out = r.fn(ctx);
      if (method !== 'GET') save();
    } catch (e) {
      out = [e.status || 500, e.status ? (e.details ? { error: e.message, details: e.details } : { error: e.message }) : { error: 'Internal server error' }];
      if (!e.status) console.error(e);
    }
    var status = out[0], res = status === 204 ? new Response(null, { status: 204 })
      : new Response(JSON.stringify(out[1]), { status: status, headers: { 'Content-Type': 'application/json' } });
    return new Promise(function (ok) { setTimeout(function () { ok(res); }, 40); });
  };

  window.DotoMock = { reset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } seed(); location.reload(); }, db: function () { return db; } };

  /* ---------- penanda kecil: ini bukan backend asli ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (location.protocol === 'file:') {
      var w = document.createElement('div');
      w.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:10000;padding:12px 16px;background:#b42318;color:#fff;font:600 13px/1.4 system-ui,sans-serif;text-align:center');
      w.textContent = 'Halaman dibuka lewat file:// sehingga browser memblokir JavaScript-nya. Jalankan lewat Live Server atau "python -m http.server 8000", lalu buka http://localhost:8000';
      document.body.appendChild(w);
    }
    var b = document.createElement('div');
    b.setAttribute('style', 'position:fixed;right:12px;bottom:12px;z-index:9999;display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;font:600 11px/1 system-ui,sans-serif;color:#fff;background:rgba(20,30,55,.78);backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.25)');
    b.innerHTML = '<span>Mode interface · data contoh di browser ini</span>';
    var r = document.createElement('button'); r.type = 'button'; r.textContent = 'Reset';
    r.setAttribute('style', 'font:inherit;color:#fff;background:rgba(255,255,255,.18);border:0;border-radius:999px;padding:4px 8px;cursor:pointer');
    r.onclick = function () { if (confirm('Hapus semua data contoh dan mulai dari awal?')) window.DotoMock.reset(); };
    b.appendChild(r); document.body.appendChild(b);
  });
})();
