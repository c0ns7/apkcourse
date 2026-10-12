import type {
  Announcement,
  AppData,
  Assignment,
  AssignmentType,
  Attachment,
  Role,
  Submission,
  User,
} from './types'
import {
  CURRENT_ACADEMIC_YEAR,
  DEFAULT_ENABLED_ASSIGNMENT_TYPES,
  GRADE_MAX,
  clampGrade,
  loginsMatch,
  migrateLegacyAssignmentType,
  normalizeLogin,
} from './utils/helpers'

const STORAGE_KEY = 'apk-portal-data-v4'
const SESSION_KEY = 'apk-portal-session'
const LEGACY_KEYS = ['apk-portal-data-v3', 'apk-portal-data-v2']

function uid() {
  return crypto.randomUUID()
}

const disciplineCatalog = [
  'Педагогика и методика обучения',
  'Психология развития',
  'Дошкольная педагогика',
  'Методика математики',
  'Русский язык и культура речи',
  'Информатика',
]

const seed: AppData = {
  disciplineCatalog,
  users: [
    {
      id: 'u-admin',
      login: 'admin',
      password: 'admin123',
      fullName: 'Администратор Системы',
      role: 'admin',
      academicYear: CURRENT_ACADEMIC_YEAR,
      personalDataConsent: true,
      createdAt: '2025-09-01',
    },
    {
      id: 'u-teacher-1',
      login: 'teacher',
      password: 'teacher123',
      fullName: 'Бадмаева Цыренжап Борисовна',
      role: 'teacher',
      bio: 'Кандидат педагогических наук, стаж 18 лет',
      academicYear: CURRENT_ACADEMIC_YEAR,
      disciplineIds: ['s-1', 's-2'],
      enabledAssignmentTypes: DEFAULT_ENABLED_ASSIGNMENT_TYPES,
      personalDataConsent: true,
      createdAt: '2020-09-01',
    },
    {
      id: 'u-teacher-2',
      login: 'ivanov',
      password: 'teacher123',
      fullName: 'Иванов Петр Сергеевич',
      role: 'teacher',
      academicYear: CURRENT_ACADEMIC_YEAR,
      disciplineIds: ['s-3'],
      enabledAssignmentTypes: DEFAULT_ENABLED_ASSIGNMENT_TYPES,
      personalDataConsent: true,
      createdAt: '2021-09-01',
    },
    {
      id: 'u-student-1',
      login: 'student',
      password: 'student123',
      fullName: 'Доржиева Алина Батоевна',
      role: 'student',
      group: 'ПД-21',
      specialty: 'Дошкольное образование',
      course: 2,
      academicYear: CURRENT_ACADEMIC_YEAR,
      teacherId: 'u-teacher-1',
      personalDataConsent: true,
      createdAt: '2024-09-01',
    },
    {
      id: 'u-student-2',
      login: 'petrov',
      password: 'student123',
      fullName: 'Петров Максим Андреевич',
      role: 'student',
      group: 'ПД-21',
      specialty: 'Дошкольное образование',
      course: 2,
      academicYear: CURRENT_ACADEMIC_YEAR,
      teacherId: 'u-teacher-1',
      personalDataConsent: true,
      createdAt: '2024-09-01',
    },
    {
      id: 'u-student-3',
      login: 'sokolova',
      password: 'student123',
      fullName: 'Соколова Екатерина Игоревна',
      role: 'student',
      group: 'ПД-22',
      specialty: 'Преподавание в начальных классах',
      course: 1,
      academicYear: CURRENT_ACADEMIC_YEAR,
      personalDataConsent: true,
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
      title: 'Эссе: История педагогики в Бурятии',
      description:
        'Напишите эссе объёмом 3–5 страниц. Укажите ключевые фигуры и вклад в развитие образования.',
      deadline: '2026-06-15',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-01',
      type: 'essay',
      attachments: [
        {
          id: 'att-1',
          kind: 'file',
          name: 'metodichka_pedagogika.pdf',
        },
        {
          id: 'att-2',
          kind: 'link',
          name: 'Материалы по истории образования',
          url: 'https://example.com/pedagogika',
        },
      ],
    },
    {
      id: 'a-2',
      subjectId: 's-1',
      title: 'Практика: Конспект урока',
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
      description: 'Ответьте на вопросы теста.',
      deadline: '2026-05-25',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-12',
      type: 'test',
      payload: {
        questions: [
          { question: 'Кто автор теории психосоциального развития?' },
          { question: 'Что такое зона ближайшего развития?' },
          { question: 'Назовите стадии развития по Пиаже.' },
        ],
      },
    },
    {
      id: 'a-4',
      subjectId: 's-1',
      title: 'Соответствия: Методы и приёмы',
      description: 'Соотнесите методы обучения с примерами приёмов.',
      deadline: '2026-05-28',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-15',
      type: 'matching',
      payload: {
        pairs: [
          { left: 'Беседа', right: 'Вопрос-ответ' },
          { left: 'Демонстрация', right: 'Показ образца' },
          { left: 'Упражнение', right: 'Повтор действия' },
        ],
      },
    },
    {
      id: 'a-5',
      subjectId: 's-1',
      title: 'Викторина: Знатоки педагогики',
      description: 'Творческая викторина по теме занятия.',
      deadline: '2026-06-10',
      maxScore: GRADE_MAX,
      createdAt: '2026-05-16',
      type: 'quiz',
      payload: {
        questions: [
          {
            question: 'Кто считается основателем научной педагогики?',
            options: ['Коменский', 'Ушинский', 'Макаренко'],
          },
          {
            question: 'Что означает принцип наглядности?',
            options: ['Опора на образы', 'Только лекция', 'Домашнее задание'],
          },
        ],
      },
    },
  ],
  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'a-1',
      studentId: 'u-student-1',
      content:
        'Эссе выполнено. Основные разделы: введение, исторический обзор, современное состояние, заключение.',
      attachments: [{ id: 'satt-1', kind: 'file', name: 'esse_pedagogika.docx' }],
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
      content: '',
      answers: '1. Эриксон\n2. То, что ребёнок делает с помощью взрослого\n3. Сенсомоторная, дооперациональная, конкретные и формальные операции',
      status: 'graded',
      gradeMode: 'score',
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
      audience: 'group',
      group: 'ПД-21',
      createdAt: '2026-05-10T08:00:00',
      pinned: true,
    },
    {
      id: 'ann-2',
      title: 'День открытых дверей колледжа',
      body: '25 мая приглашаем абитуриентов и родителей. Начало в 10:00, актовый зал.',
      authorId: 'u-admin',
      audience: 'all',
      createdAt: '2026-05-08T12:00:00',
      pinned: true,
    },
    {
      id: 'ann-3',
      title: 'Новое задание по психологии',
      body: 'Добавлен тест по теориям развития. Срок сдачи — 25 мая.',
      authorId: 'u-teacher-1',
      audience: 'all',
      createdAt: '2026-05-12T16:30:00',
    },
  ],
  notifications: [
    {
      id: 'n-1',
      userId: 'u-student-1',
      title: 'Работа принята на проверку',
      message: 'Ваше эссе по педагогике отправлено преподавателю.',
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
  chatThreads: [
    {
      id: 'ch-1',
      studentId: 'u-student-1',
      teacherId: 'u-teacher-1',
      subjectId: 's-1',
      updatedAt: '2026-05-14T11:00:00',
    },
  ],
  chatMessages: [
    {
      id: 'cm-1',
      threadId: 'ch-1',
      senderId: 'u-student-1',
      body: 'Здравствуйте! Не совсем поняла требования к эссе. Можно уточнить объём?',
      createdAt: '2026-05-14T10:45:00',
      read: true,
    },
    {
      id: 'cm-2',
      threadId: 'ch-1',
      senderId: 'u-teacher-1',
      body: 'Добрый день! Достаточно 3–5 страниц, список литературы обязателен.',
      createdAt: '2026-05-14T11:00:00',
      read: false,
    },
  ],
}

const legacyLogins: Record<string, string> = {
  'u-admin': 'admin',
  'u-teacher-1': 'teacher',
  'u-teacher-2': 'ivanov',
  'u-student-1': 'student',
  'u-student-2': 'petrov',
  'u-student-3': 'sokolova',
}

function toAttachments(
  legacyName?: string,
  attachments?: Attachment[]
): Attachment[] | undefined {
  if (attachments?.length) return attachments
  if (legacyName) {
    return [{ id: uid(), kind: 'file', name: legacyName }]
  }
  return undefined
}

function migrateUser(u: User & { phone?: string; email?: string }): User {
  const login =
    u.login ||
    legacyLogins[u.id] ||
    (u.phone ? `user${u.phone.replace(/\D/g, '').slice(-4)}` : `user-${u.id.slice(0, 6)}`)
  const { phone: _phone, email: _email, ...rest } = u as User & {
    phone?: string
    email?: string
  }
  return {
    ...rest,
    login: normalizeLogin(login),
    academicYear: u.academicYear ?? CURRENT_ACADEMIC_YEAR,
    personalDataConsent: u.personalDataConsent ?? true,
    enabledAssignmentTypes:
      u.role === 'teacher'
        ? u.enabledAssignmentTypes ?? DEFAULT_ENABLED_ASSIGNMENT_TYPES
        : u.enabledAssignmentTypes,
  }
}

function migrateAssignment(a: Assignment & { type?: string; attachmentName?: string }): Assignment {
  const { attachmentName, ...rest } = a
  return {
    ...rest,
    maxScore: GRADE_MAX,
    type: migrateLegacyAssignmentType(a.type),
    attachments: toAttachments(attachmentName, a.attachments),
  }
}

function migrateSubmission(s: Submission & { attachmentName?: string }): Submission {
  const { attachmentName, ...rest } = s
  return {
    ...rest,
    attachments: toAttachments(attachmentName, s.attachments),
    gradeMode: s.gradeMode ?? (s.score != null ? 'score' : undefined),
    score: s.score != null ? clampGrade(s.score) : s.score,
  }
}

function migrateAnnouncement(
  a: Announcement & { subjectId?: string; audience?: string; group?: string }
): Announcement {
  return {
    ...a,
    audience: (a.audience as Announcement['audience']) ?? (a.group ? 'group' : 'all'),
    group: a.group,
  }
}

function migrate(parsed: Partial<AppData> & { users?: Array<User & { phone?: string }> }): AppData {
  const users = (parsed.users ?? seed.users).map((u) => migrateUser(u))
  const assignments = (parsed.assignments ?? seed.assignments).map((a) =>
    migrateAssignment(a as Assignment & { type?: string })
  )
  const submissions = (parsed.submissions ?? seed.submissions).map((s) =>
    migrateSubmission(s as Submission)
  )
  const announcements = (parsed.announcements ?? seed.announcements).map((a) =>
    migrateAnnouncement(a as Announcement)
  )

  return {
    users,
    subjects: parsed.subjects ?? seed.subjects,
    assignments,
    submissions,
    announcements,
    notifications: parsed.notifications ?? seed.notifications,
    schedule: parsed.schedule ?? seed.schedule,
    chatThreads: parsed.chatThreads ?? seed.chatThreads,
    chatMessages: parsed.chatMessages ?? seed.chatMessages,
    disciplineCatalog: parsed.disciplineCatalog ?? seed.disciplineCatalog,
  }
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key)
      if (legacy) {
        const migrated = migrate(JSON.parse(legacy))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        return migrated
      }
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

export type RegisterFields = {
  login: string
  password: string
  fullName: string
  role: Role
  group?: string
  specialty?: string
  course?: number
  academicYear?: string
  disciplineIds?: string[]
  disciplines?: string[]
  personalDataConsent?: boolean
}

export function registerUser(
  data: AppData,
  fields: RegisterFields
): { data: AppData; user: User } | { error: string } {
  if (!fields.personalDataConsent) {
    return { error: 'Необходимо согласие на обработку персональных данных' }
  }
  if (data.users.some((u) => loginsMatch(u.login, fields.login))) {
    return { error: 'Пользователь с таким логином уже существует' }
  }
  const user: User = {
    id: uid(),
    login: normalizeLogin(fields.login),
    password: fields.password,
    fullName: fields.fullName.trim(),
    role: fields.role,
    group: fields.group,
    specialty: fields.specialty,
    course: fields.course,
    academicYear: fields.academicYear ?? CURRENT_ACADEMIC_YEAR,
    disciplineIds: fields.disciplineIds,
    disciplines: fields.disciplines,
    personalDataConsent: true,
    enabledAssignmentTypes:
      fields.role === 'teacher' ? DEFAULT_ENABLED_ASSIGNMENT_TYPES : undefined,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  const next = { ...data, users: [...data.users, user] }
  saveData(next)
  return { data: next, user }
}

export { uid }
export type { AssignmentType }
