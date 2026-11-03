import type { ScheduleItem } from '../types'

export type ScheduleGroupOption = {
  key: string
  name: string
  specialty?: string
  label: string
}

function shortSpecialty(specialty?: string): string {
  const s = String(specialty || '').trim()
  if (!s) return ''
  const m = s.match(/^\d[\d.]*\s+(.+)$/)
  const name = (m ? m[1] : s).trim()
  return name.length > 42 ? `${name.slice(0, 40)}…` : name
}

export function scheduleGroupKey(name: string, specialty?: string): string {
  return `${name}::${specialty || ''}`
}

export function buildScheduleGroupOptions(lessons: ScheduleItem[]): ScheduleGroupOption[] {
  const map = new Map<string, ScheduleGroupOption>()
  for (const L of lessons) {
    if (!L.group) continue
    const key = scheduleGroupKey(L.group, L.specialty)
    if (map.has(key)) continue
    const short = shortSpecialty(L.specialty)
    map.set(key, {
      key,
      name: L.group,
      specialty: L.specialty,
      label: short ? `${L.group} — ${short}` : L.group,
    })
  }
  return [...map.values()].sort((a, b) => {
    const na = Number(a.name)
    const nb = Number(b.name)
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
    return a.label.localeCompare(b.label, 'ru', { numeric: true })
  })
}

export function matchStudentSchedule(
  lessons: ScheduleItem[],
  groupCode: string,
  specialty?: string | null
): ScheduleItem[] {
  if (!groupCode) return []
  const byGroup = lessons.filter(
    (s) =>
      s.group === groupCode ||
      s.group.startsWith(groupCode) ||
      s.group.includes(groupCode)
  )
  if (!specialty) return byGroup
  const exact = byGroup.filter((s) => s.specialty === specialty)
  if (exact.length) return exact
  // частичное совпадение названия специальности
  const soft = byGroup.filter(
    (s) =>
      s.specialty &&
      (s.specialty.includes(specialty) || specialty.includes(s.specialty))
  )
  return soft.length ? soft : byGroup
}
