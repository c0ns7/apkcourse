import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Announcement,
  AppData,
  Assignment,
  Role,
  Subject,
  Submission,
  User,
} from '../types'
import {
  getSession,
  loadData,
  registerUser,
  resetData,
  saveData,
  setSession,
  uid,
} from '../store'
import { useToast } from './ToastContext'
import { GRADE_MAX, clampGrade, phonesMatch } from '../utils/helpers'

interface AppContextValue {
  data: AppData
  currentUser: User | null
  login: (phone: string, password: string) => { error: string } | { user: User }
  logout: () => void
  createUser: (fields: {
    phone: string
    password: string
    fullName: string
    role: Exclude<Role, 'admin'>
    group?: string
  }) => string | null
  refresh: () => void
  resetDemo: () => void
  updateProfile: (fields: Partial<Pick<User, 'fullName' | 'phone' | 'bio' | 'group'>>) => void
  addSubject: (title: string, description: string, color?: string) => void
  updateSubject: (subject: Subject) => void
  deleteSubject: (subjectId: string) => void
  addStudentToSubject: (subjectId: string, studentId: string) => void
  removeStudentFromSubject: (subjectId: string, studentId: string) => void
  assignStudentToTeacher: (studentId: string, teacherId: string) => void
  createAssignment: (
    subjectId: string,
    fields: Omit<Assignment, 'id' | 'subjectId' | 'createdAt'>
  ) => void
  updateAssignment: (assignment: Assignment) => void
  deleteAssignment: (assignmentId: string) => void
  submitWork: (assignmentId: string, content: string, attachmentName?: string) => void
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void
  returnSubmission: (submissionId: string, feedback: string) => void
  deleteUser: (userId: string) => void
  addAnnouncement: (title: string, body: string, subjectId?: string, pinned?: boolean) => void
  deleteAnnouncement: (id: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  notifyUser: (userId: string, title: string, message: string, link?: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [data, setData] = useState<AppData>(loadData)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const sid = getSession()
    if (!sid) return null
    const d = loadData()
    return d.users.find((u) => u.id === sid) ?? null
  })

  const persist = useCallback((next: AppData) => {
    saveData(next)
    setData(next)
    const sid = getSession()
    if (sid) {
      const u = next.users.find((x) => x.id === sid)
      if (u) setCurrentUser(u)
    }
  }, [])

  const notifyUser = useCallback(
    (userId: string, title: string, message: string, link?: string) => {
      persist({
        ...data,
        notifications: [
          {
            id: uid(),
            userId,
            title,
            message,
            read: false,
            createdAt: new Date().toISOString(),
            link,
          },
          ...data.notifications,
        ],
      })
    },
    [data, persist]
  )

  const login = useCallback(
    (phone: string, password: string) => {
      const user = data.users.find(
        (u) => phonesMatch(u.phone, phone) && u.password === password
      )
      if (!user) return { error: 'Неверный телефон или пароль' }
      setSession(user.id)
      setCurrentUser(user)
      toast(`Добро пожаловать, ${user.fullName.split(' ')[0]}!`)
      return { user }
    },
    [data.users, toast]
  )

  const logout = useCallback(() => {
    setSession(null)
    setCurrentUser(null)
    toast('Вы вышли из системы', 'info')
  }, [toast])

  const createUser = useCallback(
    (fields: {
      phone: string
      password: string
      fullName: string
      role: Exclude<Role, 'admin'>
      group?: string
    }) => {
      const result = registerUser(data, fields)
      if ('error' in result) return result.error
      persist(result.data)
      toast(`Пользователь ${result.user.fullName} добавлен`)
      return null
    },
    [data, persist, toast]
  )

  const refresh = useCallback(() => {
    const d = loadData()
    setData(d)
    const sid = getSession()
    setCurrentUser(sid ? (d.users.find((u) => u.id === sid) ?? null) : null)
  }, [])

  const resetDemo = useCallback(() => {
    const d = resetData()
    setData(d)
    toast('Демо-данные восстановлены', 'info')
  }, [toast])

  const updateProfile = useCallback(
    (fields: Partial<Pick<User, 'fullName' | 'phone' | 'bio' | 'group'>>) => {
      if (!currentUser) return
      persist({
        ...data,
        users: data.users.map((u) =>
          u.id === currentUser.id ? { ...u, ...fields } : u
        ),
      })
      toast('Профиль сохранён')
    },
    [currentUser, data, persist, toast]
  )

  const addSubject = useCallback(
    (title: string, description: string, color?: string) => {
      if (!currentUser || currentUser.role !== 'teacher') return
      const subject: Subject = {
        id: uid(),
        title,
        description,
        teacherId: currentUser.id,
        studentIds: [],
        color: color ?? '#1a4d6d',
      }
      persist({ ...data, subjects: [...data.subjects, subject] })
      toast('Предмет создан')
    },
    [currentUser, data, persist, toast]
  )

  const updateSubject = useCallback(
    (subject: Subject) => {
      persist({
        ...data,
        subjects: data.subjects.map((s) => (s.id === subject.id ? subject : s)),
      })
      toast('Предмет обновлён')
    },
    [data, persist, toast]
  )

  const deleteSubject = useCallback(
    (subjectId: string) => {
      const assignIds = data.assignments.filter((a) => a.subjectId === subjectId).map((a) => a.id)
      persist({
        ...data,
        subjects: data.subjects.filter((s) => s.id !== subjectId),
        assignments: data.assignments.filter((a) => a.subjectId !== subjectId),
        submissions: data.submissions.filter((s) => !assignIds.includes(s.assignmentId)),
      })
      toast('Предмет удалён', 'info')
    },
    [data, persist, toast]
  )

  const addStudentToSubject = useCallback(
    (subjectId: string, studentId: string) => {
      persist({
        ...data,
        subjects: data.subjects.map((s) =>
          s.id === subjectId && !s.studentIds.includes(studentId)
            ? { ...s, studentIds: [...s.studentIds, studentId] }
            : s
        ),
      })
      toast('Студент добавлен к предмету')
    },
    [data, persist, toast]
  )

  const removeStudentFromSubject = useCallback(
    (subjectId: string, studentId: string) => {
      persist({
        ...data,
        subjects: data.subjects.map((s) =>
          s.id === subjectId
            ? { ...s, studentIds: s.studentIds.filter((id) => id !== studentId) }
            : s
        ),
      })
      toast('Студент убран с предмета', 'info')
    },
    [data, persist, toast]
  )

  const assignStudentToTeacher = useCallback(
    (studentId: string, teacherId: string) => {
      persist({
        ...data,
        users: data.users.map((u) =>
          u.id === studentId ? { ...u, teacherId } : u
        ),
      })
      toast('Студент закреплён за вами')
    },
    [data, persist, toast]
  )

  const createAssignment = useCallback(
    (
      subjectId: string,
      fields: Omit<Assignment, 'id' | 'subjectId' | 'createdAt'>
    ) => {
      const assignment: Assignment = {
        id: uid(),
        subjectId,
        ...fields,
        maxScore: GRADE_MAX,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      const subject = data.subjects.find((s) => s.id === subjectId)
      const newSubs: Submission[] = (subject?.studentIds ?? []).map((studentId) => ({
        id: uid(),
        assignmentId: assignment.id,
        studentId,
        content: '',
        status: 'pending' as const,
      }))
      const next = {
        ...data,
        assignments: [...data.assignments, assignment],
        submissions: [...data.submissions, ...newSubs],
      }
      persist(next)
      subject?.studentIds.forEach((sid) => {
        notifyUser(sid, 'Новое задание', assignment.title, `/student/assignment/${assignment.id}`)
      })
      toast('Задание создано')
    },
    [data, persist, toast]
  )

  const updateAssignment = useCallback(
    (assignment: Assignment) => {
      persist({
        ...data,
        assignments: data.assignments.map((a) =>
          a.id === assignment.id ? assignment : a
        ),
      })
      toast('Задание обновлено')
    },
    [data, persist, toast]
  )

  const deleteAssignment = useCallback(
    (assignmentId: string) => {
      persist({
        ...data,
        assignments: data.assignments.filter((a) => a.id !== assignmentId),
        submissions: data.submissions.filter((s) => s.assignmentId !== assignmentId),
      })
      toast('Задание удалено', 'info')
    },
    [data, persist, toast]
  )

  const submitWork = useCallback(
    (assignmentId: string, content: string, attachmentName?: string) => {
      if (!currentUser) return
      const assignment = data.assignments.find((a) => a.id === assignmentId)
      const existing = data.submissions.find(
        (s) => s.assignmentId === assignmentId && s.studentId === currentUser.id
      )
      const submissionUpdate = {
        content,
        attachmentName,
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
      }
      let next: AppData
      if (existing) {
        next = {
          ...data,
          submissions: data.submissions.map((s) =>
            s.id === existing.id ? { ...s, ...submissionUpdate } : s
          ),
        }
      } else {
        next = {
          ...data,
          submissions: [
            ...data.submissions,
            {
              id: uid(),
              assignmentId,
              studentId: currentUser.id,
              ...submissionUpdate,
            },
          ],
        }
      }
      persist(next)
      if (assignment) {
        const subject = data.subjects.find((s) => s.id === assignment.subjectId)
        if (subject) {
          notifyUser(
            subject.teacherId,
            'Новая работа на проверку',
            `${currentUser.fullName} сдал(а) «${assignment.title}»`,
            '/teacher/grading'
          )
        }
      }
      toast('Работа отправлена на проверку')
    },
    [currentUser, data, persist, toast]
  )

  const gradeSubmission = useCallback(
    (submissionId: string, score: number, feedback: string) => {
      const sub = data.submissions.find((s) => s.id === submissionId)
      const grade = clampGrade(score)
      persist({
        ...data,
        submissions: data.submissions.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                score: grade,
                feedback,
                status: 'graded',
                gradedAt: new Date().toISOString(),
              }
            : s
        ),
      })
      if (sub) {
        const assignment = data.assignments.find((a) => a.id === sub.assignmentId)
        notifyUser(
          sub.studentId,
          'Оценка выставлена',
          `${assignment?.title ?? 'Задание'}: оценка ${grade}`,
          '/student/grades'
        )
      }
      toast('Оценка сохранена')
    },
    [data, persist, toast]
  )

  const returnSubmission = useCallback(
    (submissionId: string, feedback: string) => {
      const sub = data.submissions.find((s) => s.id === submissionId)
      persist({
        ...data,
        submissions: data.submissions.map((s) =>
          s.id === submissionId
            ? { ...s, status: 'returned', feedback, score: undefined, gradedAt: undefined }
            : s
        ),
      })
      if (sub) {
        notifyUser(
          sub.studentId,
          'Работа возвращена на доработку',
          feedback,
          `/student/assignment/${sub.assignmentId}`
        )
      }
      toast('Работа возвращена студенту', 'info')
    },
    [data, persist, toast]
  )

  const deleteUser = useCallback(
    (userId: string) => {
      persist({
        ...data,
        users: data.users.filter((u) => u.id !== userId),
        subjects: data.subjects.map((s) => ({
          ...s,
          studentIds: s.studentIds.filter((id) => id !== userId),
        })),
        notifications: data.notifications.filter((n) => n.userId !== userId),
      })
      toast('Пользователь удалён', 'info')
    },
    [data, persist, toast]
  )

  const addAnnouncement = useCallback(
    (title: string, body: string, subjectId?: string, pinned = false) => {
      if (!currentUser) return
      const ann: Announcement = {
        id: uid(),
        title,
        body,
        authorId: currentUser.id,
        subjectId,
        createdAt: new Date().toISOString(),
        pinned,
      }
      persist({ ...data, announcements: [ann, ...data.announcements] })
      toast('Объявление опубликовано')
    },
    [currentUser, data, persist, toast]
  )

  const deleteAnnouncement = useCallback(
    (id: string) => {
      persist({
        ...data,
        announcements: data.announcements.filter((a) => a.id !== id),
      })
      toast('Объявление удалено', 'info')
    },
    [data, persist, toast]
  )

  const markNotificationRead = useCallback(
    (id: string) => {
      persist({
        ...data,
        notifications: data.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })
    },
    [data, persist]
  )

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUser) return
    persist({
      ...data,
      notifications: data.notifications.map((n) =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      ),
    })
  }, [currentUser, data, persist])

  const value = useMemo(
    () => ({
      data,
      currentUser,
      login,
      logout,
      createUser,
      refresh,
      resetDemo,
      updateProfile,
      addSubject,
      updateSubject,
      deleteSubject,
      addStudentToSubject,
      removeStudentFromSubject,
      assignStudentToTeacher,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submitWork,
      gradeSubmission,
      returnSubmission,
      deleteUser,
      addAnnouncement,
      deleteAnnouncement,
      markNotificationRead,
      markAllNotificationsRead,
      notifyUser,
    }),
    [
      data,
      currentUser,
      login,
      logout,
      createUser,
      refresh,
      resetDemo,
      updateProfile,
      addSubject,
      updateSubject,
      deleteSubject,
      addStudentToSubject,
      removeStudentFromSubject,
      assignStudentToTeacher,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submitWork,
      gradeSubmission,
      returnSubmission,
      deleteUser,
      addAnnouncement,
      deleteAnnouncement,
      markNotificationRead,
      markAllNotificationsRead,
      notifyUser,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
