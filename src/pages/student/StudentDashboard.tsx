import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { averageScore, formatDate, getDeadlineStatus, GRADE_MAX } from '../../utils/helpers'
import '../Dashboard.css'

const statusLabels = {
  pending: 'Не сдано',
  submitted: 'На проверке',
  graded: 'Оценено',
  returned: 'На доработке',
}

export function StudentDashboard() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const firstName = currentUser.fullName.split(' ')[0]
  const mySubjects = data.subjects.filter((s) => s.studentIds.includes(currentUser.id))
  const myAssignments = data.assignments.filter((a) =>
    mySubjects.some((s) => s.id === a.subjectId)
  )
  const mySubmissions = data.submissions.filter((s) => s.studentId === currentUser.id)

  const pending = mySubmissions.filter(
    (s) => s.status === 'pending' || s.status === 'returned'
  ).length
  const submitted = mySubmissions.filter((s) => s.status === 'submitted').length
  const graded = mySubmissions.filter((s) => s.status === 'graded').length
  const overdue = myAssignments.filter((a) => {
    const sub = mySubmissions.find((s) => s.assignmentId === a.id)
    return (
      getDeadlineStatus(a.deadline) === 'overdue' &&
      sub?.status !== 'graded' &&
      sub?.status !== 'submitted'
    )
  }).length

  const recent = myAssignments
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  const gradeScores = mySubmissions
    .filter((s) => s.status === 'graded' && s.score != null)
    .map((s) => s.score!)
  const avg = gradeScores.length ? averageScore(gradeScores) : null

  const unreadAnn = data.announcements.length
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="page">
      <section className="dash-welcome">
        <div className="dash-welcome-inner">
          <div>
            <p className="dash-welcome-kicker">{today}</p>
            <h1>Здравствуйте, {firstName}</h1>
            <p className="dash-welcome-meta">
              Группа {currentUser.group || '—'}
              {currentUser.specialty ? ` · ${currentUser.specialty}` : ''}
              {' · '}
              {mySubjects.length}{' '}
              {mySubjects.length === 1 ? 'предмет' : 'предметов'}
            </p>
          </div>
          <div className="dash-welcome-actions">
            <Link to="/student/assignments" className="btn-primary">
              Мои задания
            </Link>
            <Link to="/student/chat" className="btn-secondary">
              Чаты
            </Link>
          </div>
        </div>
      </section>

      <div className="dash-stats">
        <Link to="/student/assignments" className="dash-stat">
          <span className={`dash-stat-icon ${pending ? 'warn' : ''}`}>
            <Icon name="file" size={20} />
          </span>
          <div className="num">{pending}</div>
          <div className="label">К выполнению</div>
        </Link>
        <Link to="/student/assignments" className="dash-stat">
          <span className="dash-stat-icon">
            <Icon name="clock" size={20} />
          </span>
          <div className="num">{submitted}</div>
          <div className="label">На проверке</div>
        </Link>
        <Link to="/student/grades" className="dash-stat">
          <span className="dash-stat-icon ok">
            <Icon name="check" size={20} />
          </span>
          <div className="num">{graded}</div>
          <div className="label">Оценено</div>
        </Link>
        <Link to="/student/grades" className="dash-stat">
          <span className={`dash-stat-icon ${avg == null && overdue ? 'alert' : 'ok'}`}>
            <Icon name={avg != null ? 'chart' : 'alert'} size={20} />
          </span>
          <div className="num">{avg != null ? `${avg}/${GRADE_MAX}` : overdue}</div>
          <div className="label">{avg != null ? 'Средняя оценка' : 'Просрочено'}</div>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Ближайшие задания</h2>
            <Link to="/student/assignments">Все →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="dash-empty">Пока нет активных заданий</p>
          ) : (
            <ul className="dash-feed">
              {recent.map((a) => {
                const sub = mySubmissions.find((s) => s.assignmentId === a.id)
                const subject = data.subjects.find((s) => s.id === a.subjectId)
                const dl = getDeadlineStatus(a.deadline)
                return (
                  <li key={a.id}>
                    <Link to={`/student/assignment/${a.id}`}>
                      <strong>{a.title}</strong>
                      <span className={`badge badge-${sub?.status ?? 'pending'}`}>
                        {statusLabels[sub?.status ?? 'pending']}
                      </span>
                      <span className="meta">
                        {subject?.title} · до {formatDate(a.deadline)}
                        {dl === 'overdue' ? ' · просрочено' : ''}
                        {dl === 'today' ? ' · сегодня' : ''}
                        {dl === 'soon' ? ' · скоро' : ''}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="dash-panel">
          <div className="dash-panel-head">
            <h2>Быстрый доступ</h2>
          </div>
          <div className="dash-actions">
            <Link to="/student/grades" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="chart" size={18} />
              </span>
              <span>
                <strong>Успеваемость</strong>
                <small>Оценки и зачёты</small>
              </span>
            </Link>
            <Link to="/student/schedule" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="calendar" size={18} />
              </span>
              <span>
                <strong>Расписание</strong>
                <small>Пары и аудитории</small>
              </span>
            </Link>
            <Link to="/student/announcements" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="megaphone" size={18} />
              </span>
              <span>
                <strong>Объявления</strong>
                <small>{unreadAnn ? `${unreadAnn} на портале` : 'Новости колледжа'}</small>
              </span>
            </Link>
            <Link to="/profile" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="user" size={18} />
              </span>
              <span>
                <strong>Профиль</strong>
                <small>Личные данные</small>
              </span>
            </Link>
          </div>

          <div className="dash-panel-head" style={{ marginTop: '1.25rem' }}>
            <h2>Мои предметы</h2>
          </div>
          {mySubjects.length === 0 ? (
            <p className="dash-empty">Преподаватель добавит вас к предмету</p>
          ) : (
            <ul className="dash-subjects">
              {mySubjects.map((s) => {
                const teacher = data.users.find((u) => u.id === s.teacherId)
                return (
                  <li key={s.id} style={{ borderLeftColor: s.color ?? 'var(--primary)' }}>
                    <strong>{s.title}</strong>
                    <span>{teacher?.fullName || 'Преподаватель'}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
