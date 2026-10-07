export type Role = 'student' | 'teacher' | 'admin'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'returned'

export interface User {
  id: string
  phone: string
  password: string
  fullName: string
  role: Role
  group?: string
  teacherId?: string
  email?: string
  bio?: string
  createdAt?: string
}

export interface Subject {
  id: string
  title: string
  description: string
  teacherId: string
  studentIds: string[]
  color?: string
}

export interface Assignment {
  id: string
  subjectId: string
  title: string
  description: string
  deadline: string
  maxScore: number
  createdAt: string
  type?: 'essay' | 'test' | 'practical' | 'project'
  attachmentName?: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  content: string
  attachmentName?: string
  status: SubmissionStatus
  score?: number
  feedback?: string
  submittedAt?: string
  gradedAt?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  authorId: string
  subjectId?: string
  createdAt: string
  pinned?: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export interface ScheduleItem {
  id: string
  subjectId: string
  group: string
  day: number
  timeStart: string
  timeEnd: string
  room: string
}

export interface AppData {
  users: User[]
  subjects: Subject[]
  assignments: Assignment[]
  submissions: Submission[]
  announcements: Announcement[]
  notifications: Notification[]
  schedule: ScheduleItem[]
}
