import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AnnouncementAudience,
  AppData,
  Assignment,
  AssignmentType,
  Attachment,
  GradeMode,
  Role,
  Subject,
  User,
} from '../types'
import { api, emptyData, getToken, setToken } from '../api'
import { useToast } from './ToastContext'

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

interface AppContextValue {
  data: AppData
  currentUser: User | null
  loading: boolean
  login: (login: string, password: string) => Promise<{ error: string } | { user: User }>
  logout: () => void
  createUser: (
    fields: RegisterFields & { role: Exclude<Role, 'admin'> }
  ) => Promise<string | null>
  refresh: () => Promise<void>
  updateProfile: (
    fields: Partial<
      Pick<
        User,
        | 'fullName'
        | 'login'
        | 'bio'
        | 'group'
        | 'specialty'
        | 'course'
        | 'academicYear'
        | 'disciplineIds'
        | 'enabledAssignmentTypes'
      >
    >
  ) => Promise<void>
  setEnabledAssignmentTypes: (types: AssignmentType[]) => Promise<void>
  addSubject: (title: string, description: string, color?: string) => Promise<void>
  updateSubject: (subject: Subject) => Promise<void>
  deleteSubject: (subjectId: string) => Promise<void>
  addStudentToSubject: (subjectId: string, studentId: string) => Promise<void>
  removeStudentFromSubject: (subjectId: string, studentId: string) => Promise<void>
  assignStudentToTeacher: (studentId: string, teacherId: string) => Promise<void>
  createAssignment: (
    subjectId: string,
    fields: Omit<Assignment, 'id' | 'subjectId' | 'createdAt'>
  ) => Promise<void>
  updateAssignment: (assignment: Assignment) => Promise<void>
  deleteAssignment: (assignmentId: string) => Promise<void>
  submitWork: (
    assignmentId: string,
    content: string,
    options?: { answers?: string; attachments?: Attachment[] }
  ) => Promise<void>
  gradeSubmission: (
    submissionId: string,
    payload: { gradeMode: GradeMode; score?: number; passed?: boolean; feedback: string }
  ) => Promise<void>
  returnSubmission: (submissionId: string, feedback: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  addAnnouncement: (
    title: string,
    body: string,
    audience: AnnouncementAudience,
    group?: string,
    pinned?: boolean
  ) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  getOrCreateChatThread: (otherUserId: string, subjectId?: string) => Promise<string>
  sendChatMessage: (threadId: string, body: string) => Promise<void>
  markThreadRead: (threadId: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [data, setData] = useState<AppData>(emptyData)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setData(emptyData)
      setCurrentUser(null)
      return
    }
    const next = await api.getData()
    setData(next)
    setCurrentUser((prev) => {
      if (!prev) return prev
      return next.users.find((u) => u.id === prev.id) || prev
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!getToken()) return
        const { user } = await api.me()
        const next = await api.getData()
        if (cancelled) return
        setCurrentUser(user)
        setData(next)
      } catch {
        setToken(null)
        if (!cancelled) {
          setCurrentUser(null)
          setData(emptyData)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Poll for updates (chat/notifications) while logged in
  useEffect(() => {
    if (!currentUser) return
    const id = window.setInterval(() => {
      refresh().catch(() => undefined)
    }, 8000)
    return () => window.clearInterval(id)
  }, [currentUser, refresh])

  const login = useCallback(
    async (loginName: string, password: string) => {
      try {
        const result = await api.login(loginName, password)
        setToken(result.token)
        const next = await api.getData()
        setCurrentUser(result.user)
        setData(next)
        toast(`Добро пожаловать, ${result.user.fullName.split(' ')[0]}!`)
        return { user: result.user }
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Ошибка входа' }
      }
    },
    [toast]
  )

  const logout = useCallback(() => {
    setToken(null)
    setCurrentUser(null)
    setData(emptyData)
    toast('Вы вышли из системы', 'info')
  }, [toast])

  const createUser = useCallback(
    async (fields: RegisterFields & { role: Exclude<Role, 'admin'> }) => {
      try {
        const result = await api.createUser({ ...fields, personalDataConsent: true })
        setData(result.data)
        toast(`Пользователь ${fields.fullName} добавлен`)
        return null
      } catch (e) {
        return e instanceof Error ? e.message : 'Ошибка'
      }
    },
    [toast]
  )

  const updateProfile = useCallback(
    async (
      fields: Partial<
        Pick<
          User,
          | 'fullName'
          | 'login'
          | 'bio'
          | 'group'
          | 'specialty'
          | 'course'
          | 'academicYear'
          | 'disciplineIds'
          | 'enabledAssignmentTypes'
        >
      >
    ) => {
      try {
        const result = await api.updateProfile(fields)
        setData(result.data)
        setCurrentUser(result.user)
        toast('Профиль сохранён')
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Ошибка сохранения', 'error')
      }
    },
    [toast]
  )

  const setEnabledAssignmentTypes = useCallback(
    async (types: AssignmentType[]) => {
      await updateProfile({ enabledAssignmentTypes: types })
    },
    [updateProfile]
  )

  const wrap = useCallback(
    async (fn: () => Promise<{ data: AppData }>, ok?: string, info?: boolean) => {
      try {
        const result = await fn()
        setData(result.data)
        setCurrentUser((prev) =>
          prev ? result.data.users.find((u) => u.id === prev.id) || prev : prev
        )
        if (ok) toast(ok, info ? 'info' : undefined)
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Ошибка', 'error')
      }
    },
    [toast]
  )

  const addSubject = useCallback(
    (title: string, description: string, color?: string) =>
      wrap(() => api.addSubject(title, description, color), 'Предмет создан'),
    [wrap]
  )

  const updateSubject = useCallback(
    (subject: Subject) =>
      wrap(
        () => api.updateSubject(subject.id, subject),
        'Предмет обновлён'
      ),
    [wrap]
  )

  const deleteSubject = useCallback(
    (subjectId: string) => wrap(() => api.deleteSubject(subjectId), 'Предмет удалён', true),
    [wrap]
  )

  const addStudentToSubject = useCallback(
    (subjectId: string, studentId: string) =>
      wrap(() => api.addStudentToSubject(subjectId, studentId), 'Студент добавлен к предмету'),
    [wrap]
  )

  const removeStudentFromSubject = useCallback(
    (subjectId: string, studentId: string) =>
      wrap(() => api.removeStudentFromSubject(subjectId, studentId), 'Студент убран с предмета', true),
    [wrap]
  )

  const assignStudentToTeacher = useCallback(
    (studentId: string, _teacherId: string) =>
      wrap(() => api.assignStudentToTeacher(studentId), 'Студент закреплён за вами'),
    [wrap]
  )

  const createAssignment = useCallback(
    (subjectId: string, fields: Omit<Assignment, 'id' | 'subjectId' | 'createdAt'>) =>
      wrap(() => api.createAssignment(subjectId, fields), 'Задание создано'),
    [wrap]
  )

  const updateAssignment = useCallback(
    (assignment: Assignment) =>
      wrap(
        () => api.updateAssignment(assignment.id, assignment),
        'Задание обновлено'
      ),
    [wrap]
  )

  const deleteAssignment = useCallback(
    (assignmentId: string) =>
      wrap(() => api.deleteAssignment(assignmentId), 'Задание удалено', true),
    [wrap]
  )

  const submitWork = useCallback(
    async (
      assignmentId: string,
      content: string,
      options?: { answers?: string; attachments?: Attachment[] }
    ) => {
      await wrap(
        () =>
          api.submitWork(assignmentId, {
            content,
            answers: options?.answers,
            attachments: options?.attachments,
          }),
        'Работа отправлена на проверку'
      )
    },
    [wrap]
  )

  const gradeSubmission = useCallback(
    async (
      submissionId: string,
      payload: { gradeMode: GradeMode; score?: number; passed?: boolean; feedback: string }
    ) => {
      await wrap(() => api.gradeSubmission(submissionId, payload), 'Оценка сохранена')
    },
    [wrap]
  )

  const returnSubmission = useCallback(
    async (submissionId: string, feedback: string) => {
      await wrap(() => api.returnSubmission(submissionId, feedback), 'Работа возвращена студенту', true)
    },
    [wrap]
  )

  const deleteUser = useCallback(
    (userId: string) => wrap(() => api.deleteUser(userId), 'Пользователь удалён', true),
    [wrap]
  )

  const addAnnouncement = useCallback(
    async (
      title: string,
      body: string,
      audience: AnnouncementAudience,
      group?: string,
      pinned = false
    ) => {
      await wrap(
        () => api.addAnnouncement({ title, body, audience, group, pinned }),
        'Объявление опубликовано'
      )
    },
    [wrap]
  )

  const deleteAnnouncement = useCallback(
    (id: string) => wrap(() => api.deleteAnnouncement(id), 'Объявление удалено', true),
    [wrap]
  )

  const markNotificationRead = useCallback(
    async (id: string) => {
      try {
        const result = await api.markNotificationRead(id)
        setData(result.data)
      } catch {
        /* ignore */
      }
    },
    []
  )

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const result = await api.markAllNotificationsRead()
      setData(result.data)
    } catch {
      /* ignore */
    }
  }, [])

  const getOrCreateChatThread = useCallback(async (otherUserId: string, subjectId?: string) => {
    const result = await api.getOrCreateChatThread(otherUserId, subjectId)
    setData(result.data)
    return result.threadId
  }, [])

  const sendChatMessage = useCallback(
    async (threadId: string, body: string) => {
      await wrap(() => api.sendChatMessage(threadId, body))
    },
    [wrap]
  )

  const markThreadRead = useCallback(async (threadId: string) => {
    try {
      const result = await api.markThreadRead(threadId)
      setData(result.data)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      data,
      currentUser,
      loading,
      login,
      logout,
      createUser,
      refresh,
      updateProfile,
      setEnabledAssignmentTypes,
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
      getOrCreateChatThread,
      sendChatMessage,
      markThreadRead,
    }),
    [
      data,
      currentUser,
      loading,
      login,
      logout,
      createUser,
      refresh,
      updateProfile,
      setEnabledAssignmentTypes,
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
      getOrCreateChatThread,
      sendChatMessage,
      markThreadRead,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
