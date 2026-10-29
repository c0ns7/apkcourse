import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import {
  db,
  initDb,
  uid,
  mapUser,
  loadAppData,
  notify,
  uploadsDir,
  logActivity,
  listActivityLogs,
  isRootLogin,
  normalizeRoles,
  pickPrimaryRole,
} from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || true

initDb()

const app = express()

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Некорректный JSON' })
  }
  return next(err)
})
app.use('/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-а-яА-ЯёЁ]+/g, '_')
    cb(null, `${Date.now()}-${safe}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } })

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, login: user.login }, JWT_SECRET, {
    expiresIn: '14d',
  })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id)
    if (!row) return res.status(401).json({ error: 'Пользователь не найден' })
    req.user = mapUser(row, payload.role)
    req.userRow = row
    next()
  } catch {
    return res.status(401).json({ error: 'Сессия истекла, войдите снова' })
  }
}

function userHasRole(userOrRow, role) {
  if (!userOrRow) return false
  if (Array.isArray(userOrRow.roles)) return userOrRow.roles.includes(role)
  let fromJson = null
  try {
    fromJson = userOrRow.roles_json ? JSON.parse(userOrRow.roles_json) : null
  } catch {
    fromJson = null
  }
  return normalizeRoles(fromJson || [userOrRow.role], userOrRow.role).includes(role)
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}

function requireRoot(req, res, next) {
  if (!req.user || !isRootLogin(req.user.login)) {
    return res.status(403).json({ error: 'Доступ только для root' })
  }
  next()
}

function publicUser(u) {
  if (!u) return null
  const { password: _p, ...rest } = u
  return rest
}

// ——— Auth ———
app.post('/api/auth/login', (req, res) => {
  const login = String(req.body.login || '').trim()
  const password = String(req.body.password || '')
  if (!login || !password) return res.status(400).json({ error: 'Укажите логин и пароль' })

  const row = db.prepare('SELECT * FROM users WHERE login = ? COLLATE NOCASE').get(login)
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }
  const user = mapUser(row)
  const token = signToken(user)
  if (user.roles.includes('teacher') || user.roles.includes('admin')) {
    logActivity(user, 'Вход в систему', `Роль: ${user.role}`)
  }
  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/register', (_req, res) => {
  res.status(403).json({
    error: 'Самостоятельная регистрация отключена. Обратитесь к администратору.',
  })
})

app.post('/api/auth/switch-role', auth, (req, res) => {
  const nextRole = String(req.body.role || '')
  if (!userHasRole(req.user, nextRole)) {
    return res.status(400).json({ error: 'У аккаунта нет этой роли' })
  }
  const user = { ...req.user, role: nextRole }
  const token = signToken(user)
  if (nextRole === 'teacher' || nextRole === 'admin') {
    logActivity(user, 'Смена роли', `Активная роль: ${nextRole}`)
  }
  res.json({ token, user: publicUser(user) })
})

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.get('/api/data', auth, (_req, res) => {
  res.json(loadAppData())
})

// ——— Profile ———
app.patch('/api/profile', auth, (req, res) => {
  const fields = req.body || {}
  const current = req.userRow

  if (fields.login) {
    const taken = db
      .prepare('SELECT id FROM users WHERE login = ? COLLATE NOCASE AND id != ?')
      .get(String(fields.login).trim(), current.id)
    if (taken) return res.status(409).json({ error: 'Этот логин уже занят' })
  }

  db.prepare(`
    UPDATE users SET
      full_name = COALESCE(?, full_name),
      login = COALESCE(?, login),
      bio = COALESCE(?, bio),
      group_name = COALESCE(?, group_name),
      specialty = COALESCE(?, specialty),
      course = COALESCE(?, course),
      academic_year = COALESCE(?, academic_year),
      discipline_ids_json = COALESCE(?, discipline_ids_json),
      enabled_assignment_types_json = COALESCE(?, enabled_assignment_types_json)
    WHERE id = ?
  `).run(
    fields.fullName ?? null,
    fields.login ? String(fields.login).trim().toLowerCase() : null,
    fields.bio !== undefined ? fields.bio : null,
    fields.group !== undefined ? fields.group : null,
    fields.specialty !== undefined ? fields.specialty : null,
    fields.course !== undefined ? fields.course : null,
    fields.academicYear !== undefined ? fields.academicYear : null,
    fields.disciplineIds ? JSON.stringify(fields.disciplineIds) : null,
    fields.enabledAssignmentTypes ? JSON.stringify(fields.enabledAssignmentTypes) : null,
    current.id
  )

  const user = mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(current.id))
  logActivity(user, 'Обновление профиля', user?.fullName || '')
  res.json({ user: publicUser(user), data: loadAppData() })
})

// ——— Users (admin) ———
app.post('/api/users', auth, requireRole('admin'), (req, res) => {
  const {
    login,
    password,
    fullName,
    role,
    roles: rolesBody,
    group,
    specialty,
    course,
    academicYear,
  } = req.body
  if (!login || !password || !fullName) {
    return res.status(400).json({ error: 'Заполните обязательные поля' })
  }
  const roles = normalizeRoles(
    Array.isArray(rolesBody) && rolesBody.length ? rolesBody : role ? [role] : []
  )
  if (!roles.length) {
    return res.status(400).json({ error: 'Укажите хотя бы одну роль' })
  }
  if (roles.includes('admin') && !isRootLogin(req.user.login)) {
    return res.status(403).json({ error: 'Администраторов может создавать только root' })
  }
  const primaryRole = pickPrimaryRole(roles)
  const loginNorm = String(login).trim().toLowerCase()
  if (isRootLogin(loginNorm)) {
    return res.status(400).json({ error: 'Логин root зарезервирован' })
  }
  if (db.prepare('SELECT id FROM users WHERE login = ? COLLATE NOCASE').get(loginNorm)) {
    return res.status(409).json({ error: 'Пользователь с таким логином уже существует' })
  }

  const id = uid()
  const isStudent = roles.includes('student')
  const isTeacher = roles.includes('teacher')
  db.prepare(`
    INSERT INTO users (
      id, login, password_hash, full_name, role, roles_json, group_name, specialty, course,
      academic_year, personal_data_consent, enabled_assignment_types_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    id,
    loginNorm,
    bcrypt.hashSync(password, 10),
    String(fullName).trim(),
    primaryRole,
    JSON.stringify(roles),
    isStudent ? group || null : null,
    isStudent ? specialty || null : null,
    isStudent ? Number(course) || null : null,
    academicYear || '2026-2027',
    isTeacher
      ? JSON.stringify([
          'essay', 'test', 'table', 'scheme', 'matching', 'qa', 'quiz', 'distribution', 'other',
        ])
      : null,
    new Date().toISOString().slice(0, 10)
  )

  logActivity(
    req.user,
    'Создание пользователя',
    `${roles.join('+')}: ${String(fullName).trim()} (${loginNorm})`
  )
  res.status(201).json({ data: loadAppData() })
})

app.patch('/api/users/:id', auth, requireRole('admin'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!target) return res.status(404).json({ error: 'Не найден' })
  if (isRootLogin(target.login)) {
    return res.status(400).json({ error: 'Учётную запись root менять нельзя' })
  }
  if (userHasRole(target, 'admin') && !isRootLogin(req.user.login)) {
    return res.status(403).json({ error: 'Администраторов может изменять только root' })
  }

  const {
    fullName,
    login,
    password,
    roles: rolesBody,
    group,
    specialty,
    course,
    academicYear,
  } = req.body || {}

  let existingRoles = null
  try {
    existingRoles = target.roles_json ? JSON.parse(target.roles_json) : null
  } catch {
    existingRoles = null
  }
  const roles = normalizeRoles(
    Array.isArray(rolesBody) && rolesBody.length ? rolesBody : existingRoles || [target.role]
  )
  if (!roles.length) return res.status(400).json({ error: 'Укажите хотя бы одну роль' })
  if (roles.includes('admin') && !isRootLogin(req.user.login)) {
    return res.status(403).json({ error: 'Роль администратора может назначать только root' })
  }

  const name = String(fullName ?? target.full_name).trim()
  if (!name) return res.status(400).json({ error: 'Укажите ФИО' })

  let loginNorm = target.login
  if (login != null && String(login).trim()) {
    loginNorm = String(login).trim().toLowerCase()
    if (isRootLogin(loginNorm)) {
      return res.status(400).json({ error: 'Логин root зарезервирован' })
    }
    const taken = db
      .prepare('SELECT id FROM users WHERE login = ? COLLATE NOCASE AND id != ?')
      .get(loginNorm, target.id)
    if (taken) return res.status(409).json({ error: 'Пользователь с таким логином уже существует' })
  }

  let passwordHash = target.password_hash
  let passwordChanged = false
  if (password != null && String(password).length > 0) {
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Пароль не короче 6 символов' })
    }
    passwordHash = bcrypt.hashSync(String(password), 10)
    passwordChanged = true
  }

  const primaryRole = pickPrimaryRole(roles)
  const isStudent = roles.includes('student')
  const isTeacher = roles.includes('teacher')
  const wasTeacher = userHasRole(target, 'teacher')
  let enabled = target.enabled_assignment_types_json
  if (isTeacher && !wasTeacher && !enabled) {
    enabled = JSON.stringify([
      'essay', 'test', 'table', 'scheme', 'matching', 'qa', 'quiz', 'distribution', 'other',
    ])
  }

  db.prepare(`
    UPDATE users SET
      login = ?,
      password_hash = ?,
      full_name = ?,
      role = ?,
      roles_json = ?,
      group_name = ?,
      specialty = ?,
      course = ?,
      academic_year = ?,
      enabled_assignment_types_json = ?
    WHERE id = ?
  `).run(
    loginNorm,
    passwordHash,
    name,
    primaryRole,
    JSON.stringify(roles),
    isStudent ? (group != null ? group || null : target.group_name) : null,
    isStudent ? (specialty != null ? specialty || null : target.specialty) : null,
    isStudent
      ? (course != null ? Number(course) || null : target.course)
      : null,
    academicYear != null ? academicYear || null : target.academic_year,
    enabled,
    target.id
  )

  logActivity(
    req.user,
    'Изменение пользователя',
    `${name} (${loginNorm}): ${roles.join('+')}${passwordChanged ? ', новый пароль' : ''}`
  )
  res.json({ data: loadAppData() })
})

app.delete('/api/users/:id', auth, requireRole('admin'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!target) return res.status(404).json({ error: 'Не найден' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' })
  if (isRootLogin(target.login)) {
    return res.status(400).json({ error: 'Нельзя удалить root' })
  }
  if (userHasRole(target, 'admin') && !isRootLogin(req.user.login)) {
    return res.status(403).json({ error: 'Администраторов может удалять только root' })
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id)
  logActivity(
    req.user,
    'Удаление пользователя',
    `${target.role}: ${target.full_name} (${target.login})`
  )
  res.json({ data: loadAppData() })
})

app.get('/api/activity-logs', auth, requireRoot, (req, res) => {
  const limit = Number(req.query.limit) || 300
  res.json({ logs: listActivityLogs(limit) })
})

// ——— Subjects ———
app.post('/api/subjects', auth, requireRole('teacher'), (req, res) => {
  const { title, description, color } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Укажите название' })
  const id = uid()
  db.prepare(`
    INSERT INTO subjects (id, title, description, teacher_id, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title.trim(), description || '', req.user.id, color || '#336699')

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const ids = JSON.parse(user.discipline_ids_json || '[]')
  ids.push(id)
  db.prepare('UPDATE users SET discipline_ids_json = ? WHERE id = ?').run(JSON.stringify(ids), req.user.id)

  logActivity(req.user, 'Создание предмета', title.trim())
  res.status(201).json({ data: loadAppData() })
})

app.put('/api/subjects/:id', auth, requireRole('teacher', 'admin'), (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)
  if (!subject) return res.status(404).json({ error: 'Не найден' })
  if (req.user.role === 'teacher' && subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  db.prepare(`
    UPDATE subjects SET title = ?, description = ?, color = ? WHERE id = ?
  `).run(
    req.body.title ?? subject.title,
    req.body.description ?? subject.description,
    req.body.color ?? subject.color,
    subject.id
  )
  logActivity(req.user, 'Изменение предмета', req.body.title ?? subject.title)
  res.json({ data: loadAppData() })
})

app.delete('/api/subjects/:id', auth, requireRole('teacher', 'admin'), (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)
  if (!subject) return res.status(404).json({ error: 'Не найден' })
  if (req.user.role === 'teacher' && subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  db.prepare('DELETE FROM subjects WHERE id = ?').run(subject.id)
  logActivity(req.user, 'Удаление предмета', subject.title)
  res.json({ data: loadAppData() })
})

app.post('/api/subjects/:id/students', auth, requireRole('teacher'), (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Предмет не найден' })
  }
  const studentId = req.body.studentId
  if (!studentId) return res.status(400).json({ error: 'Укажите студента' })
  db.prepare(`
    INSERT OR IGNORE INTO subject_students (subject_id, student_id) VALUES (?, ?)
  `).run(subject.id, studentId)
  const st = db.prepare('SELECT full_name FROM users WHERE id = ?').get(studentId)
  logActivity(req.user, 'Добавление студента к предмету', `${st?.full_name || studentId} → ${subject.title}`)
  res.json({ data: loadAppData() })
})

app.delete('/api/subjects/:id/students/:studentId', auth, requireRole('teacher'), (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Предмет не найден' })
  }
  db.prepare('DELETE FROM subject_students WHERE subject_id = ? AND student_id = ?').run(
    subject.id,
    req.params.studentId
  )
  logActivity(req.user, 'Удаление студента с предмета', `${req.params.studentId} ← ${subject.title}`)
  res.json({ data: loadAppData() })
})

app.post('/api/students/:id/assign-teacher', auth, requireRole('teacher'), (req, res) => {
  const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(req.params.id)
  if (!student) return res.status(404).json({ error: 'Студент не найден' })
  db.prepare('UPDATE users SET teacher_id = ? WHERE id = ?').run(req.user.id, student.id)
  logActivity(req.user, 'Закрепление студента', student.full_name)
  res.json({ data: loadAppData() })
})

// ——— Assignments ———
app.post('/api/subjects/:id/assignments', auth, requireRole('teacher'), (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Предмет не найден' })
  }
  const { title, description, deadline, type, attachments, payload, maxScore } = req.body
  if (!title?.trim() || !deadline) {
    return res.status(400).json({ error: 'Укажите название и срок' })
  }

  const assignmentId = uid()
  const createdAt = new Date().toISOString().slice(0, 10)
  db.prepare(`
    INSERT INTO assignments (
      id, subject_id, title, description, deadline, max_score, created_at, type, attachments_json, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    assignmentId,
    subject.id,
    title.trim(),
    description || '',
    deadline,
    maxScore || 5,
    createdAt,
    type || null,
    JSON.stringify(attachments || []),
    payload ? JSON.stringify(payload) : null
  )

  const students = db
    .prepare('SELECT student_id FROM subject_students WHERE subject_id = ?')
    .all(subject.id)

  const insertSub = db.prepare(`
    INSERT INTO submissions (id, assignment_id, student_id, content, status)
    VALUES (?, ?, ?, '', 'pending')
  `)
  for (const s of students) {
    insertSub.run(uid(), assignmentId, s.student_id)
    notify(s.student_id, 'Новое задание', title.trim(), `/student/assignment/${assignmentId}`)
  }

  logActivity(req.user, 'Создание задания', `${title.trim()} (${subject.title})`)
  res.status(201).json({ data: loadAppData() })
})

app.put('/api/assignments/:id', auth, requireRole('teacher'), (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id)
  if (!assignment) return res.status(404).json({ error: 'Не найдено' })
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(assignment.subject_id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  db.prepare(`
    UPDATE assignments SET
      title = ?, description = ?, deadline = ?, type = ?,
      attachments_json = ?, payload_json = ?
    WHERE id = ?
  `).run(
    req.body.title ?? assignment.title,
    req.body.description ?? assignment.description,
    req.body.deadline ?? assignment.deadline,
    req.body.type ?? assignment.type,
    JSON.stringify(req.body.attachments ?? JSON.parse(assignment.attachments_json || '[]')),
    req.body.payload !== undefined
      ? JSON.stringify(req.body.payload)
      : assignment.payload_json,
    assignment.id
  )
  logActivity(req.user, 'Изменение задания', req.body.title ?? assignment.title)
  res.json({ data: loadAppData() })
})

app.delete('/api/assignments/:id', auth, requireRole('teacher'), (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id)
  if (!assignment) return res.status(404).json({ error: 'Не найдено' })
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(assignment.subject_id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  db.prepare('DELETE FROM assignments WHERE id = ?').run(assignment.id)
  logActivity(req.user, 'Удаление задания', assignment.title)
  res.json({ data: loadAppData() })
})

// ——— Submissions ———
app.post('/api/assignments/:id/submit', auth, requireRole('student'), (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id)
  if (!assignment) return res.status(404).json({ error: 'Задание не найдено' })

  const { content, answers, attachments } = req.body
  const existing = db
    .prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?')
    .get(assignment.id, req.user.id)

  const submittedAt = new Date().toISOString()
  if (existing) {
    db.prepare(`
      UPDATE submissions SET
        content = ?, answers = ?, attachments_json = ?, status = 'submitted', submitted_at = ?
      WHERE id = ?
    `).run(
      content || '',
      answers || null,
      JSON.stringify(attachments || []),
      submittedAt,
      existing.id
    )
  } else {
    db.prepare(`
      INSERT INTO submissions (
        id, assignment_id, student_id, content, answers, attachments_json, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)
    `).run(
      uid(),
      assignment.id,
      req.user.id,
      content || '',
      answers || null,
      JSON.stringify(attachments || []),
      submittedAt
    )
  }

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(assignment.subject_id)
  if (subject) {
    notify(
      subject.teacher_id,
      'Новая работа на проверку',
      `${req.user.fullName} сдал(а) «${assignment.title}»`,
      '/teacher/grading'
    )
  }

  res.json({ data: loadAppData() })
})

app.post('/api/submissions/:id/grade', auth, requireRole('teacher'), (req, res) => {
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id)
  if (!sub) return res.status(404).json({ error: 'Не найдено' })
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(sub.assignment_id)
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(assignment.subject_id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }

  const { gradeMode, score, passed, feedback } = req.body
  const gradedAt = new Date().toISOString()
  let finalScore = null
  let finalPassed = null
  if (gradeMode === 'score') {
    finalScore = Math.min(5, Math.max(2, Math.round(Number(score))))
  } else {
    finalPassed = Boolean(passed)
  }

  db.prepare(`
    UPDATE submissions SET
      grade_mode = ?, score = ?, passed = ?, feedback = ?, status = 'graded', graded_at = ?
    WHERE id = ?
  `).run(
    gradeMode,
    finalScore,
    finalPassed == null ? null : finalPassed ? 1 : 0,
    feedback || '',
    gradedAt,
    sub.id
  )

  const label =
    gradeMode === 'pass_fail' ? (finalPassed ? 'Зачёт' : 'Незачёт') : String(finalScore)
  notify(sub.student_id, 'Оценка выставлена', `${assignment.title}: ${label}`, '/student/grades')
  logActivity(req.user, 'Оценка работы', `${assignment.title}: ${label}`)

  res.json({ data: loadAppData() })
})

app.post('/api/submissions/:id/return', auth, requireRole('teacher'), (req, res) => {
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id)
  if (!sub) return res.status(404).json({ error: 'Не найдено' })
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(sub.assignment_id)
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(assignment.subject_id)
  if (!subject || subject.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }

  const feedback = req.body.feedback || 'Требуется доработка'
  db.prepare(`
    UPDATE submissions SET
      status = 'returned', feedback = ?, score = NULL, passed = NULL, grade_mode = NULL, graded_at = NULL
    WHERE id = ?
  `).run(feedback, sub.id)

  notify(
    sub.student_id,
    'Работа возвращена на доработку',
    feedback,
    `/student/assignment/${sub.assignment_id}`
  )
  logActivity(req.user, 'Возврат работы', assignment.title)

  res.json({ data: loadAppData() })
})

// ——— Announcements ———
app.post('/api/announcements', auth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, body, audience, group, pinned } = req.body
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Заполните заголовок и текст' })
  }
  db.prepare(`
    INSERT INTO announcements (id, title, body, author_id, audience, group_name, pinned, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid(),
    title.trim(),
    body.trim(),
    req.user.id,
    audience === 'group' ? 'group' : 'all',
    audience === 'group' ? group || null : null,
    pinned ? 1 : 0,
    new Date().toISOString()
  )
  logActivity(req.user, 'Объявление', title.trim())
  res.status(201).json({ data: loadAppData() })
})

app.delete('/api/announcements/:id', auth, (req, res) => {
  const ann = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id)
  if (!ann) return res.status(404).json({ error: 'Не найдено' })
  if (req.user.role !== 'admin' && ann.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  db.prepare('DELETE FROM announcements WHERE id = ?').run(ann.id)
  logActivity(req.user, 'Удаление объявления', ann.title)
  res.json({ data: loadAppData() })
})

// ——— Notifications ———
app.post('/api/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_flag = 1 WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user.id
  )
  res.json({ data: loadAppData() })
})

app.post('/api/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_flag = 1 WHERE user_id = ?').run(req.user.id)
  res.json({ data: loadAppData() })
})

// ——— Chat ———
app.post('/api/chat/threads', auth, (req, res) => {
  const otherUserId = req.body.otherUserId
  const subjectId = req.body.subjectId || null
  if (!otherUserId) return res.status(400).json({ error: 'Укажите собеседника' })

  const studentId = req.user.role === 'student' ? req.user.id : otherUserId
  const teacherId = req.user.role === 'teacher' ? req.user.id : otherUserId

  let thread = db
    .prepare(`
      SELECT * FROM chat_threads
      WHERE student_id = ? AND teacher_id = ?
        AND (subject_id IS ? OR (? IS NULL AND subject_id IS NULL) OR subject_id = ?)
      LIMIT 1
    `)
    .get(studentId, teacherId, subjectId, subjectId, subjectId)

  if (!thread) {
    const id = uid()
    const updatedAt = new Date().toISOString()
    db.prepare(`
      INSERT INTO chat_threads (id, student_id, teacher_id, subject_id, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, studentId, teacherId, subjectId, updatedAt)
    thread = db.prepare('SELECT * FROM chat_threads WHERE id = ?').get(id)
  }

  res.json({ threadId: thread.id, data: loadAppData() })
})

app.post('/api/chat/threads/:id/messages', auth, (req, res) => {
  const thread = db.prepare('SELECT * FROM chat_threads WHERE id = ?').get(req.params.id)
  if (!thread) return res.status(404).json({ error: 'Диалог не найден' })
  if (thread.student_id !== req.user.id && thread.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  const body = String(req.body.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Пустое сообщение' })

  const id = uid()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO chat_messages (id, thread_id, sender_id, body, created_at, read_flag)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(id, thread.id, req.user.id, body, createdAt)
  db.prepare('UPDATE chat_threads SET updated_at = ? WHERE id = ?').run(createdAt, thread.id)

  const recipientId =
    req.user.id === thread.student_id ? thread.teacher_id : thread.student_id
  notify(
    recipientId,
    'Новое сообщение',
    body.slice(0, 80),
    req.user.role === 'student' ? '/student/chat' : '/teacher/chat'
  )

  res.status(201).json({ data: loadAppData() })
})

app.post('/api/chat/threads/:id/read', auth, (req, res) => {
  db.prepare(`
    UPDATE chat_messages SET read_flag = 1
    WHERE thread_id = ? AND sender_id != ? AND read_flag = 0
  `).run(req.params.id, req.user.id)
  res.json({ data: loadAppData() })
})

// ——— Uploads ———
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не получен' })
  const kind = req.body.kind || 'file'
  res.status(201).json({
    attachment: {
      id: uid(),
      kind,
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    },
  })
})

// ——— Health ———
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// Production: serve frontend build
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api)(?!\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  const rootLogin = process.env.ROOT_LOGIN || 'root'
  console.log(`APK API listening on http://localhost:${PORT}`)
  console.log(`Root login: ${rootLogin}`)
})
