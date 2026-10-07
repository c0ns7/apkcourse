import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AttachmentFile } from '../../components/AttachmentFile'
import { DeadlineBadge } from '../../components/DeadlineBadge'
import { assignmentTypeLabels, formatDate, formatDateTime, GRADE_MAX, gradePercent } from '../../utils/helpers'

export function StudentAssignment() {
  const { id } = useParams<{ id: string }>()
  const { data, currentUser, submitWork } = useApp()
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState('')
  const [saved, setSaved] = useState(false)

  if (!currentUser || !id) return null

  const assignment = data.assignments.find((a) => a.id === id)
  const subject = assignment ? data.subjects.find((s) => s.id === assignment.subjectId) : null
  const teacher = subject ? data.users.find((u) => u.id === subject.teacherId) : null
  const submission = data.submissions.find(
    (s) => s.assignmentId === id && s.studentId === currentUser.id
  )

  if (!assignment) {
    return (
      <div className="page">
        <p>Задание не найдено</p>
        <Link to="/student/assignments">← Назад</Link>
      </div>
    )
  }

  const canEdit = !submission || submission.status === 'pending' || submission.status === 'returned'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    submitWork(id, content.trim(), attachment.trim() || undefined)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachment(file.name)
  }

  return (
    <div className="page">
      <nav className="breadcrumbs">
        <Link to="/student">Главная</Link>
        <span>/</span>
        <Link to="/student/assignments">Задания</Link>
        <span>/</span>
        <span>{assignment.title}</span>
      </nav>

      <header className="page-header">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span className="badge badge-submitted">{subject?.title}</span>
          {assignment.type && (
            <span className="badge" style={{ background: 'var(--accent-soft)', color: '#78350f' }}>
              {assignmentTypeLabels[assignment.type]}
            </span>
          )}
          <DeadlineBadge deadline={assignment.deadline} />
        </div>
        <h1>{assignment.title}</h1>
        <p>
          Срок: {formatDate(assignment.deadline)} · оценка по шкале 2–5
          {teacher && ` · ${teacher.fullName}`}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginTop: 0 }}>Описание задания</h3>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{assignment.description}</p>
        {assignment.attachmentName && (
          <div style={{ marginTop: '1rem' }}>
            <AttachmentFile name={assignment.attachmentName} label="Материалы от преподавателя" />
          </div>
        )}
      </div>

      {submission?.status === 'returned' && (
        <div className="alert alert-error">
          <strong>На доработку:</strong> {submission.feedback}
        </div>
      )}

      {submission?.status === 'graded' && (
        <div className="card grade-result-card">
          <h3 style={{ marginTop: 0, color: 'var(--success)' }}>
            Оценка: {submission.score} / {GRADE_MAX}
          </h3>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${gradePercent(submission.score!)}%` }}
            />
          </div>
          {submission.feedback && (
            <p style={{ margin: '1rem 0 0' }}>
              <strong>Комментарий:</strong> {submission.feedback}
            </p>
          )}
        </div>
      )}

      {submission?.status === 'submitted' && (
        <div className="alert alert-info">Работа на проверке у преподавателя</div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{canEdit ? 'Сдать работу' : 'Ваша работа'}</h3>
        {saved && <div className="alert alert-success">Отправлено на проверку!</div>}

        {canEdit ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="content">Текст ответа</label>
              <textarea
                id="content"
                rows={10}
                value={content || submission?.content || ''}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Опишите выполненную работу..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="file">Прикрепить файл (имитация)</label>
              <input id="file" type="file" onChange={handleFileChange} />
              {attachment && (
                <div style={{ marginTop: '0.5rem' }}>
                  <AttachmentFile name={attachment} label="Ваш файл" />
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary">Отправить на проверку</button>
          </form>
        ) : (
          <>
            <p style={{ whiteSpace: 'pre-wrap' }}>{submission?.content}</p>
            {submission?.attachmentName && (
              <AttachmentFile name={submission.attachmentName} label="Ваш файл" />
            )}
            {submission?.submittedAt && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Отправлено: {formatDateTime(submission.submittedAt)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
