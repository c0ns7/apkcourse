import type { ComponentType } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageCircle,
  Moon,
  Paperclip,
  Search,
  Settings,
  Sun,
  User,
  Users,
  type LucideProps,
} from 'lucide-react'

export type IconName =
  | 'home'
  | 'dashboard'
  | 'book'
  | 'chart'
  | 'calendar'
  | 'megaphone'
  | 'bell'
  | 'check'
  | 'users'
  | 'user'
  | 'settings'
  | 'file'
  | 'clock'
  | 'alert'
  | 'inbox'
  | 'paperclip'
  | 'menu'
  | 'moon'
  | 'sun'
  | 'search'
  | 'student'
  | 'teacher'
  | 'chat'
  | 'eye'
  | 'eyeOff'
  | 'chevronDown'

const icons: Record<IconName, ComponentType<LucideProps>> = {
  home: Home,
  dashboard: LayoutDashboard,
  book: BookOpen,
  chart: BarChart3,
  calendar: Calendar,
  megaphone: Megaphone,
  bell: Bell,
  check: CheckCircle,
  users: Users,
  user: User,
  settings: Settings,
  file: FileText,
  clock: Clock,
  alert: AlertTriangle,
  inbox: Inbox,
  paperclip: Paperclip,
  menu: Menu,
  moon: Moon,
  sun: Sun,
  search: Search,
  student: GraduationCap,
  teacher: User,
  chat: MessageCircle,
  eye: Eye,
  eyeOff: EyeOff,
  chevronDown: ChevronDown,
}

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  const Comp = icons[name]
  return <Comp size={size} className={className} strokeWidth={strokeWidth} aria-hidden />
}
