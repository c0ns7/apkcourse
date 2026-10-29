import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { api } from '../../api'
import { formatDateTime } from '../../utils/helpers'

type ActivityLog = {
  id: string
  actorId?: string
  actorLogin: string
  actorName: string
  actorRole: string
  action: string
  details: string
  createdAt: string
}

const roleLabels: Record<string, string> = {
  teacher: 'Преподаватель',
  admin: 'Администратор',
}

export function AdminLogs() {
  const { currentUser } = useApp()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin'>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.getActivityLogs(400)
      setLogs(res.logs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!currentUser?.isRoot) return
    void load()
    const id = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(id)
  }, [currentUser?.isRoot, load])

  if (!currentUser?.isRoot) {
    return <Navigate to="/admin" replace />
  }

  const filtered = logs.filter((l) => {
    if (roleFilter !== 'all' && l.actorRole !== roleFilter) return false
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      l.actorName.toLowerCase().includes(q) ||
      l.actorLogin.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page">
      <PageHeader
        title="Журнал действий"
        subtitle="Действия преподавателей и администраторов"
        actions={
          <button type="button" className="btn-secondary btn-sm" onClick={() => void load()}>
            Обновить
          </button>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row" style={{ marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="filter-chips" style={{ margin: 0 }}>
          {(['all', 'teacher', 'admin'] as const).map((r) => (
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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск…"
          style={{ flex: 1, minWidth: 180, maxWidth: 320 }}
        />
      </div>

      <div className="card table-wrap">
        {loading && logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Загрузка…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Время</th>
                <th>Кто</th>
                <th>Роль</th>
                <th>Действие</th>
                <th>Детали</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</td>
                  <td>
                    <strong>{l.actorName}</strong>
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{l.actorLogin}</small>
                  </td>
                  <td>
                    <span className={`badge badge-${l.actorRole}`}>
                      {roleLabels[l.actorRole] || l.actorRole}
                    </span>
                  </td>
                  <td>{l.action}</td>
                  <td style={{ maxWidth: 280 }}>{l.details || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>Пока нет записей</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
