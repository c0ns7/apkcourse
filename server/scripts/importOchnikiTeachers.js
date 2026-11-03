/**
 * Импорт преподавателей очной формы + привязка Полякова К.В. к root.
 * node server/scripts/importOchnikiTeachers.js
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import XLSX from 'xlsx'
import { initDb, db, uid, normalizeEducationForm } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = 'c:/Users/root/Downloads/Список преподавателей для портала очка.xlsx'
const POLYAKOV = 'поляков константин валерьевич'

const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function translit(str) {
  return String(str || '')
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] ?? (/[a-z0-9]/.test(ch) ? ch : ''))
    .join('')
}

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function parseFio(full) {
  const parts = clean(full).split(' ').filter(Boolean)
  return { last: parts[0] || '', first: parts[1] || '', middle: parts[2] || '', full: parts.join(' ') }
}

function randomPassword() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = 'Apk'
  for (let i = 0; i < 5; i++) out += a[Math.floor(Math.random() * a.length)]
  return out
}

function makeLoginBase(fio) {
  const base = translit(fio.last) || 'user'
  const initials = `${translit(fio.first).slice(0, 1)}${translit(fio.middle).slice(0, 1)}`
  return `${base}${initials ? '.' + initials : ''}`.slice(0, 32)
}

function uniqueLogin(base) {
  let login = base
  let i = 1
  while (db.prepare('SELECT id FROM users WHERE login = ? COLLATE NOCASE').get(login)) {
    i += 1
    login = `${base}${i}`.slice(0, 40)
  }
  return login
}

function parseDiscs(raw) {
  return clean(raw)
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function mergeDiscs(existingJson, incoming) {
  let prev = []
  try {
    prev = JSON.parse(existingJson || '[]')
  } catch {
    prev = []
  }
  return [...new Set([...prev, ...incoming].map(clean).filter(Boolean))]
}

initDb()

const wb = XLSX.readFile(FILE)
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
const created = []
const updated = []

for (const row of rows) {
  const fio = parseFio(row['ФИО преподавателя'])
  if (!fio.full) continue
  const discs = parseDiscs(row['преподаваемые дисциплины'])
  const year = clean(row['учебный год']).replace(/\s*у\.?\s*г\.?\s*$/i, '') || '2026-2027'
  const edu = normalizeEducationForm('fulltime')
  const defaultTypes = JSON.stringify([
    'essay', 'test', 'table', 'scheme', 'matching', 'qa', 'quiz', 'distribution', 'other',
  ])

  if (fio.full.toLowerCase() === POLYAKOV) {
    const rootLogin = process.env.ROOT_LOGIN || 'root'
    const root = db.prepare('SELECT * FROM users WHERE login = ? COLLATE NOCASE').get(rootLogin)
    if (!root) throw new Error('root not found')
    let roles = []
    try {
      roles = JSON.parse(root.roles_json || '["admin"]')
    } catch {
      roles = ['admin']
    }
    roles = [...new Set([...roles, 'admin', 'teacher'])]
    const merged = mergeDiscs(root.disciplines_json, discs)
    db.prepare(`
      UPDATE users SET
        full_name = ?,
        role = 'admin',
        roles_json = ?,
        disciplines_json = ?,
        academic_year = COALESCE(?, academic_year),
        education_form = ?,
        enabled_assignment_types_json = COALESCE(enabled_assignment_types_json, ?)
      WHERE id = ?
    `).run(fio.full, JSON.stringify(roles), JSON.stringify(merged), year, edu, defaultTypes, root.id)

    updated.push({
      role: 'Root + преподаватель',
      fullName: fio.full,
      login: root.login,
      password: '(пароль root из .env / текущий)',
      note: 'Привязан к root, роль teacher',
      specialty: merged.join('; '),
      educationForm: 'Очная',
      academicYear: year,
    })
    console.log(`[ok] root ← ${fio.full}, roles=${roles.join('+')}`)
    continue
  }

  const existing = db.prepare('SELECT * FROM users WHERE full_name = ? COLLATE NOCASE').get(fio.full)
  if (existing) {
    let roles = []
    try {
      roles = JSON.parse(existing.roles_json || '[]')
    } catch {
      roles = [existing.role]
    }
    if (!roles.includes('teacher')) roles.push('teacher')
    const merged = mergeDiscs(existing.disciplines_json, discs)
    db.prepare(`
      UPDATE users SET
        roles_json = ?,
        role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'teacher' END,
        disciplines_json = ?,
        academic_year = COALESCE(?, academic_year),
        enabled_assignment_types_json = COALESCE(enabled_assignment_types_json, ?)
      WHERE id = ?
    `).run(JSON.stringify(roles), JSON.stringify(merged), year, defaultTypes, existing.id)

    updated.push({
      role: 'Преподаватель',
      fullName: fio.full,
      login: existing.login,
      password: '(без изменений)',
      note: 'Уже был в базе — обновлены дисциплины',
      specialty: merged.join('; '),
      educationForm: 'Очная (+существующий)',
      academicYear: year,
    })
    continue
  }

  const login = uniqueLogin(makeLoginBase(fio))
  const password = randomPassword()
  db.prepare(`
    INSERT INTO users (
      id, login, password_hash, full_name, role, roles_json,
      academic_year, education_form, disciplines_json,
      enabled_assignment_types_json, personal_data_consent, created_at
    ) VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, ?, 1, ?)
  `).run(
    uid(),
    login,
    bcrypt.hashSync(password, 10),
    fio.full,
    JSON.stringify(['teacher']),
    year,
    edu,
    JSON.stringify(discs),
    defaultTypes,
    new Date().toISOString().slice(0, 10)
  )

  created.push({
    role: 'Преподаватель',
    fullName: fio.full,
    login,
    password,
    note: 'Новый (очная)',
    specialty: discs.join('; '),
    educationForm: 'Очная',
    academicYear: year,
  })
}

// refresh deploy seed (без root — пароль root из .env)
const rootLogin = (process.env.ROOT_LOGIN || 'root').toLowerCase()
const users = db.prepare('SELECT * FROM users WHERE lower(login) != ?').all(rootLogin)
const groups = db.prepare('SELECT * FROM study_groups').all()
const members = db.prepare('SELECT * FROM group_students').all()
const seedDir = path.join(__dirname, '..', 'seed')
fs.mkdirSync(seedDir, { recursive: true })
fs.writeFileSync(
  path.join(seedDir, 'portal-users.json'),
  JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    groups,
    users,
    members,
  })
)

const rootRow = db.prepare('SELECT * FROM users WHERE login = ? COLLATE NOCASE').get(rootLogin)
if (rootRow) {
  fs.writeFileSync(
    path.join(seedDir, 'root-overlay.json'),
    JSON.stringify(
      {
        version: 1,
        fullName: rootRow.full_name,
        roles: JSON.parse(rootRow.roles_json || '["admin"]'),
        disciplines: JSON.parse(rootRow.disciplines_json || '[]'),
        academicYear: rootRow.academic_year || '2026-2027',
        educationForm: rootRow.education_form || 'fulltime',
        enabledAssignmentTypes: JSON.parse(
          rootRow.enabled_assignment_types_json ||
            '["essay","test","table","scheme","matching","qa","quiz","distribution","other"]'
        ),
      },
      null,
      2
    )
  )
}

// отдельный флаг, чтобы на сервере подтянуть обновление root+новых преподов
db.prepare(
  `INSERT INTO settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
).run('seed_ochniki_teachers_v1', new Date().toISOString())

const sheet = [...created, ...updated].map((c) => ({
  Роль: c.role,
  ФИО: c.fullName,
  Логин: c.login,
  Пароль: c.password,
  Примечание: c.note || '',
  Дисциплины: c.specialty,
  'Форма обучения': c.educationForm,
  'Учебный год': c.academicYear,
}))
const outWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(sheet), 'Очники преподаватели')
const outPath = 'c:/Users/root/Downloads/Учётные_данные_преподаватели_очка.xlsx'
XLSX.writeFile(outWb, outPath)

const rootNow = db
  .prepare('SELECT login, full_name, role, roles_json, disciplines_json FROM users WHERE login = ? COLLATE NOCASE')
  .get(rootLogin)

console.log(
  JSON.stringify(
    {
      created: created.length,
      updated: updated.length,
      outPath,
      seedUsers: users.length,
      root: {
        login: rootNow.login,
        fullName: rootNow.full_name,
        roles: rootNow.roles_json,
        disciplinesCount: JSON.parse(rootNow.disciplines_json || '[]').length,
      },
    },
    null,
    2
  )
)
