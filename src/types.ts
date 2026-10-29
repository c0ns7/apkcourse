export type Role = 'student' | 'teacher' | 'admin'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'returned'

export type AssignmentType =
  | 'essay'
  | 'test'
  | 'table'
  | 'scheme'
  | 'matching'
  | 'qa'
  | 'quiz'
  | 'distribution'
  | 'practical'
  | 'other'

export type AttachmentKind = 'link' | 'file' | 'image' | 'presentation'

export type GradeMode = 'score' | 'pass_fail'

export type AnnouncementAudience = 'all' | 'group'

export interface Attachment {
  id: string
  kind: AttachmentKind
  name: string
  url?: string
}

export interface MatchingPair {
  left: string
  right: string
}

export interface QuizQuestion {
  question: string
  options?: string[]
}

export interface AssignmentPayload {
  pairs?: MatchingPair[]
  questions?: QuizQuestion[]
  items?: string[]
  columns?: string[]
}

export interface User {
  id: string
  login: string
  /** Only used client-side when creating accounts; never returned by API */
  password?: string
  fullName: string
  role: Role
  group?: string
  teacherId?: string
  specialty?: string
  course?: number
  academicYear?: string
  disciplineIds?: string[]
  /** Названия дисциплин (при регистрации, если предмета ещё нет) */
  disciplines?: string[]
  personalDataConsent?: boolean
  enabledAssignmentTypes?: AssignmentType[]
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
  type?: AssignmentType
  attachments?: Attachment[]
  payload?: AssignmentPayload
  /** @deprecated migrated to attachments */
  attachmentName?: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  content: string
  answers?: string
  attachments?: Attachment[]
  /** @deprecated migrated to attachments */
  attachmentName?: string
  status: SubmissionStatus
  gradeMode?: GradeMode
  score?: number
  passed?: boolean
  feedback?: string
  submittedAt?: string
  gradedAt?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  authorId: string
  audience: AnnouncementAudience
  group?: string
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

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  body: string
  createdAt: string
  read: boolean
}

export interface ChatThread {
  id: string
  studentId: string
  teacherId: string
  subjectId?: string
  updatedAt: string
}

export interface AppData {
  users: User[]
  subjects: Subject[]
  assignments: Assignment[]
  submissions: Submission[]
  announcements: Announcement[]
  notifications: Notification[]
  schedule: ScheduleItem[]
  chatThreads: ChatThread[]
  chatMessages: ChatMessage[]
  disciplineCatalog: string[]
}
