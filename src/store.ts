import type { AppData, User, Role } from './types'
import { GRADE_MAX, clampGrade, normalizePhone, phonesMatch } from './utils/helpers'

const STORAGE_KEY = 'apk-portal-data-v3'
const SESSION_KEY = 'apk-portal-session'

function uid() {
  return crypto.randomUUID()
}

const seed: AppData = {
  users: [
    {
      id: 'u-admin',
      phone: '+79000000001',
      password: 'admin123',
      fullName: 'Администратор Системы',
      role: 'admin',
      createdAt: '2025-09-01',
    },
    {
      id: 'u-teacher-1',
      phone: '+79241234567',
      password: 'teacher123',
      fullName: 'Бадмаева Цыренжап Борисовна',
      role: 'teacher',
      bio: 'Кандидат педагогических наук, стаж 18 лет',
      createdAt: '2020-09-01',
    },
    {
      id: 'u-teacher-2',
      phone: '+79247654321',
      password: 'teacher123',
      fullName: 'Иванов Петр Сергеевич',
      role: 'teacher',
      createdAt: '2021-09-01',
    },
    {
      id: 'u-student-1',
      phone: '+79245551234',
      password: 'student123',
      fullName: 'Доржиева Алина Батоевна',
      role: 'student',
      group: 'ПД-21',
      teacherId: 'u-teacher-1',
      createdAt: '2024-09-01',
    },
    {
      id: 'u-student-2',
      phone: '+79247778899',
      password: 'student123',
      fullName: 'Петров Максим Андреевич',
      role: 'student',
      group: 'ПД-21',
      teacherId: 'u-teacher-1',
      createdAt: '2024-09-01',
    },
    {
      id: 'u-student-3',
      phone: '+79243334455',
      password: 'student123',
      fullName: 'Соколова Екатерина Игоревна',
      role: 'student',
      group: 'ПД-22',
      createdAt: '2024-09-01',
    },
  ],
  subjects: [
    {
      id: 's-1',
      title: 'Педагогика и методика обучения',
      description: 'Основы педагогической деятельности, современные методы обучения.',
      teacherId: 'u-teacher-1',
      studentIds: ['u-student-1', 'u-student-2'],
      color: '#1a4d6d',
    },
    {
      id: 's-2',
      title: 'Психология развития',
      description: 'Возрастная психология, особенности развития детей дошкольного возраста.',
      teacherId: 'u-teacher-1',
      studentIds: ['u-student-1'],
      color: '#2d8a5e',
    },
    {
      id: 's-3',
      title: 'Дошкольная педагогика',
      description: 'Организация образовательного процесса в ДОУ.',
      teacherId: 'u-teacher-2',
      studentIds: [],
      color: '#7c3aed',
    },
  ],
  assignments: [
    {
      id: 'a-1',
      subjectId: 's-1',
      title: 'Реферат: История педагогики в Бурятии',
      description: 'Подготовьте реферат объёмом 5–7 страниц. Укажите ключевые фигуры и вклад в развитие образования.',
      deadline: '2026-06-15',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-01',
      type: 'essay',
      attachmentName: 'metodichka_pedagogika.pdf',
    },
    {
      id: 'a-2',
      subjectId: 's-1',
      title: 'Практическое задание: Конспект урока',
      description: 'Составьте конспект урока по выбранной теме для 5 класса.',
      deadline: '2026-06-01',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-10',
      type: 'practical',
    },
    {
      id: 'a-3',
      subjectId: 's-2',
      title: 'Тест: Теории развития личности',
      description: 'Ответьте на вопросы теста (опишите ответы текстом).',
      deadline: '2026-05-25',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-12',
      type: 'test',
    },
    {
      id: 'a-4',
      subjectId: 's-1',
      title: 'Проект: Методическая разработка',
      description: 'Разработайте методическую карту занятия для дошкольной группы.',
      deadline: '2026-05-18',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-15',
      type: 'project',
    },
  ],
  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'a-1',
      studentId: 'u-student-1',
      content: 'Реферат выполнен. Основные разделы: введение, исторический обзор, современное состояние, заключение.',
      attachmentName: 'referat_pedagogika.docx',
      status: 'submitted',
      submittedAt: '2026-05-14T10:30:00',
    },
    {
      id: 'sub-2',
      assignmentId: 'a-2',
      studentId: 'u-student-1',
      content: '',
      status: 'pending',
    },
    {
      id: 'sub-3',
      assignmentId: 'a-1',
      studentId: 'u-student-2',
      content: '',
      status: 'pending',
    },
    {
      id: 'sub-4',
      assignmentId: 'a-3',
      studentId: 'u-student-1',
      content: 'Ответы на все 15 вопросов теста приведены ниже...',
      status: 'graded',
      score: 4,
      feedback: 'Хорошая работа. Уточните ответ на вопрос 12.',
      submittedAt: '2026-05-16T14:00:00',
      gradedAt: '2026-05-17T09:00:00',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Расписание консультаций на май',
      body: 'Консультации по педагогике: по вторникам 14:00, ауд. 204. Запись в личном кабинете.',
      authorId: 'u-teacher-1',
      subjectId: 's-1',
      createdAt: '2026-05-10T08:00:00',
      pinned: true,
    },
    {
      id: 'ann-2',
      title: 'День открытых дверей колледжа',
      body: '25 мая приглашаем абитуриентов и родителей. Начало в 10:00, актовый зал.',
      authorId: 'u-admin',
      createdAt: '2026-05-08T12:00:00',
      pinned: true,
    },
    {
      id: 'ann-3',
      title: 'Новое задание по психологии',
      body: 'Добавлен тест по теориям развития. Срок сдачи — 25 мая.',
      authorId: 'u-teacher-1',
      subjectId: 's-2',
      createdAt: '2026-05-12T16:30:00',
    },
  ],
  notifications: [
    {
      id: 'n-1',
      userId: 'u-student-1',
      title: 'Работа принята на проверку',
      message: 'Ваш реферат по педагогике отправлен преподавателю.',
      read: false,
      createdAt: '2026-05-14T10:31:00',
      link: '/student/assignment/a-1',
    },
    {
      id: 'n-2',
      userId: 'u-student-1',
      title: 'Оценка выставлена',
      message: 'Тест по психологии: оценка 4.',
      read: false,
      createdAt: '2026-05-17T09:01:00',
      link: '/student/assignment/a-3',
    },
  ],
  schedule: [
    { id: 'sch-1', subjectId: 's-1', group: 'ПД-21', day: 0, timeStart: '09:00', timeEnd: '10:30', room: '204' },
    { id: 'sch-2', subjectId: 's-2', group: 'ПД-21', day: 1, timeStart: '10:40', timeEnd: '12:10', room: '105' },
    { id: 'sch-3', subjectId: 's-1', group: 'ПД-21', day: 2, timeStart: '13:00', timeEnd: '14:30', room: '204' },
    { id: 'sch-4', subjectId: 's-2', group: 'ПД-21', day: 3, timeStart: '09:00', timeEnd: '10:30', room: '301' },
    { id: 'sch-5', subjectId: 's-1', group: 'ПД-22', day: 0, timeStart: '14:40', timeEnd: '16:10', room: '204' },
  ],
}

const legacyPhones: Record<string, string> = {
  'u-admin': '+79000000001',
  'u-teacher-1': '+79241234567',
  'u-teacher-2': '+79247654321',
  'u-student-1': '+79245551234',
  'u-student-2': '+79247778899',
  'u-student-3': '+79243334455',
}

function migrateUser(u: User & { email?: string }): User {
  const phone =
    u.phone ||
    legacyPhones[u.id] ||
    (u.email ? `+7${normalizePhone(u.email).slice(0, 10).padEnd(10, '0')}` : '+79000000000')
  const { email, ...rest } = u
  return { ...rest, phone, email: email || undefined }
}

function migrateScore(score: number, oldMax: number): number {
  if (score <= GRADE_MAX) return clampGrade(score)
  return clampGrade((score / oldMax) * GRADE_MAX)
}

function migrate(parsed: Partial<AppData>): AppData {
  const users = (parsed.users ?? seed.users).map((u) => migrateUser(u as User & { email?: string }))
  const assignments = (parsed.assignments ?? seed.assignments).map((a) => ({
    ...a,
    maxScore: GRADE_MAX,
  }))
  const submissions = (parsed.submissions ?? seed.submissions).map((s) => {
    if (s.score == null) return s
    const a = (parsed.assignments ?? seed.assignments).find((x) => x.id === s.assignmentId)
    const oldMax = a?.maxScore && a.maxScore > GRADE_MAX ? a.maxScore : GRADE_MAX
    return { ...s, score: migrateScore(s.score, oldMax) }
  })

  return {
    users,
    subjects: parsed.subjects ?? seed.subjects,
    assignments,
    submissions,
    announcements: parsed.announcements ?? seed.announcements,
    notifications: parsed.notifications ?? seed.notifications,
    schedule: parsed.schedule ?? seed.schedule,
  }
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const legacy = localStorage.getItem('apk-portal-data-v2')
    if (legacy) {
      const migrated = migrate(JSON.parse(legacy))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return JSON.parse(JSON.stringify(seed)) as AppData
  }
  return migrate(JSON.parse(raw))
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return JSON.parse(JSON.stringify(seed)) as AppData
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setSession(userId: string | null) {
  if (userId) localStorage.setItem(SESSION_KEY, userId)
  else localStorage.removeItem(SESSION_KEY)
}

export function registerUser(
  data: AppData,
  fields: { phone: string; password: string; fullName: string; role: Role; group?: string }
): { data: AppData; user: User } | { error: string } {
  if (data.users.some((u) => phonesMatch(u.phone, fields.phone))) {
    return { error: 'Пользователь с таким номером телефона уже существует' }
  }
  const user: User = {
    id: uid(),
    phone: fields.phone.trim(),
    password: fields.password,
    fullName: fields.fullName,
    role: fields.role,
    group: fields.group,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  const next = { ...data, users: [...data.users, user] }
  saveData(next)
  return { data: next, user }
}

export { uid }
