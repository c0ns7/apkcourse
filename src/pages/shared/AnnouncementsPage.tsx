import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { formatDateTime } from '../../utils/helpers'
import { EmptyState } from '../../components/EmptyState'

export function AnnouncementsPage({ canCreate = false }: { canCreate?: boolean }) {
  const { data, currentUser, addAnnouncement, deleteAnnouncement } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)

  if (!currentUser) return null

  const items = [...data.announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addAnnouncement(title.trim(), body.trim(), undefined, pinned)
    setTitle('')
    setBody('')
    setPinned(false)
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
            const subject = a.subjectId ? data.subjects.find((s) => s.id === a.subjectId) : null
            const canDelete =
              currentUser.role === 'admin' || a.authorId === currentUser.id
            return (
              <article key={a.id} className={`card announcement-card ${a.pinned ? 'pinned' : ''}`}>
                <div className="announcement-header">
                  {a.pinned && <span className="badge badge-accent">Закреплено</span>}
                  <h3 style={{ margin: '0.5rem 0' }}>{a.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {author?.fullName}
                    {subject && ` · ${subject.title}`} · {formatDateTime(a.createdAt)}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                Закрепить
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn-primary">Опубликовать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
