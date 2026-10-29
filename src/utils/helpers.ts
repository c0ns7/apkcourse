import type { AssignmentType, GradeMode, Role, Submission, User } from '../types'

export function userRoles(u: Pick<User, 'role' | 'roles'>): Role[] {
  if (u.roles?.length) return u.roles
  return u.role ? [u.role] : []
}

export function hasRole(u: Pick<User, 'role' | 'roles'>, role: Role): boolean {
  return userRoles(u).includes(role)
}

export const roleHomePath: Record<Role, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
}

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

export const assignmentTypeLabels: Record<AssignmentType, string> = {
  essay: 'Эссе',
  test: 'Тест',
  table: 'Таблица',
  scheme: 'Схема',
  matching: 'Соответствия',
  qa: 'Ответы на вопросы',
  quiz: 'Викторина',
  distribution: 'Распределение',
  practical: 'Практика',
  other: 'Другое',
}

export const ALL_ASSIGNMENT_TYPES: AssignmentType[] = [
  'essay',
  'test',
  'table',
  'scheme',
  'matching',
  'qa',
  'quiz',
  'distribution',
  'practical',
  'other',
]

export const DEFAULT_ENABLED_ASSIGNMENT_TYPES: AssignmentType[] = [
  'essay',
  'test',
  'table',
  'scheme',
  'matching',
  'qa',
  'quiz',
  'distribution',
  'other',
]

export const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const ACADEMIC_YEARS = ['2025-2026', '2026-2027', '2027-2028', '2028-2029']

export const CURRENT_ACADEMIC_YEAR = '2026-2027'

export const SPECIALTIES = [
  'Дошкольное образование',
  'Преподавание в начальных классах',
  'Физическая культура',
  'Музыкальное образование',
  'Специальное дошкольное образование',
]

/** Пятибалльная шкала (2–5) */
export const GRADE_MAX = 5
export const GRADE_MIN = 2

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

export function formatGrade(sub: Pick<Submission, 'gradeMode' | 'score' | 'passed'>): string {
  if (sub.gradeMode === 'pass_fail') {
    return sub.passed ? 'Зачёт' : 'Незачёт'
  }
  if (sub.score != null) return String(sub.score)
  return '—'
}

export function gradeModeLabel(mode: GradeMode): string {
  return mode === 'pass_fail' ? 'Зачёт / Незачёт' : 'Оценка 2–5'
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase()
}

export function loginsMatch(a: string, b: string): boolean {
  return normalizeLogin(a) === normalizeLogin(b) && normalizeLogin(a).length > 0
}

export function migrateLegacyAssignmentType(
  type?: string
): AssignmentType | undefined {
  if (!type) return undefined
  if (type === 'project') return 'other'
  if (type in assignmentTypeLabels) return type as AssignmentType
  if (type === 'essay') return 'essay'
  return 'other'
}
