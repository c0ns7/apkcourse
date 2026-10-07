import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'
import { Icon, type IconName } from './Icon'
import './Layout.css'

const roleLabels = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
}

type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

const studentNav: NavItem[] = [
  { to: '/student', label: 'Главная', icon: 'home', end: true },
  { to: '/student/assignments', label: 'Задания', icon: 'book' },
  { to: '/student/grades', label: 'Успеваемость', icon: 'chart' },
  { to: '/student/schedule', label: 'Расписание', icon: 'calendar' },
  { to: '/student/announcements', label: 'Объявления', icon: 'megaphone' },
]

const teacherNav: NavItem[] = [
  { to: '/teacher', label: 'Кабинет', icon: 'home', end: true },
  { to: '/teacher/subjects', label: 'Предметы', icon: 'book' },
  { to: '/teacher/students', label: 'Студенты', icon: 'users' },
  { to: '/teacher/grading', label: 'Проверка', icon: 'check' },
  { to: '/teacher/announcements', label: 'Объявления', icon: 'megaphone' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Панель', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Пользователи', icon: 'user' },
  { to: '/admin/announcements', label: 'Объявления', icon: 'megaphone' },
]

export function Layout() {
  const { currentUser, logout, data, markAllNotificationsRead } = useApp()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!currentUser) return null

  const nav =
    currentUser.role === 'student'
      ? studentNav
      : currentUser.role === 'teacher'
        ? teacherNav
        : adminNav

  const unread = data.notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length

  const gradingCount =
    currentUser.role === 'teacher'
      ? data.submissions.filter((sub) => {
          if (sub.status !== 'submitted') return false
          const a = data.assignments.find((x) => x.id === sub.assignmentId)
          const s = a ? data.subjects.find((x) => x.id === a.subjectId) : null
          return s?.teacherId === currentUser.id
        }).length
      : 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to={nav[0].to} className="sidebar-brand" onClick={() => setSidebarOpen(false)}>
          <span className="logo-mark">АПК</span>
          <div className="sidebar-brand-text">
            <strong>АПК</strong>
            <small>им. Б. Ринчино</small>
          </div>
        </Link>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">
                <Icon name={item.icon} size={20} />
              </span>
              {item.label}
              {item.to === '/teacher/grading' && gradingCount > 0 && (
                <span className="sidebar-badge">{gradingCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-profile" onClick={() => setSidebarOpen(false)}>
            <Avatar name={currentUser.fullName} size={36} />
            <div>
              <strong>{currentUser.fullName.split(' ')[0]}</strong>
              <span>{roleLabels[currentUser.role]}</span>
            </div>
          </NavLink>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Меню"
          >
            <Icon name="menu" size={22} />
          </button>
          <div className="topbar-actions">
            <Link
              to="/notifications"
              className="topbar-btn"
              onClick={() => markAllNotificationsRead()}
              aria-label="Уведомления"
            >
              <Icon name="bell" size={20} />
              {unread > 0 && <span className="notification-dot" />}
            </Link>
            <button type="button" className="btn-ghost btn-sm" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
