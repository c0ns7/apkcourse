import type {
  AdminScope,
  AppData,
  Assignment,
  AssignmentType,
  EducationForm,
  GradeMode,
  Role,
  Submission,
  User,
} from '../types'

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

export const EDUCATION_FORMS: EducationForm[] = [
  'fulltime',
  'distance',
  'retraining',
  'professional',
]

export const educationFormLabels: Record<EducationForm, string> = {
  fulltime: 'Очная форма',
  distance: 'Заочное обучение',
  retraining: 'Профессиональная переподготовка',
  professional: 'Профессиональное обучение',
}

export const adminScopeLabels: Record<AdminScope, string> = {
  all: 'Полные права',
  fulltime: 'Очная форма',
  distance: 'Заочное обучение',
  retraining: 'Проф. переподготовка',
  professional: 'Проф. обучение',
  schedule: 'Расписание занятий',
}

export function normalizeAdminScopes(scopes?: AdminScope[] | null): AdminScope[] {
  if (!scopes?.length) return ['all']
  if (scopes.includes('all')) return ['all']
  return [...new Set(scopes.filter((s) => s !== 'all'))] as AdminScope[]
}

export function adminCanManageSchedule(
  user: Pick<User, 'isRoot' | 'adminScopes' | 'role' | 'roles'> | null | undefined
): boolean {
  if (!user) return false
  if (user.isRoot) return true
  if (!hasRole(user, 'admin')) return false
  const scopes = normalizeAdminScopes(user.adminScopes)
  return scopes.includes('all') || scopes.includes('schedule')
}

/**
 * Учебная неделя 1/2:
 * 1 сентября — начало 1-й недели, через 7 дней — 2-я, затем снова 1-я…
 * (9 сент. = 2-я, 16 сент. = 1-я)
 */
export function getStudyWeekNumber(date: Date = new Date()): 1 | 2 {
  const y = date.getFullYear()
  let start = new Date(y, 8, 1) // 1 сентября
  start.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (d < start) start = new Date(y - 1, 8, 1)
  const diffDays = Math.floor((d.getTime() - start.getTime()) / 86_400_000)
  const weekIndex = Math.floor(Math.max(0, diffDays) / 7)
  return ((weekIndex % 2) + 1) as 1 | 2
}

export function lessonVisibleOnWeek(
  lessonWeek: 1 | 2 | null | undefined,
  currentWeek: 1 | 2
): boolean {
  return lessonWeek == null || lessonWeek === currentWeek
}

/** Может ли админ управлять данной формой обучения */
export function adminCanManageForm(
  user: Pick<User, 'isRoot' | 'adminScopes' | 'role' | 'roles'> | null | undefined,
  form: EducationForm
): boolean {
  if (!user) return false
  if (user.isRoot) return true
  if (!hasRole(user, 'admin')) return false
  const scopes = normalizeAdminScopes(user.adminScopes)
  return scopes.includes('all') || scopes.includes(form)
}

export function adminManagedForms(
  user: Pick<User, 'isRoot' | 'adminScopes' | 'role' | 'roles'> | null | undefined
): EducationForm[] {
  if (!user) return []
  if (user.isRoot) return [...EDUCATION_FORMS]
  const scopes = normalizeAdminScopes(user.adminScopes)
  if (scopes.includes('all')) return [...EDUCATION_FORMS]
  return EDUCATION_FORMS.filter((f) => scopes.includes(f))
}

export function studentEducationForm(
  user: Pick<User, 'educationForm' | 'groupId'>,
  groups: AppData['groups']
): EducationForm {
  if (user.groupId) {
    const g = groups.find((x) => x.id === user.groupId)
    if (g) return g.educationForm
  }
  return user.educationForm || 'fulltime'
}

/** Видно ли задание студенту (группы + форма обучения) */
export function isAssignmentForStudent(
  assignment: Assignment,
  student: Pick<User, 'id' | 'groupId' | 'educationForm'>,
  data: Pick<AppData, 'groups' | 'subjects'>
): boolean {
  const subject = data.subjects.find((s) => s.id === assignment.subjectId)
  if (!subject?.studentIds.includes(student.id) && !(assignment.groupIds?.length)) {
    // not enrolled and no group targeting
  }
  if (subject && !subject.studentIds.includes(student.id)) {
    if (!assignment.groupIds?.length || !student.groupId) return false
    if (!assignment.groupIds.includes(student.groupId)) return false
  }
  if (assignment.groupIds?.length) {
    if (!student.groupId || !assignment.groupIds.includes(student.groupId)) return false
  }
  if (assignment.educationForms?.length) {
    const form = studentEducationForm(student, data.groups)
    if (!assignment.educationForms.includes(form)) return false
  }
  return true
}

/** Модуль доступен, если предыдущий полностью сдан (оценён) */
export function isModuleUnlocked(
  moduleId: string | undefined,
  subjectId: string,
  studentId: string,
  data: Pick<AppData, 'modules' | 'assignments' | 'submissions'>
): boolean {
  if (!moduleId) return true
  const modules = data.modules
    .filter((m) => m.subjectId === subjectId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const idx = modules.findIndex((m) => m.id === moduleId)
  if (idx <= 0) return true
  const prev = modules[idx - 1]
  const prevAssignments = data.assignments.filter((a) => a.moduleId === prev.id)
  if (!prevAssignments.length) return true
  return prevAssignments.every((a) => {
    const sub = data.submissions.find(
      (s) => s.assignmentId === a.id && s.studentId === studentId
    )
    if (!sub || sub.status !== 'graded') return false
    if (sub.gradeMode === 'pass_fail') return Boolean(sub.passed)
    return true
  })
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
