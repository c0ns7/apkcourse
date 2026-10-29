import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const uploadsDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const db = new Database(path.join(dataDir, 'apk.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function uid() {
  return randomUUID()
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')),
      group_name TEXT,
      teacher_id TEXT,
      specialty TEXT,
      course INTEGER,
      academic_year TEXT,
      disciplines_json TEXT DEFAULT '[]',
      discipline_ids_json TEXT DEFAULT '[]',
      enabled_assignment_types_json TEXT,
      personal_data_consent INTEGER DEFAULT 0,
      bio TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      teacher_id TEXT NOT NULL,
      color TEXT DEFAULT '#336699',
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subject_students (
      subject_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (subject_id, student_id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL,
      max_score INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      type TEXT,
      attachments_json TEXT DEFAULT '[]',
      payload_json TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      answers TEXT,
      attachments_json TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      grade_mode TEXT,
      score INTEGER,
      passed INTEGER,
      feedback TEXT,
      submitted_at TEXT,
      graded_at TEXT,
      UNIQUE(assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author_id TEXT NOT NULL,
      audience TEXT NOT NULL DEFAULT 'all',
      group_name TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read_flag INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      link TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      day INTEGER NOT NULL,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      room TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject_id TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_flag INTEGER DEFAULT 0,
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_login TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
  `)

  migrateUserRoles()
  ensureRoot()
  ensureCatalog()
}

const VALID_ROLES = ['student', 'teacher', 'admin']

/** Нормализует список ролей; минимум одна валидная */
export function normalizeRoles(roles, fallbackRole = 'student') {
  const list = Array.isArray(roles) ? roles : []
  const unique = [...new Set(list.map(String).filter((r) => VALID_ROLES.includes(r)))]
  if (unique.length) return unique
  if (VALID_ROLES.includes(fallbackRole)) return [fallbackRole]
  return ['student']
}

/** Роль по умолчанию при входе: admin → teacher → student */
export function pickPrimaryRole(roles) {
  const order = ['admin', 'teacher', 'student']
  for (const r of order) {
    if (roles.includes(r)) return r
  }
  return roles[0] || 'student'
}

function migrateUserRoles() {
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
  if (!cols.includes('roles_json')) {
    db.exec('ALTER TABLE users ADD COLUMN roles_json TEXT')
  }
  const rows = db.prepare('SELECT id, role, roles_json FROM users').all()
  for (const row of rows) {
    if (row.roles_json) continue
    db.prepare('UPDATE users SET roles_json = ? WHERE id = ?').run(
      JSON.stringify(normalizeRoles([row.role], row.role)),
      row.id
    )
  }
}

export function isRootLogin(login) {
  const root = (process.env.ROOT_LOGIN || 'root').toLowerCase()
  return String(login || '').toLowerCase() === root
}

/** Журнал действий преподавателей и админов (для root) */
export function logActivity(actor, action, details = '') {
  if (!actor || actor.role === 'student') return
  db.prepare(`
    INSERT INTO activity_logs (id, actor_id, actor_login, actor_name, actor_role, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid(),
    actor.id || null,
    actor.login || '?',
    actor.fullName || actor.full_name || '?',
    actor.role,
    action,
    String(details || '').slice(0, 500),
    new Date().toISOString()
  )
}

export function listActivityLogs(limit = 300) {
  const rows = db
    .prepare(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?`
    )
    .all(Math.min(Number(limit) || 300, 1000))
  return rows.map((r) => ({
    id: r.id,
    actorId: r.actor_id || undefined,
    actorLogin: r.actor_login,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    details: r.details || '',
    createdAt: r.created_at,
  }))
}

function ensureRoot() {
  const login = (process.env.ROOT_LOGIN || 'root').toLowerCase()
  const password = process.env.ROOT_PASSWORD || 'ChangeMe_Root_2026!'
  const existing = db.prepare('SELECT id FROM users WHERE login = ? COLLATE NOCASE').get(login)
  if (existing) return

  const hash = bcrypt.hashSync(password, 10)
  db.prepare(`
    INSERT INTO users (id, login, password_hash, full_name, role, roles_json, academic_year, personal_data_consent, created_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?, 1, ?)
  `).run(
    uid(),
    login,
    hash,
    'Root Administrator',
    JSON.stringify(['admin']),
    '2026-2027',
    new Date().toISOString().slice(0, 10)
  )
  console.log(`[seed] root account created: login="${login}"`)
}

function ensureCatalog() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'discipline_catalog'").get()
  if (row) return
  const catalog = [
    'Педагогика и методика обучения',
    'Психология развития',
    'Дошкольная педагогика',
    'Методика математики',
    'Русский язык и культура речи',
    'Информатика',
  ]
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
    'discipline_catalog',
    JSON.stringify(catalog)
  )
}

export function parseJson(value, fallback) {
  if (value == null || value === '') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function mapUser(row, activeRole) {
  if (!row) return null
  const roles = normalizeRoles(parseJson(row.roles_json, null) || [row.role], row.role)
  const role =
    activeRole && roles.includes(activeRole) ? activeRole : pickPrimaryRole(roles)
  return {
    id: row.id,
    login: row.login,
    fullName: row.full_name,
    role,
    roles,
    group: row.group_name || undefined,
    teacherId: row.teacher_id || undefined,
    specialty: row.specialty || undefined,
    course: row.course ?? undefined,
    academicYear: row.academic_year || undefined,
    disciplines: parseJson(row.disciplines_json, []),
    disciplineIds: parseJson(row.discipline_ids_json, []),
    enabledAssignmentTypes: parseJson(row.enabled_assignment_types_json, undefined),
    personalDataConsent: Boolean(row.personal_data_consent),
    bio: row.bio || undefined,
    createdAt: row.created_at,
    isRoot: isRootLogin(row.login),
  }
}

export function loadAppData() {
  const users = db.prepare('SELECT * FROM users ORDER BY full_name').all().map(mapUser)

  const subjectsRaw = db.prepare('SELECT * FROM subjects ORDER BY title').all()
  const subjectStudents = db.prepare('SELECT subject_id, student_id FROM subject_students').all()
  const bySubject = new Map()
  for (const row of subjectStudents) {
    if (!bySubject.has(row.subject_id)) bySubject.set(row.subject_id, [])
    bySubject.get(row.subject_id).push(row.student_id)
  }
  const subjects = subjectsRaw.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    teacherId: s.teacher_id,
    color: s.color || '#336699',
    studentIds: bySubject.get(s.id) || [],
  }))

  const assignments = db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all().map((a) => ({
    id: a.id,
    subjectId: a.subject_id,
    title: a.title,
    description: a.description,
    deadline: a.deadline,
    maxScore: a.max_score,
    createdAt: a.created_at,
    type: a.type || undefined,
    attachments: parseJson(a.attachments_json, []),
    payload: parseJson(a.payload_json, undefined),
  }))

  const submissions = db.prepare('SELECT * FROM submissions').all().map((s) => ({
    id: s.id,
    assignmentId: s.assignment_id,
    studentId: s.student_id,
    content: s.content || '',
    answers: s.answers || undefined,
    attachments: parseJson(s.attachments_json, []),
    status: s.status,
    gradeMode: s.grade_mode || undefined,
    score: s.score ?? undefined,
    passed: s.passed == null ? undefined : Boolean(s.passed),
    feedback: s.feedback || undefined,
    submittedAt: s.submitted_at || undefined,
    gradedAt: s.graded_at || undefined,
  }))

  const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all().map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    authorId: a.author_id,
    audience: a.audience,
    group: a.group_name || undefined,
    pinned: Boolean(a.pinned),
    createdAt: a.created_at,
  }))

  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all().map((n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    read: Boolean(n.read_flag),
    createdAt: n.created_at,
    link: n.link || undefined,
  }))

  const schedule = db.prepare('SELECT * FROM schedule').all().map((s) => ({
    id: s.id,
    subjectId: s.subject_id,
    group: s.group_name,
    day: s.day,
    timeStart: s.time_start,
    timeEnd: s.time_end,
    room: s.room,
  }))

  const chatThreads = db.prepare('SELECT * FROM chat_threads ORDER BY updated_at DESC').all().map((t) => ({
    id: t.id,
    studentId: t.student_id,
    teacherId: t.teacher_id,
    subjectId: t.subject_id || undefined,
    updatedAt: t.updated_at,
  }))

  const chatMessages = db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC').all().map((m) => ({
    id: m.id,
    threadId: m.thread_id,
    senderId: m.sender_id,
    body: m.body,
    createdAt: m.created_at,
    read: Boolean(m.read_flag),
  }))

  const catalogRow = db.prepare("SELECT value FROM settings WHERE key = 'discipline_catalog'").get()
  const disciplineCatalog = parseJson(catalogRow?.value, [])

  return {
    users,
    subjects,
    assignments,
    submissions,
    announcements,
    notifications,
    schedule,
    chatThreads,
    chatMessages,
    disciplineCatalog,
  }
}

export function notify(userId, title, message, link) {
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, read_flag, created_at, link)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(uid(), userId, title, message, new Date().toISOString(), link || null)
}

export { db, uploadsDir }
