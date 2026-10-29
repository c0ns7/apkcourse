import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Role } from '../types'
import { roleHomePath, userRoles } from '../utils/helpers'
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
  const { currentUser, logout, data, markAllNotificationsRead, switchRole } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const roleMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setRoleMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!roleMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRoleMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [roleMenuOpen])

  if (!currentUser) return null

  const availableRoles = userRoles(currentUser)
  const canSwitchRole = availableRoles.length > 1

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

  const handleSwitchRole = async (role: Role) => {
    if (role === currentUser.role) {
      setRoleMenuOpen(false)
      return
    }
    const err = await switchRole(role)
    setRoleMenuOpen(false)
    if (!err) navigate(roleHomePath[role])
  }

  const roleSwitcher = canSwitchRole ? (
    <div className="sg-role-switch" ref={roleMenuRef}>
      <button
        type="button"
        className={`sg-user-chip sg-role-trigger ${roleMenuOpen ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={roleMenuOpen}
        onClick={() => setRoleMenuOpen((v) => !v)}
      >
        <span className="sg-role-trigger-text">
          <span className="sg-role-name">{currentUser.fullName.split(' ')[0]}</span>
          <span className="sg-role-label">{roleLabels[currentUser.role]}</span>
        </span>
        <Icon name="chevronDown" size={16} strokeWidth={2.25} />
      </button>
      {roleMenuOpen && (
        <ul className="sg-role-menu" role="listbox" aria-label="Сменить роль">
          {availableRoles.map((r) => (
            <li key={r}>
              <button
                type="button"
                role="option"
                aria-selected={r === currentUser.role}
                className={r === currentUser.role ? 'active' : ''}
                onClick={() => void handleSwitchRole(r)}
              >
                {roleLabels[r]}
              </button>
            </li>
          ))}
          <li className="sg-role-menu-sep">
            <Link to="/profile" onClick={() => setRoleMenuOpen(false)}>
              Профиль
            </Link>
          </li>
        </ul>
      )}
    </div>
  ) : (
    <Link to="/profile" className="sg-user-chip sg-desktop-only">
      {currentUser.fullName.split(' ')[0]}
    </Link>
  )

  return (
    <div
      className={`app-shell${currentUser.role === 'admin' ? ' app-shell--admin' : ''}`}
    >
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
            <div className="sg-desktop-only">{roleSwitcher}</div>
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
          {canSwitchRole && (
            <div className="sg-drawer-roles">
              <span className="sg-drawer-roles-label">Режим</span>
              <div className="sg-drawer-role-chips">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`sg-drawer-role-chip ${r === currentUser.role ? 'active' : ''}`}
                    onClick={() => {
                      closeMenu()
                      void handleSwitchRole(r)
                    }}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
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
