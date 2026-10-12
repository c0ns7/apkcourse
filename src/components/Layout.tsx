import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
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
  { to: '/student/chat', label: 'Чаты', icon: 'chat' },
]

const teacherNav: NavItem[] = [
  { to: '/teacher', label: 'Кабинет', icon: 'home', end: true },
  { to: '/teacher/subjects', label: 'Предметы', icon: 'book' },
  { to: '/teacher/students', label: 'Студенты', icon: 'users' },
  { to: '/teacher/grading', label: 'Проверка', icon: 'check' },
  { to: '/teacher/announcements', label: 'Объявления', icon: 'megaphone' },
  { to: '/teacher/chat', label: 'Чаты', icon: 'chat' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Панель', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Пользователи', icon: 'user' },
  { to: '/admin/announcements', label: 'Объявления', icon: 'megaphone' },
]

export function Layout() {
  const { currentUser, logout, data, markAllNotificationsRead } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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
      <header className="sg-header">
        <nav className={`sg-menu ${menuOpen ? 'open' : ''}`}>
          <Link
            to={nav[0].to}
            className="sg-home"
            title="На главную"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="home" size={22} />
          </Link>

          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sg-item ${isActive ? 'current' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              {item.to === '/teacher/grading' && gradingCount > 0 && (
                <span className="sg-badge">{gradingCount}</span>
              )}
            </NavLink>
          ))}

          <div className="sg-user">
            <Link
              to="/notifications"
              className="sg-icon-btn"
              onClick={() => {
                markAllNotificationsRead()
                setMenuOpen(false)
              }}
              aria-label="Уведомления"
            >
              <Icon name="bell" size={18} />
              {unread > 0 && <span className="notification-dot" />}
            </Link>
            <NavLink to="/profile" className="sg-user-link" onClick={() => setMenuOpen(false)}>
              {currentUser.fullName.split(' ')[0]}
              <small>{roleLabels[currentUser.role]}</small>
            </NavLink>
            <button type="button" className="sg-logout" onClick={handleLogout}>
              Выход
            </button>
          </div>
        </nav>

        <button
          type="button"
          className="sg-burger"
          aria-label="Меню"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon name="menu" size={22} />
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="sg-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
