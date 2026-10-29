import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Avatar } from '../../components/Avatar'
import type { Role, User } from '../../types'
import {
  ACADEMIC_YEARS,
  CURRENT_ACADEMIC_YEAR,
  SPECIALTIES,
  hasRole,
  userRoles,
} from '../../utils/helpers'

const roleLabels = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' }

export function AdminUsers() {
  const { data, deleteUser, createUser, updateUser, currentUser } = useApp()
  const isRoot = Boolean(currentUser?.isRoot)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<Role[]>(['student'])
  const [group, setGroup] = useState('')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [course, setCourse] = useState(1)
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = data.users.filter((u) => {
    if (roleFilter !== 'all' && !hasRole(u, roleFilter)) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      (u.group ?? '').toLowerCase().includes(q)
    )
  })

  const resetForm = () => {
    setFullName('')
    setLogin('')
    setPassword('')
    setRoles(['student'])
    setGroup('')
    setSpecialty(SPECIALTIES[0])
    setCourse(1)
    setAcademicYear(CURRENT_ACADEMIC_YEAR)
    setFormError('')
    setEditUserId(null)
  }

  const closeModal = () => {
    setModalMode(null)
    resetForm()
  }

  useEffect(() => {
    if (!modalMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalMode])

  const openCreate = () => {
    resetForm()
    setModalMode('create')
  }

  const openEdit = (u: User) => {
    setEditUserId(u.id)
    setFullName(u.fullName)
    setLogin(u.login)
    setPassword('')
    setRoles(userRoles(u))
    setGroup(u.group || '')
    setSpecialty(u.specialty || SPECIALTIES[0])
    setCourse(u.course || 1)
    setAcademicYear(u.academicYear || CURRENT_ACADEMIC_YEAR)
    setFormError('')
    setModalMode('edit')
  }

  const toggleRole = (r: Role) => {
    setRoles((prev) => {
      if (prev.includes(r)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== r)
      }
      return [...prev, r]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!roles.length) {
      setFormError('Выберите хотя бы одну роль')
      return
    }
    if (modalMode === 'create' && password.length < 6) {
      setFormError('Пароль не короче 6 символов')
      return
    }
    if (modalMode === 'edit' && password && password.length < 6) {
      setFormError('Новый пароль не короче 6 символов')
      return
    }

    const primary = roles.includes('admin')
      ? 'admin'
      : roles.includes('teacher')
        ? 'teacher'
        : 'student'

    const payload = {
      login,
      fullName,
      role: primary as Role,
      roles,
      group: roles.includes('student') ? group : undefined,
      specialty: roles.includes('student') ? specialty : undefined,
      course: roles.includes('student') ? course : undefined,
      academicYear,
      personalDataConsent: true as const,
    }

    setBusy(true)
    try {
      if (modalMode === 'create') {
        const err = await createUser({ ...payload, password })
        if (err) {
          setFormError(err)
          return
        }
      } else if (modalMode === 'edit' && editUserId) {
        const err = await updateUser(editUserId, {
          ...payload,
          ...(password ? { password } : {}),
        })
        if (err) {
          setFormError(err)
          return
        }
      }
      closeModal()
    } finally {
      setBusy(false)
    }
  }

  const canManage = (u: User) => {
    if (u.isRoot) return false
    if (hasRole(u, 'admin') && !isRoot) return false
    return true
  }

  const canDelete = (u: User) => {
    if (u.id === currentUser?.id) return false
    return canManage(u)
  }

  const creatableRoles: Role[] = isRoot
    ? ['student', 'teacher', 'admin']
    : ['student', 'teacher']

  const isEdit = modalMode === 'edit'

  return (
    <div className="page">
      <PageHeader
        title="Пользователи"
        subtitle={`Всего: ${data.users.length}`}
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            Добавить пользователя
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени, логину, группе..." />

      <div className="filter-chips">
        {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`chip ${roleFilter === r ? 'active' : ''}`}
            onClick={() => setRoleFilter(r)}
          >
            {r === 'all' ? 'Все' : roleLabels[r]}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Роли</th>
              <th>Группа</th>
              <th>Год</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <Avatar name={u.fullName} size={32} />
                </td>
                <td>
                  {u.fullName}
                  {u.isRoot ? ' (root)' : ''}
                </td>
                <td>{u.login}</td>
                <td>
                  <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {userRoles(u).map((r) => (
                      <span key={r} className={`badge badge-${r}`}>
                        {roleLabels[r]}
                      </span>
                    ))}
                  </span>
                </td>
                <td>{u.group || '—'}</td>
                <td>{u.academicYear || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {canManage(u) && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => openEdit(u)}
                    >
                      Редактировать
                    </button>
                  )}
                  {canDelete(u) && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`Удалить ${u.fullName}?`) && void deleteUser(u.id)}
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <h2 id="user-modal-title">{isEdit ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-group">
                <label htmlFor="user-fullName">ФИО</label>
                <input
                  id="user-fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-login">Логин</label>
                <input
                  id="user-login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-password">{isEdit ? 'Новый пароль' : 'Пароль'}</label>
                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={isEdit ? undefined : 6}
                  required={!isEdit}
                  placeholder={isEdit ? 'Оставьте пустым, чтобы не менять' : undefined}
                  autoComplete="new-password"
                />
                {isEdit && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', opacity: 0.75 }}>
                    Заполните только если нужно сменить пароль (от 6 символов)
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Роли</label>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', opacity: 0.75 }}>
                  Можно выбрать несколько — пользователь переключит режим в шапке
                </p>
                <div className="filter-chips" style={{ margin: 0 }}>
                  {creatableRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`chip ${roles.includes(r) ? 'active' : ''}`}
                      onClick={() => toggleRole(r)}
                    >
                      {roleLabels[r]}
                    </button>
                  ))}
                </div>
              </div>
              {(roles.includes('student') || roles.includes('teacher')) && (
                <div className="form-group">
                  <label>Учебный год</label>
                  <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {roles.includes('student') && (
                <>
                  <div className="form-group">
                    <label>Специальность</label>
                    <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Курс</label>
                    <select value={course} onChange={(e) => setCourse(Number(e.target.value))}>
                      {[1, 2, 3, 4].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="user-group">Группа</label>
                    <input
                      id="user-group"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="ПД-21"
                    />
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
