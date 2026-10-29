import type { AppData, User } from './types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || ''

const TOKEN_KEY = 'apk-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text || 'Ошибка сервера' }
  }

  if (!res.ok) {
    const err = (data as { error?: string })?.error || `Ошибка ${res.status}`
    throw new Error(err)
  }
  return data as T
}

export type AuthResponse = { token: string; user: User }
export type DataResponse = { data: AppData }
export type ProfileResponse = { user: User; data: AppData }

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  login: (login: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),
  me: () => request<{ user: User }>('/api/auth/me'),
  getData: () => request<AppData>('/api/data'),
  updateProfile: (fields: Record<string, unknown>) =>
    request<ProfileResponse>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),
  createUser: (fields: Record<string, unknown>) =>
    request<DataResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(fields),
    }),
  deleteUser: (id: string) =>
    request<DataResponse>(`/api/users/${id}`, { method: 'DELETE' }),
  addSubject: (title: string, description: string, color?: string) =>
    request<DataResponse>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ title, description, color }),
    }),
  updateSubject: (id: string, subject: object) =>
    request<DataResponse>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject),
    }),
  deleteSubject: (id: string) =>
    request<DataResponse>(`/api/subjects/${id}`, { method: 'DELETE' }),
  addStudentToSubject: (subjectId: string, studentId: string) =>
    request<DataResponse>(`/api/subjects/${subjectId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  removeStudentFromSubject: (subjectId: string, studentId: string) =>
    request<DataResponse>(`/api/subjects/${subjectId}/students/${studentId}`, {
      method: 'DELETE',
    }),
  assignStudentToTeacher: (studentId: string) =>
    request<DataResponse>(`/api/students/${studentId}/assign-teacher`, {
      method: 'POST',
    }),
  createAssignment: (subjectId: string, fields: object) =>
    request<DataResponse>(`/api/subjects/${subjectId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),
  updateAssignment: (id: string, fields: object) =>
    request<DataResponse>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    }),
  deleteAssignment: (id: string) =>
    request<DataResponse>(`/api/assignments/${id}`, { method: 'DELETE' }),
  submitWork: (assignmentId: string, body: Record<string, unknown>) =>
    request<DataResponse>(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  gradeSubmission: (id: string, payload: Record<string, unknown>) =>
    request<DataResponse>(`/api/submissions/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  returnSubmission: (id: string, feedback: string) =>
    request<DataResponse>(`/api/submissions/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  addAnnouncement: (body: Record<string, unknown>) =>
    request<DataResponse>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteAnnouncement: (id: string) =>
    request<DataResponse>(`/api/announcements/${id}`, { method: 'DELETE' }),
  markNotificationRead: (id: string) =>
    request<DataResponse>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<DataResponse>('/api/notifications/read-all', { method: 'POST' }),
  getOrCreateChatThread: (otherUserId: string, subjectId?: string) =>
    request<{ threadId: string; data: AppData }>('/api/chat/threads', {
      method: 'POST',
      body: JSON.stringify({ otherUserId, subjectId }),
    }),
  sendChatMessage: (threadId: string, body: string) =>
    request<DataResponse>(`/api/chat/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  markThreadRead: (threadId: string) =>
    request<DataResponse>(`/api/chat/threads/${threadId}/read`, { method: 'POST' }),
  upload: async (file: File, kind = 'file') => {
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)
    return request<{ attachment: { id: string; kind: string; name: string; url: string } }>(
      '/api/upload',
      { method: 'POST', body: form }
    )
  },
}

export const emptyData: AppData = {
  users: [],
  subjects: [],
  assignments: [],
  submissions: [],
  announcements: [],
  notifications: [],
  schedule: [],
  chatThreads: [],
  chatMessages: [],
  disciplineCatalog: [],
}
