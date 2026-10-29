import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Avatar } from '../../components/Avatar'
import type { Role } from '../../types'
import {
  ACADEMIC_YEARS,
  CURRENT_ACADEMIC_YEAR,
  SPECIALTIES,
} from '../../utils/helpers'

const roleLabels = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' }

export function AdminUsers() {
  const { data, deleteUser, createUser, currentUser } = useApp()
  const isRoot = Boolean(currentUser?.isRoot)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all')
  const [showModal, setShowModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [group, setGroup] = useState('')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [course, setCourse] = useState(1)
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = data.users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
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
    setRole('student')
    setGroup('')
    setSpecialty(SPECIALTIES[0])
    setCourse(1)
    setAcademicYear(CURRENT_ACADEMIC_YEAR)
    setFormError('')
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      const err = await createUser({
        login,
        password,
        fullName,
        role,
        group: role === 'student' ? group : undefined,
        specialty: role === 'student' ? specialty : undefined,
        course: role === 'student' ? course : undefined,
        academicYear: role === 'student' || role === 'teacher' ? academicYear : academicYear,
        personalDataConsent: true,
      })
      if (err) {
        setFormError(err)
        return
      }
      closeModal()
    } finally {
      setBusy(false)
    }
  }

  const canDelete = (u: (typeof data.users)[0]) => {
    if (u.id === currentUser?.id) return false
    if (u.isRoot) return false
    if (u.role === 'admin' && !isRoot) return false
    return true
  }

  return (
    <div className="page">
      <PageHeader
        title="Пользователи"
        subtitle={`Всего: ${data.users.length}`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
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
              <th>Роль</th>
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
                  <span className={`badge badge-${u.role}`}>{roleLabels[u.role]}</span>
                </td>
                <td>{u.group || '—'}</td>
                <td>{u.academicYear || '—'}</td>
                <td>
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
          >
            <h2 id="add-user-title">Новый пользователь</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="new-fullName">ФИО</label>
                <input
                  id="new-fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-login">Логин</label>
                <input
                  id="new-login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">Пароль</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-role">Роль</label>
                <select
                  id="new-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  {isRoot && <option value="admin">Администратор</option>}
                </select>
              </div>
              {(role === 'student' || role === 'teacher') && (
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
              {role === 'student' && (
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
                    <label htmlFor="new-group">Группа</label>
                    <input
                      id="new-group"
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
                  {busy ? 'Создание…' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
