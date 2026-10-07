import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { averageScore, formatDate, getDeadlineStatus, GRADE_MAX } from '../../utils/helpers'

const statusLabels = {
  pending: 'Не сдано',
  submitted: 'На проверке',
  graded: 'Оценено',
  returned: 'На доработке',
}

export function StudentDashboard() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const mySubjects = data.subjects.filter((s) =>
    s.studentIds.includes(currentUser.id)
  )

  const myAssignments = data.assignments.filter((a) =>
    mySubjects.some((s) => s.id === a.subjectId)
  )

  const mySubmissions = data.submissions.filter((s) => s.studentId === currentUser.id)

  const pending = mySubmissions.filter((s) => s.status === 'pending' || s.status === 'returned').length
  const submitted = mySubmissions.filter((s) => s.status === 'submitted').length
  const graded = mySubmissions.filter((s) => s.status === 'graded').length
  const overdue = myAssignments.filter((a) => {
    const sub = mySubmissions.find((s) => s.assignmentId === a.id)
    return getDeadlineStatus(a.deadline) === 'overdue' && sub?.status !== 'graded' && sub?.status !== 'submitted'
  }).length

  const recent = myAssignments
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4)

  const gradeScores = mySubmissions
    .filter((s) => s.status === 'graded' && s.score != null)
    .map((s) => s.score!)
  const avg = gradeScores.length ? averageScore(gradeScores) : null

  return (
    <div className="page">
      <PageHeader
        title={`Здравствуйте, ${currentUser.fullName.split(' ')[0]}!`}
        subtitle={`Группа ${currentUser.group || '—'} · ${mySubjects.length} предметов`}
      />

      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="file" size={24} /></span>
          <div className="num">{pending}</div>
          <div className="label">К выполнению</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="clock" size={24} /></span>
          <div className="num">{submitted}</div>
          <div className="label">На проверке</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="check" size={24} /></span>
          <div className="num">{graded}</div>
          <div className="label">Оценено</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">
            <Icon name={avg != null ? 'chart' : 'alert'} size={24} />
          </span>
          <div className="num">{avg != null ? `${avg}/${GRADE_MAX}` : overdue}</div>
          <div className="label">{avg != null ? 'Средняя оценка' : 'Просрочено'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ближайшие задания</h3>
          {recent.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Нет активных заданий</p>
          ) : (
            <ul className="quick-list">
              {recent.map((a) => {
                const sub = mySubmissions.find((s) => s.assignmentId === a.id)
                const subject = data.subjects.find((s) => s.id === a.subjectId)
                return (
                  <li key={a.id}>
                    <Link to={`/student/assignment/${a.id}`}>
                      <strong>{a.title}</strong>
                      <span>{subject?.title} · {formatDate(a.deadline)}</span>
                      <span className={`badge badge-${sub?.status ?? 'pending'}`}>
                        {statusLabels[sub?.status ?? 'pending']}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/student/assignments" className="btn-secondary btn-sm link-mt">
            Все задания →
          </Link>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Мои предметы</h3>
          {mySubjects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Преподаватель добавит вас к предмету</p>
          ) : (
            <ul className="subject-list">
              {mySubjects.map((s) => {
                const teacher = data.users.find((u) => u.id === s.teacherId)
                return (
                  <li key={s.id} style={{ borderLeftColor: s.color ?? 'var(--primary)' }}>
                    <strong>{s.title}</strong>
                    <span>{teacher?.fullName}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
