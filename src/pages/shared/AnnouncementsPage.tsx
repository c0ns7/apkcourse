import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { AnnouncementAudience } from '../../types'
import { PageHeader } from '../../components/PageHeader'
import { formatDateTime } from '../../utils/helpers'
import { EmptyState } from '../../components/EmptyState'

export function AnnouncementsPage({ canCreate = false }: { canCreate?: boolean }) {
  const { data, currentUser, addAnnouncement, deleteAnnouncement } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [group, setGroup] = useState('')

  if (!currentUser) return null

  const groups = useMemo(() => {
    const set = new Set(
      data.users
        .filter((u) => (u.role === 'student' || u.roles?.includes('student')) && u.group)
        .map((u) => u.group!)
    )
    return Array.from(set).sort()
  }, [data.users])

  const items = [...data.announcements]
    .filter((a) => {
      if (currentUser.role === 'admin' || currentUser.role === 'teacher') return true
      if (a.audience === 'all') return true
      return a.group && a.group === currentUser.group
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (audience === 'group' && !group) return
    addAnnouncement(title.trim(), body.trim(), audience, audience === 'group' ? group : undefined, pinned)
    setTitle('')
    setBody('')
    setPinned(false)
    setAudience('all')
    setGroup('')
    setShowModal(false)
  }

  return (
    <div className="page">
      <PageHeader
        title="Объявления"
        subtitle="Новости и важная информация колледжа"
        actions={
          canCreate ? (
            <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
              + Создать
            </button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon="megaphone" title="Нет объявлений" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((a) => {
            const author = data.users.find((u) => u.id === a.authorId)
            const canDelete = currentUser.role === 'admin' || a.authorId === currentUser.id
            return (
              <article key={a.id} className={`card announcement-card ${a.pinned ? 'pinned' : ''}`}>
                <div className="announcement-header">
                  {a.pinned && <span className="badge badge-accent">Закреплено</span>}
                  {a.audience === 'group' ? (
                    <span className="badge badge-submitted">Группа {a.group}</span>
                  ) : (
                    <span className="badge">Для всех</span>
                  )}
                  <h3 style={{ margin: '0.5rem 0' }}>{a.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {author?.fullName} · {formatDateTime(a.createdAt)}
                  </p>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', margin: '1rem 0 0' }}>{a.body}</p>
                {canDelete && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', marginTop: '0.75rem' }}
                    onClick={() => deleteAnnouncement(a.id)}
                  >
                    Удалить
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новое объявление</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Заголовок</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Текст</label>
                <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Аудитория</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                >
                  <option value="all">Для всех</option>
                  <option value="group">Для группы</option>
                </select>
              </div>
              {audience === 'group' && (
                <div className="form-group">
                  <label>Группа</label>
                  <select value={group} onChange={(e) => setGroup(e.target.value)} required>
                    <option value="">Выберите группу...</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="check-option" style={{ marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                <span className="check-mark" aria-hidden />
                <span className="check-option-text">
                  Закрепить объявление
                  <small>Будет показано выше остальных</small>
                </span>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
