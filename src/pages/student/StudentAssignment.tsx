import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { Attachment } from '../../types'
import { AttachmentEditor } from '../../components/AttachmentEditor'
import { AttachmentList } from '../../components/AttachmentFile'
import { DeadlineBadge } from '../../components/DeadlineBadge'
import {
  assignmentTypeLabels,
  formatDate,
  formatDateTime,
  formatGrade,
  GRADE_MAX,
  gradePercent,
} from '../../utils/helpers'

export function StudentAssignment() {
  const { id } = useParams<{ id: string }>()
  const { data, currentUser, submitWork } = useApp()
  const [content, setContent] = useState('')
  const [answers, setAnswers] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
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
  const type = assignment.type

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim() || answers.trim()
    if (!text && attachments.length === 0) return
    submitWork(id, content.trim(), {
      answers: answers.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          {type && (
            <span className="badge" style={{ background: 'var(--accent-soft)', color: '#78350f' }}>
              {assignmentTypeLabels[type]}
            </span>
          )}
          <DeadlineBadge deadline={assignment.deadline} />
        </div>
        <h1>{assignment.title}</h1>
        <p>
          Срок: {formatDate(assignment.deadline)}
          {teacher && ` · ${teacher.fullName}`}
          {teacher && (
            <>
              {' · '}
              <Link to="/student/chat">Написать преподавателю</Link>
            </>
          )}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginTop: 0 }}>Описание задания</h3>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{assignment.description}</p>
        <AttachmentList items={assignment.attachments} />

        {assignment.payload?.pairs && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Пары для соответствий</h4>
            <ul>
              {assignment.payload.pairs.map((p, i) => (
                <li key={i}>
                  {p.left} — ???
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Варианты справа: {assignment.payload.pairs.map((p) => p.right).join(', ')}
            </p>
          </div>
        )}
        {assignment.payload?.questions && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Вопросы</h4>
            <ol>
              {assignment.payload.questions.map((q, i) => (
                <li key={i}>
                  {q.question}
                  {q.options && (
                    <ul>
                      {q.options.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
        {assignment.payload?.items && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Элементы для распределения</h4>
            <ul>
              {assignment.payload.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
            Результат: {formatGrade(submission)}
            {submission.gradeMode !== 'pass_fail' && submission.score != null
              ? ` / ${GRADE_MAX}`
              : ''}
          </h3>
          {submission.gradeMode !== 'pass_fail' && submission.score != null && (
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${gradePercent(submission.score)}%` }}
              />
            </div>
          )}
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
            {(type === 'essay' ||
              type === 'practical' ||
              type === 'table' ||
              type === 'scheme' ||
              type === 'other' ||
              !type) && (
              <div className="form-group">
                <label htmlFor="content">Текст ответа</label>
                <textarea
                  id="content"
                  rows={8}
                  value={content || submission?.content || ''}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Опишите выполненную работу..."
                />
              </div>
            )}

            {(type === 'qa' ||
              type === 'test' ||
              type === 'quiz' ||
              type === 'matching' ||
              type === 'distribution') && (
              <div className="form-group">
                <label htmlFor="answers">
                  {type === 'matching'
                    ? 'Ваши соответствия (Левое — Правое)'
                    : type === 'distribution'
                      ? 'Как распределили элементы'
                      : 'Ответы на вопросы'}
                </label>
                <textarea
                  id="answers"
                  rows={8}
                  value={answers || submission?.answers || ''}
                  onChange={(e) => setAnswers(e.target.value)}
                  placeholder="Введите ответы..."
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Вложения к работе</label>
              <AttachmentEditor value={attachments} onChange={setAttachments} />
            </div>
            <button type="submit" className="btn-primary">
              Отправить на проверку
            </button>
          </form>
        ) : (
          <>
            {submission?.content && (
              <p style={{ whiteSpace: 'pre-wrap' }}>{submission.content}</p>
            )}
            {submission?.answers && (
              <p style={{ whiteSpace: 'pre-wrap' }}>
                <strong>Ответы:</strong>
                {'\n'}
                {submission.answers}
              </p>
            )}
            <AttachmentList items={submission?.attachments} />
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
