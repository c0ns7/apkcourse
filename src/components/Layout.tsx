import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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

const rootExtraNav: NavItem[] = [
  { to: '/admin/logs', label: 'Журнал', icon: 'file' },
]

export function Layout() {
  const { currentUser, logout, data, markAllNotificationsRead } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  if (!currentUser) return null

  const nav =
    currentUser.role === 'student'
      ? studentNav
      : currentUser.role === 'teacher'
        ? teacherNav
        : currentUser.isRoot
          ? [...adminNav, ...rootExtraNav]
          : adminNav

  const mobileTabs = nav.slice(0, 4)

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
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-shell">
      <header className="sg-header">
        <div className="sg-topbar">
          <Link to={nav[0].to} className="sg-brand" onClick={closeMenu}>
            <span className="sg-brand-mark">АПК</span>
            <span className="sg-brand-text">Портал</span>
          </Link>

          <nav className="sg-desktop-nav" aria-label="Основное меню">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sg-item ${isActive ? 'current' : ''}`}
              >
                <Icon name={item.icon} size={16} strokeWidth={2} />
                <span>{item.label}</span>
                {item.to === '/teacher/grading' && gradingCount > 0 && (
                  <span className="sg-badge">{gradingCount}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sg-top-actions">
            <Link
              to="/notifications"
              className="sg-icon-btn"
              onClick={() => markAllNotificationsRead()}
              aria-label="Уведомления"
            >
              <Icon name="bell" size={20} />
              {unread > 0 && <span className="notification-dot" />}
            </Link>
            <Link to="/profile" className="sg-user-chip sg-desktop-only">
              {currentUser.fullName.split(' ')[0]}
            </Link>
            <button type="button" className="sg-logout sg-desktop-only" onClick={handleLogout}>
              Выход
            </button>
            <button
              type="button"
              className="sg-burger"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name="menu" size={22} />
              <span className="sg-burger-label">Меню</span>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer + backdrop outside header stacking context */}
      <div
        className={`sg-drawer-root ${menuOpen ? 'open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="sg-backdrop"
          aria-label="Закрыть меню"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <aside id="mobile-drawer" className="sg-drawer" role="dialog" aria-modal="true" aria-label="Меню">
          <div className="sg-drawer-head">
            <div>
              <strong>{currentUser.fullName}</strong>
              <span>{roleLabels[currentUser.role]}</span>
            </div>
            <button type="button" className="sg-drawer-close" onClick={closeMenu} aria-label="Закрыть">
              ✕
            </button>
          </div>
          <nav className="sg-drawer-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sg-drawer-link ${isActive ? 'current' : ''}`}
                onClick={closeMenu}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
                {item.to === '/teacher/grading' && gradingCount > 0 && (
                  <span className="sg-badge">{gradingCount}</span>
                )}
              </NavLink>
            ))}
            <NavLink to="/profile" className="sg-drawer-link" onClick={closeMenu}>
              <Icon name="user" size={20} />
              <span>Профиль</span>
            </NavLink>
            <NavLink to="/notifications" className="sg-drawer-link" onClick={closeMenu}>
              <Icon name="bell" size={20} />
              <span>Уведомления</span>
              {unread > 0 && <span className="sg-badge">{unread}</span>}
            </NavLink>
            <Link to="/privacy" className="sg-drawer-link" onClick={closeMenu}>
              <Icon name="file" size={20} />
              <span>Конфиденциальность</span>
            </Link>
          </nav>
          <button type="button" className="sg-drawer-logout" onClick={handleLogout}>
            Выйти из кабинета
          </button>
        </aside>
      </div>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="sg-bottom-nav" aria-label="Быстрая навигация">
        {mobileTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sg-bottom-link ${isActive ? 'current' : ''}`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
            {item.to === '/teacher/grading' && gradingCount > 0 && (
              <i className="sg-bottom-dot" aria-hidden />
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className={`sg-bottom-link ${menuOpen ? 'current' : ''}`}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" size={22} />
          <span>Ещё</span>
        </button>
      </nav>
    </div>
  )
}
