export type DeadlineStatus = 'ok' | 'soon' | 'overdue' | 'today'

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatDate(date: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString('ru-RU', opts ?? {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon'
  return 'ok'
}

export const deadlineLabels: Record<DeadlineStatus, string> = {
  ok: 'В срок',
  soon: 'Скоро срок',
  today: 'Сегодня',
  overdue: 'Просрочено',
}

export const assignmentTypeLabels = {
  essay: 'Реферат',
  test: 'Тест',
  practical: 'Практика',
  project: 'Проект',
}

export const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

/** Пятибалльная шкала (2–5) */
export const GRADE_MAX = 5
export const GRADE_MIN = 2

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.slice(1)
  }
  return digits
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  return na.length > 0 && na === nb
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone)
  if (d.length === 10) {
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`
  }
  return phone
}

export function clampGrade(score: number): number {
  return Math.min(GRADE_MAX, Math.max(GRADE_MIN, Math.round(score)))
}

export function gradePercent(score: number): number {
  return (clampGrade(score) / GRADE_MAX) * 100
}

export function averageScore(scores: number[]) {
  if (!scores.length) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}
