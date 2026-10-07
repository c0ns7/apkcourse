import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export function TeacherSubjects() {
  const { data, currentUser, addSubject } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  if (!currentUser) return null

  const mySubjects = data.subjects.filter((s) => s.teacherId === currentUser.id)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addSubject(title.trim(), description.trim())
    setTitle('')
    setDescription('')
    setShowModal(false)
  }

  return (
    <div className="page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Мои предметы</h1>
          <p>Создавайте предметы и добавляйте студентов</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
          + Новый предмет
        </button>
      </header>

      {mySubjects.length === 0 ? (
        <div className="card empty-state">
          <p>У вас пока нет предметов. Создайте первый предмет.</p>
        </div>
      ) : (
        <div className="grid-2">
          {mySubjects.map((s) => {
            const count = s.studentIds.length
            const assignCount = data.assignments.filter((a) => a.subjectId === s.id).length
            return (
              <Link
                key={s.id}
                to={`/teacher/subjects/${s.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ margin: '0 0 0.5rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                  {s.description || 'Без описания'}
                </p>
                <span style={{ fontSize: '0.85rem' }}>
                  {count} студент(ов) · {assignCount} заданий
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новый предмет</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="sub-title">Название</label>
                <input id="sub-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="sub-desc">Описание</label>
                <textarea id="sub-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
