/**
 * Импорт студентов и преподавателей из Excel.
 * Запуск из корня или server/:
 *   node server/scripts/importFromExcel.js
 */
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import XLSX from 'xlsx'
import {
  db,
  initDb,
  uid,
  normalizeEducationForm,
} from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FILES = {
  zaochkaStudents: 'c:/Users/root/Downloads/Список студентов для портала заочка.xlsx',
  ochnikiStudents: 'c:/Users/root/Downloads/Студенты для портала очники.xlsx',
  zaochkaTeachers: 'c:/Users/root/Downloads/Список преподавателей для портала заочка.xlsx',
}

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

function cleanSpaces(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function parseFio(full) {
  const parts = cleanSpaces(full).split(' ').filter(Boolean)
  return {
    last: parts[0] || '',
    first: parts[1] || '',
    middle: parts[2] || '',
    full: parts.join(' '),
  }
}

function mapEducationForm(raw) {
  const v = cleanSpaces(raw).toLowerCase()
  if (v.includes('заоч')) return 'distance'
  if (v.includes('переподг')) return 'retraining'
  if (v.includes('проф') && v.includes('обуч')) return 'professional'
  if (v.includes('очн')) return 'fulltime'
  return normalizeEducationForm(null)
}

function courseFromGroupCode(group) {
  const n = Number(String(group).replace(/\D/g, ''))
  if (!n) return null
  const first = Math.floor(n / 100)
  return first >= 1 && first <= 6 ? first : null
}

function randomPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = 'Apk'
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

function makeLoginBase(fio) {
  const { last, first, middle } = fio
  const base = translit(last) || 'user'
  const initials = `${translit(first).slice(0, 1)}${translit(middle).slice(0, 1)}`
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

function ensureGroup({ name, educationForm, academicYear, specialty, course }) {
  const cleanName = cleanSpaces(name)
  if (!cleanName) return null
  let row = db
    .prepare('SELECT * FROM study_groups WHERE name = ? COLLATE NOCASE')
    .get(cleanName)
  if (row) return row
  const id = uid()
  db.prepare(`
    INSERT INTO study_groups (id, name, education_form, academic_year, specialty, course, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanName,
    normalizeEducationForm(educationForm),
    academicYear || '2026-2027',
    specialty || null,
    course != null ? Number(course) || null : null,
    new Date().toISOString().slice(0, 10)
  )
  return db.prepare('SELECT * FROM study_groups WHERE id = ?').get(id)
}

function insertStudent({ fullName, groupName, specialty, academicYear, educationForm, course }) {
  const fio = parseFio(fullName)
  if (!fio.full || fio.full.length < 3) return null

  const existing = db
    .prepare('SELECT id, login FROM users WHERE full_name = ? COLLATE NOCASE')
    .get(fio.full)
  if (existing) {
    return { skipped: true, fullName: fio.full, login: existing.login, reason: 'already exists' }
  }

  const group = ensureGroup({
    name: groupName,
    educationForm,
    academicYear,
    specialty,
    course,
  })

  const login = uniqueLogin(makeLoginBase(fio))
  const password = randomPassword()
  const id = uid()
  const roles = ['student']

  db.prepare(`
    INSERT INTO users (
      id, login, password_hash, full_name, role, roles_json,
      group_name, group_id, specialty, course, academic_year, education_form,
      personal_data_consent, created_at
    ) VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    login,
    bcrypt.hashSync(password, 10),
    fio.full,
    JSON.stringify(roles),
    group?.name || cleanSpaces(groupName) || null,
    group?.id || null,
    specialty || null,
    course != null ? Number(course) || null : null,
    academicYear || '2026-2027',
    normalizeEducationForm(educationForm),
    new Date().toISOString().slice(0, 10)
  )

  if (group?.id) {
    db.prepare('INSERT OR IGNORE INTO group_students (group_id, student_id) VALUES (?, ?)').run(
      group.id,
      id
    )
  }

  return {
    role: 'Студент',
    fullName: fio.full,
    login,
    password,
    group: group?.name || '',
    specialty: specialty || '',
    educationForm: educationFormLabels(educationForm),
    academicYear: academicYear || '2026-2027',
    course: course ?? '',
  }
}

function insertTeacher({ fullName, disciplines, academicYear, educationForm }) {
  const fio = parseFio(fullName)
  if (!fio.full || fio.full.length < 3) return null

  const existing = db
    .prepare('SELECT id, login FROM users WHERE full_name = ? COLLATE NOCASE')
    .get(fio.full)
  if (existing) {
    return { skipped: true, fullName: fio.full, login: existing.login, reason: 'already exists' }
  }

  const login = uniqueLogin(makeLoginBase(fio))
  const password = randomPassword()
  const id = uid()
  const year = cleanSpaces(academicYear).replace(/\s*у\.?\s*г\.?\s*$/i, '') || '2026-2027'
  const discs = cleanSpaces(disciplines)
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean)

  db.prepare(`
    INSERT INTO users (
      id, login, password_hash, full_name, role, roles_json,
      academic_year, education_form, disciplines_json,
      enabled_assignment_types_json, personal_data_consent, created_at
    ) VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    login,
    bcrypt.hashSync(password, 10),
    fio.full,
    JSON.stringify(['teacher']),
    year,
    normalizeEducationForm(educationForm),
    JSON.stringify(discs),
    JSON.stringify([
      'essay', 'test', 'table', 'scheme', 'matching', 'qa', 'quiz', 'distribution', 'other',
    ]),
    new Date().toISOString().slice(0, 10)
  )

  return {
    role: 'Преподаватель',
    fullName: fio.full,
    login,
    password,
    group: '',
    specialty: discs.join('; '),
    educationForm: educationFormLabels(educationForm),
    academicYear: year,
    course: '',
  }
}

function educationFormLabels(form) {
  const map = {
    fulltime: 'Очная',
    distance: 'Заочная',
    retraining: 'Проф. переподготовка',
    professional: 'Проф. обучение',
  }
  return map[normalizeEducationForm(form)] || form
}

function sheetRows(filePath, sheetHint) {
  const wb = XLSX.readFile(filePath)
  const name = sheetHint && wb.Sheets[sheetHint] ? sheetHint : wb.SheetNames[0]
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' })
}

initDb()

const credentials = []
const skipped = []
let created = 0

console.log('Импорт студентов (заочка)…')
for (const row of sheetRows(FILES.zaochkaStudents, 'Лист1')) {
  const fullName = cleanSpaces(row['ФИО студента'])
  if (!fullName) continue
  const result = insertStudent({
    fullName,
    groupName: cleanSpaces(row['группа']),
    specialty: cleanSpaces(row['специальность']),
    academicYear: cleanSpaces(row['учебный год']) || '2026-2027',
    educationForm: mapEducationForm(row['форма обучения']),
    course: row['курс'] != null && row['курс'] !== '' ? Number(row['курс']) : null,
  })
  if (!result) continue
  if (result.skipped) skipped.push(result)
  else {
    credentials.push(result)
    created += 1
  }
}

console.log('Импорт студентов (очники)…')
for (const row of sheetRows(FILES.ochnikiStudents)) {
  const last = cleanSpaces(row['Фамилия'])
  const first = cleanSpaces(row['Имя'])
  const middle = cleanSpaces(row['Отчетство'] || row['Отчество'])
  const fullName = [last, first, middle].filter(Boolean).join(' ')
  if (!fullName) continue
  const groupName = cleanSpaces(String(row['Группа']))
  const result = insertStudent({
    fullName,
    groupName,
    specialty: cleanSpaces(row['Специальность']),
    academicYear: cleanSpaces(row['Учебный год']) || '2026-2027',
    educationForm: mapEducationForm(row['Форма обучения']),
    course: courseFromGroupCode(groupName),
  })
  if (!result) continue
  if (result.skipped) skipped.push(result)
  else {
    credentials.push(result)
    created += 1
  }
}

console.log('Импорт преподавателей (заочка)…')
for (const row of sheetRows(FILES.zaochkaTeachers, 'Лист1')) {
  const fullName = cleanSpaces(row['ФИО преподавателя'])
  if (!fullName) continue
  const result = insertTeacher({
    fullName,
    disciplines: row['преподаваемые дисциплины'],
    academicYear: row['учебный год'],
    educationForm: mapEducationForm(row['форма обучения']),
  })
  if (!result) continue
  if (result.skipped) skipped.push(result)
  else {
    credentials.push(result)
    created += 1
  }
}

const outDir = path.join(__dirname, '..', 'data')
const outPath = path.join(outDir, 'imported-credentials.xlsx')
const publicOut = 'c:/Users/root/Downloads/Учётные_данные_портал_АПК.xlsx'

const sheet = credentials.map((c) => ({
  Роль: c.role,
  ФИО: c.fullName,
  Логин: c.login,
  Пароль: c.password,
  Группа: c.group,
  Специальность: c.specialty,
  'Форма обучения': c.educationForm,
  'Учебный год': c.academicYear,
  Курс: c.course,
}))

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), 'Учётные данные')
if (skipped.length) {
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      skipped.map((s) => ({
        ФИО: s.fullName,
        Логин: s.login,
        Причина: s.reason,
      }))
    ),
    'Пропущены'
  )
}
XLSX.writeFile(wb, outPath)
XLSX.writeFile(wb, publicOut)

console.log(`\nГотово. Создано: ${created}, пропущено (уже есть): ${skipped.length}`)
console.log(`Файл с логинами/паролями:\n  ${publicOut}\n  ${outPath}`)
