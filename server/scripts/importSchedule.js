/**
 * Импорт расписания из Excel → schedule_lessons + seed/schedule-lessons.json
 * node server/scripts/importSchedule.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import { initDb, db, uid } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = 'c:/Users/root/Downloads/Расписание_АПК_1семестр_2026-2027.xlsx'
const ACADEMIC_YEAR = '2026-2027'

const DAY_MAP = {
  понедельник: 0,
  вторник: 1,
  среда: 2,
  четверг: 3,
  пятница: 4,
  суббота: 5,
  воскресенье: 6,
}

function clean(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTimeRange(raw) {
  const t = clean(raw).replace(/[–—]/g, '-').replace(/\./g, ':')
  const m = t.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
  if (!m) return null
  const norm = (x) => {
    const [h, min] = x.split(':')
    return `${h.padStart(2, '0')}:${min}`
  }
  return { start: norm(m[1]), end: norm(m[2]) }
}

function extractRoom(text) {
  const t = clean(text)
  const sport = t.match(/Спортзал[^,]*/i)
  if (sport) return clean(sport[0])
  const aud = t.match(/Ауд\.?\s*([A-Za-zА-Яа-я0-9.\-А]+)/i)
  if (aud) return `Ауд. ${aud[1]}`
  return ''
}

function extractTeacher(text) {
  const t = clean(text)
  // Фамилия И.О. или Фамилия И. О.
  const m = t.match(
    /([А-ЯЁA-Z][а-яёa-z\-]+)\s+([А-ЯЁA-Z])\.\s*([А-ЯЁA-Z])\.?/
  )
  if (m) return `${m[1]} ${m[2]}.${m[3]}.`
  return ''
}

function stripMeta(text) {
  return clean(text)
    .replace(/\d\s*неделя/gi, ' ')
    .replace(/\d\s*подгруппа/gi, ' ')
    .replace(/Ауд\.?\s*[A-Za-zА-Яа-я0-9.\-А]+/gi, ' ')
    .replace(/Спортзал[^,]*/gi, ' ')
    .replace(/([А-ЯЁA-Z][а-яёa-z\-]+)\s+([А-ЯЁA-Z])\.\s*([А-ЯЁA-Z])\.?/g, ' ')
    .replace(/[\\/|]+$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasWeek(text, n) {
  return new RegExp(`${n}\\s*недел`, 'i').test(text)
}
function hasSub(text, n) {
  return new RegExp(`${n}\\s*подгрупп`, 'i').test(text)
}

function buildFromChunk(chunk, weekForce, subForce) {
  const text = clean(chunk)
  if (!text || text === '-' || text === '—') return []

  let week = weekForce
  if (week == null) {
    if (hasWeek(text, 1) && !hasWeek(text, 2)) week = 1
    else if (hasWeek(text, 2) && !hasWeek(text, 1)) week = 2
  }

  let subgroup = subForce
  if (subgroup == null) {
    if (hasSub(text, 1) && !hasSub(text, 2)) subgroup = '1'
    else if (hasSub(text, 2) && !hasSub(text, 1)) subgroup = '2'
  }

  const room = extractRoom(text)
  const teacherName = extractTeacher(text)
  let title = stripMeta(text)
  if (!title || /^(подгруппа|неделя)$/i.test(title)) {
    // fallback: убрать только маркеры недели/подгруппы, оставить предмет
    title = clean(text)
      .replace(/\d\s*неделя/gi, ' ')
      .replace(/\d\s*подгруппа/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (!title) return []
  return [
    {
      title,
      teacherName,
      room,
      week: week ?? null,
      subgroup: subgroup || null,
    },
  ]
}

/** Одна ячейка: может содержать обе недели или обе подгруппы */
function parseLessonCell(raw, weekForce, subForce) {
  const text = clean(raw)
  if (!text || text === '-' || text === '—') return []

  if (hasWeek(text, 1) && hasWeek(text, 2)) {
    const parts = text.split(/2\s*недел[яи]/i)
    const part1 = parts[0].replace(/1\s*недел[яи]/i, '').trim()
    const part2 = (parts[1] || '').trim()
    return [...buildFromChunk(part1, 1, subForce), ...buildFromChunk(part2, 2, subForce)]
  }

  // «1 подгруппа … 2 подгруппа …» в одной ячейке
  if (hasSub(text, 1) && hasSub(text, 2) && /2\s*подгрупп/i.test(text)) {
    const parts = text.split(/2\s*подгрупп[аы]?/i)
    const part1 = parts[0].replace(/1\s*подгрупп[аы]?/i, '').trim()
    const part2 = (parts[1] || '').trim()
    // общий хвост предмета может быть только в одной части — если part2 короткий, добавить subject из part1
    const out = [
      ...buildFromChunk(part1, weekForce, '1'),
      ...buildFromChunk(part2, weekForce, '2'),
    ]
    if (out.length === 2 && out[1].title.length < 8 && out[0].title.length > 8) {
      out[1].title = out[0].title
      if (!out[1].teacherName) out[1].teacherName = out[0].teacherName
      if (!out[1].room) out[1].room = out[0].room
    }
    return out
  }

  return buildFromChunk(text, weekForce, subForce)
}

/**
 * Пара соседних ячеек группы:
 * — 1 неделя | 2 неделя
 * — 1 подгруппа | 2 подгруппа (или наоборот)
 * — одно занятие на всю группу
 */
function parseGroupPair(mainRaw, altRaw, altBlocked) {
  const main = clean(mainRaw)
  const alt =
    !altBlocked && altRaw && !parseTimeRange(altRaw) ? clean(altRaw) : ''

  if (!main && !alt) return []

  // Соседние ячейки: неделя 1 и неделя 2
  if (main && alt) {
    const m1 = hasWeek(main, 1) && !hasWeek(main, 2)
    const m2 = hasWeek(main, 2) && !hasWeek(main, 1)
    const a1 = hasWeek(alt, 1) && !hasWeek(alt, 2)
    const a2 = hasWeek(alt, 2) && !hasWeek(alt, 1)
    if ((m1 && a2) || (m2 && a1)) {
      const w1text = m1 ? main : alt
      const w2text = m2 ? main : alt
      return [...parseLessonCell(w1text, 1), ...parseLessonCell(w2text, 2)]
    }
    // «1 неделя» слева, справа занятие без маркера → 2 неделя (и наоборот)
    if (m1 && !hasWeek(alt, 1) && !hasWeek(alt, 2)) {
      return [...parseLessonCell(main, 1), ...parseLessonCell(alt, 2)]
    }
    if (m2 && !hasWeek(alt, 1) && !hasWeek(alt, 2)) {
      return [...parseLessonCell(main, 2), ...parseLessonCell(alt, 1)]
    }
    if (a1 && !hasWeek(main, 1) && !hasWeek(main, 2)) {
      return [...parseLessonCell(main, 2), ...parseLessonCell(alt, 1)]
    }
    if (a2 && !hasWeek(main, 1) && !hasWeek(main, 2)) {
      return [...parseLessonCell(main, 1), ...parseLessonCell(alt, 2)]
    }

    // Соседние: подгруппы
    const ms1 = hasSub(main, 1) && !hasSub(main, 2)
    const ms2 = hasSub(main, 2) && !hasSub(main, 1)
    const as1 = hasSub(alt, 1) && !hasSub(alt, 2)
    const as2 = hasSub(alt, 2) && !hasSub(alt, 1)
    if ((ms1 && as2) || (ms2 && as1)) {
      const s1text = ms1 ? main : alt
      const s2text = ms2 ? main : alt
      return [...parseLessonCell(s1text, null, '1'), ...parseLessonCell(s2text, null, '2')]
    }
    if (ms1 && !hasSub(alt, 1) && !hasSub(alt, 2)) {
      return [...parseLessonCell(main, null, '1'), ...parseLessonCell(alt, null, '2')]
    }
    if (ms2 && !hasSub(alt, 1) && !hasSub(alt, 2)) {
      return [...parseLessonCell(main, null, '2'), ...parseLessonCell(alt, null, '1')]
    }
    if (as1 && !hasSub(main, 1) && !hasSub(main, 2)) {
      return [...parseLessonCell(main, null, '2'), ...parseLessonCell(alt, null, '1')]
    }
    if (as2 && !hasSub(main, 1) && !hasSub(main, 2)) {
      return [...parseLessonCell(main, null, '1'), ...parseLessonCell(alt, null, '2')]
    }
  }

  if (main && !alt) return parseLessonCell(main)
  if (!main && alt) return parseLessonCell(alt)

  // Обе без маркеров — только main (alt часто пустой хвост merge)
  if (main && alt) return parseLessonCell(main)
  return []
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const line = rows[i].map((c) => clean(c)).join('|')
    if (/группа/i.test(line) && /время/i.test(line)) return i
  }
  return -1
}

function extractGroupColumns(headerRow) {
  const cols = []
  for (let i = 0; i < headerRow.length; i++) {
    const cell = clean(headerRow[i])
    const m = cell.match(/(\d+)\s*группа/i)
    if (m) {
      // время обычно слева от колонки группы
      let timeCol = i - 1
      if (timeCol < 1 || !/время/i.test(clean(headerRow[timeCol]))) {
        timeCol = i - 1
      }
      cols.push({
        group: m[1],
        timeCol,
        contentCol: i,
        // соседняя ячейка часто — вторая подгруппа / 2 неделя
        altCol: i + 1,
      })
    }
  }
  return cols
}

function parseSheet(name, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const hi = findHeaderRow(rows)
  if (hi < 0) {
    console.warn(`[skip] ${name}: нет строки заголовка`)
    return []
  }

  // Специальность из строк выше заголовка
  let specialty = name
  for (let i = 0; i < hi; i++) {
    const t = clean(rows[i][0])
    if (/специальност/i.test(t) || /44\.|49\.|40\.|09\.|53\./.test(t)) {
      specialty = t.replace(/^Расписание занятий специальности\s*/i, '').trim() || name
      break
    }
  }

  const groups = extractGroupColumns(rows[hi])
  if (!groups.length) {
    console.warn(`[skip] ${name}: группы не найдены`)
    return []
  }

  const lessons = []
  let currentDay = null
  let sort = 0

  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r]
    const dayCell = clean(row[0]).toLowerCase()
    if (dayCell && DAY_MAP[dayCell] != null) {
      currentDay = DAY_MAP[dayCell]
    }
    if (currentDay == null || currentDay > 5) continue

    for (const g of groups) {
      const time =
        parseTimeRange(row[g.timeCol]) ||
        parseTimeRange(row[1]) // fallback первая колонка времени
      if (!time) continue

      const mainRaw = clean(row[g.contentCol])
      const altRaw = clean(row[g.altCol])
      const altBlocked = groups.some(
        (x) => x.timeCol === g.altCol || x.contentCol === g.altCol
      )
      const chunks = parseGroupPair(mainRaw, altRaw, altBlocked)

      for (const c of chunks) {
        lessons.push({
          id: uid(),
          group_name: g.group,
          group_id: null,
          day: currentDay,
          time_start: time.start,
          time_end: time.end,
          title: c.title,
          teacher_name: c.teacherName || null,
          room: c.room || '',
          week: c.week,
          subgroup: c.subgroup || null,
          academic_year: ACADEMIC_YEAR,
          specialty,
          sort_order: sort++,
        })
      }
    }
  }

  console.log(`[ok] ${name}: ${lessons.length} занятий, групп ${groups.map((g) => g.group).join(', ')}`)
  return lessons
}

initDb()

const wb = XLSX.readFile(FILE)
let all = []
for (const name of wb.SheetNames) {
  all = all.concat(parseSheet(name, wb.Sheets[name]))
}

// Привязка group_id если есть study_groups с таким именем/кодом
const groupRows = db.prepare('SELECT id, name FROM study_groups').all()
for (const L of all) {
  const match = groupRows.find(
    (g) =>
      clean(g.name) === L.group_name ||
      clean(g.name).startsWith(L.group_name) ||
      new RegExp(`\\b${L.group_name}\\b`).test(g.name)
  )
  if (match) L.group_id = match.id
}

db.prepare('DELETE FROM schedule_lessons').run()
const ins = db.prepare(`
  INSERT INTO schedule_lessons (
    id, group_name, group_id, day, time_start, time_end, title, teacher_name,
    room, week, subgroup, academic_year, specialty, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const tx = db.transaction((rows) => {
  for (const L of rows) {
    ins.run(
      L.id,
      L.group_name,
      L.group_id,
      L.day,
      L.time_start,
      L.time_end,
      L.title,
      L.teacher_name,
      L.room,
      L.week,
      L.subgroup,
      L.academic_year,
      L.specialty,
      L.sort_order
    )
  }
})
tx(all)

const seed = {
  version: 2,
  exportedAt: new Date().toISOString(),
  academicYear: ACADEMIC_YEAR,
  lessons: all,
}
const seedPath = path.join(__dirname, '..', 'seed', 'schedule-lessons.json')
fs.mkdirSync(path.dirname(seedPath), { recursive: true })
fs.writeFileSync(seedPath, JSON.stringify(seed))

db.prepare(
  `INSERT INTO settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`
).run('seed_schedule_v2', seed.exportedAt)

const byGroup = {}
for (const L of all) {
  byGroup[L.group_name] = (byGroup[L.group_name] || 0) + 1
}

console.log(
  JSON.stringify(
    {
      total: all.length,
      groups: Object.keys(byGroup).sort(),
      byGroup,
      seedPath,
      withWeek: all.filter((x) => x.week != null).length,
    },
    null,
    2
  )
)
