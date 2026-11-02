import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AttachmentList } from '../../components/AttachmentFile'
import { DeadlineBadge } from '../../components/DeadlineBadge'
import {
  assignmentTypeLabels,
  educationFormLabels,
  formatDate,
} from '../../utils/helpers'

/** Просмотр своего задания преподавателем (без сдачи) */
export function TeacherAssignmentView() {
  const { id } = useParams<{ id: string }>()
  const { data, currentUser } = useApp()

  if (!currentUser || !id) return null

  const assignment = data.assignments.find((a) => a.id === id)
  const subject = assignment ? data.subjects.find((s) => s.id === assignment.subjectId) : null

  if (!assignment || !subject || subject.teacherId !== currentUser.id) {
    return (
      <div className="page">
        <p>Задание не найдено</p>
        <Link to="/teacher/subjects">← К предметам</Link>
      </div>
    )
  }

  const module = assignment.moduleId
    ? data.modules.find((m) => m.id === assignment.moduleId)
    : null
  const groups = (assignment.groupIds || [])
    .map((gid) => data.groups.find((g) => g.id === gid)?.name)
    .filter(Boolean)
  const forms = assignment.educationForms || []
  const subs = data.submissions.filter((s) => s.assignmentId === assignment.id)
  const submitted = subs.filter((s) => s.status === 'submitted' || s.status === 'graded').length
  const graded = subs.filter((s) => s.status === 'graded').length

  return (
    <div className="page">
      <nav className="breadcrumbs">
        <Link to="/teacher">Кабинет</Link>
        <span>/</span>
        <Link to="/teacher/subjects">Предметы</Link>
        <span>/</span>
        <Link to={`/teacher/subjects/${subject.id}`}>{subject.title}</Link>
        <span>/</span>
        <span>{assignment.title}</span>
      </nav>

      <header className="page-header">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span className="badge badge-submitted">{subject.title}</span>
          {assignment.type && (
            <span className="badge" style={{ background: 'var(--accent-soft)', color: '#78350f' }}>
              {assignmentTypeLabels[assignment.type]}
            </span>
          )}
          <DeadlineBadge deadline={assignment.deadline} />
          {module && <span className="badge">Модуль: {module.title}</span>}
        </div>
        <h1>{assignment.title}</h1>
        <p>
          Срок: {formatDate(assignment.deadline)} · Макс. балл: {assignment.maxScore}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Условия задания</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.description || 'Без описания'}</p>
        <AttachmentList items={assignment.attachments} />
        {assignment.payload?.pairs && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Пары соответствий</strong>
            <ul>
              {assignment.payload.pairs.map((p, i) => (
                <li key={i}>
                  {p.left} — {p.right}
                </li>
              ))}
            </ul>
          </div>
        )}
        {assignment.payload?.questions && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Вопросы</strong>
            <ol>
              {assignment.payload.questions.map((q, i) => (
                <li key={i}>{q.question}</li>
              ))}
            </ol>
          </div>
        )}
        {assignment.payload?.items && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Элементы</strong>
            <ul>
              {assignment.payload.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Кому назначено</h3>
        <p style={{ margin: '0 0 0.5rem' }}>
          Группы:{' '}
          {groups.length ? groups.join(', ') : 'все студенты предмета'}
        </p>
        <p style={{ margin: '0 0 0.5rem' }}>
          Формы обучения:{' '}
          {forms.length
            ? forms.map((f) => educationFormLabels[f]).join(', ')
            : 'все формы'}
        </p>
        <p style={{ margin: 0 }}>
          Работ: {subs.length} · сдано: {submitted} · проверено: {graded}
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/teacher/grading" className="btn-primary btn-sm">
            К проверке
          </Link>
          <Link to={`/teacher/subjects/${subject.id}`} className="btn-secondary btn-sm">
            К предмету
          </Link>
        </div>
      </div>
    </div>
  )
}
