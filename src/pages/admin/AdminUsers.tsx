import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Avatar } from '../../components/Avatar'
import type { Role } from '../../types'
import { formatPhoneDisplay, normalizePhone } from '../../utils/helpers'

const roleLabels = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' }

export function AdminUsers() {
  const { data, deleteUser, createUser } = useApp()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all')
  const [showForm, setShowForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('student')
  const [group, setGroup] = useState('')
  const [formError, setFormError] = useState('')

  const filtered = data.users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      u.fullName.toLowerCase().includes(q) ||
      normalizePhone(u.phone).includes(normalizePhone(search))
    )
  })

  const resetForm = () => {
    setFullName('')
    setPhone('')
    setPassword('')
    setRole('student')
    setGroup('')
    setFormError('')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const err = createUser({
      phone,
      password,
      fullName,
      role,
      group: role === 'student' ? group : undefined,
    })
    if (err) {
      setFormError(err)
      return
    }
    resetForm()
    setShowForm(false)
  }

  return (
    <div className="page">
      <PageHeader
        title="Пользователи"
        subtitle={`Всего: ${data.users.length}`}
        actions={
          <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Отмена' : 'Добавить пользователя'}
          </button>
        }
      />

      {showForm && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem' }}>Новый пользователь</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group">
              <label htmlFor="new-fullName">ФИО</label>
              <input
                id="new-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-phone">Телефон</label>
              <input
                id="new-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (924) 000-00-00"
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
              <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, 'admin'>)}>
                <option value="student">Студент</option>
                <option value="teacher">Преподаватель</option>
              </select>
            </div>
            {role === 'student' && (
              <div className="form-group">
                <label htmlFor="new-group">Группа</label>
                <input
                  id="new-group"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="ПД-21"
                />
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Создать
              </button>
            </div>
          </form>
        </div>
      )}

      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени или телефону..." />

      <div className="filter-chips">
        {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
          <button key={r} type="button" className={`chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
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
              <th>Телефон</th>
              <th>Роль</th>
              <th>Группа</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td><Avatar name={u.fullName} size={32} /></td>
                <td>{u.fullName}</td>
                <td>{formatPhoneDisplay(u.phone)}</td>
                <td><span className={`badge badge-${u.role}`}>{roleLabels[u.role]}</span></td>
                <td>{u.group || '—'}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`Удалить ${u.fullName}?`) && deleteUser(u.id)}
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
    </div>
  )
}
