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
  const [groupIds, setGroupIds] = useState<string[]>([])

  if (!currentUser) return null

  const groups = useMemo(
    () => [...data.groups].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [data.groups]
  )

  const items = [...data.announcements]
    .filter((a) => {
      if (currentUser.role === 'admin' || currentUser.role === 'teacher') return true
      if (a.audience === 'all') return true
      const ids = a.groupIds?.length
        ? a.groupIds
        : a.group
          ? [groups.find((g) => g.name === a.group)?.id].filter(Boolean) as string[]
          : []
      return Boolean(currentUser.groupId && ids.includes(currentUser.groupId))
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (audience === 'group' && !groupIds.length) return
    addAnnouncement(
      title.trim(),
      body.trim(),
      audience,
      audience === 'group' ? groupIds : undefined,
      pinned
    )
    setTitle('')
    setBody('')
    setPinned(false)
    setAudience('all')
    setGroupIds([])
    setShowModal(false)
  }

  const audienceLabel = (a: (typeof items)[0]) => {
    if (a.audience !== 'group') return 'Для всех'
    const names = (a.groupIds || [])
      .map((id) => groups.find((g) => g.id === id)?.name)
      .filter(Boolean)
    if (names.length) return names.join(', ')
    return a.group ? `Группа ${a.group}` : 'Группы'
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
                    <span className="badge badge-submitted">{audienceLabel(a)}</span>
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
                  <option value="group">Для выбран групп</option>
                </select>
              </div>
              {audience === 'group' && (
                <div className="form-group">
                  <label>Группы</label>
                  <div className="filter-chips" style={{ margin: 0 }}>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`chip ${groupIds.includes(g.id) ? 'active' : ''}`}
                        onClick={() => toggleGroup(g.id)}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                  {!groups.length && (
                    <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Сначала создайте группы</p>
                  )}
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={audience === 'group' && !groupIds.length}
                >
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
