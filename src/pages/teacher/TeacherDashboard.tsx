import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { formatDate } from '../../utils/helpers'
import '../Dashboard.css'

export function TeacherDashboard() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const firstName = currentUser.fullName.split(' ')[0]
  const mySubjects = data.subjects.filter((s) => s.teacherId === currentUser.id)
  const myAssignments = data.assignments
    .filter((a) => mySubjects.some((s) => s.id === a.subjectId))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const toGrade = data.submissions.filter((sub) => {
    if (sub.status !== 'submitted') return false
    const a = data.assignments.find((x) => x.id === sub.assignmentId)
    const subj = a ? data.subjects.find((s) => s.id === a.subjectId) : null
    return subj?.teacherId === currentUser.id
  })

  const myStudents = data.users.filter(
    (u) =>
      (u.role === 'student' || u.roles?.includes('student')) && u.teacherId === currentUser.id
  )

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
            <h1>Кабинет преподавателя</h1>
            <p className="dash-welcome-meta">
              {currentUser.fullName}
              {toGrade.length > 0
                ? ` · ${toGrade.length} работ ждут проверки`
                : ' · очередь проверки пуста'}
            </p>
          </div>
          <div className="dash-welcome-actions">
            <Link to="/teacher/grading" className="btn-primary">
              Проверить работы
              {toGrade.length > 0 ? ` (${toGrade.length})` : ''}
            </Link>
            <Link to="/teacher/subjects" className="btn-secondary">
              Предметы
            </Link>
          </div>
        </div>
      </section>

      <div className="dash-stats" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Link to="/teacher/subjects" className="dash-stat">
          <span className="dash-stat-icon">
            <Icon name="book" size={20} />
          </span>
          <div className="num">{mySubjects.length}</div>
          <div className="label">Предметов</div>
        </Link>
        <Link to="/teacher/students" className="dash-stat">
          <span className="dash-stat-icon">
            <Icon name="users" size={20} />
          </span>
          <div className="num">{myStudents.length}</div>
          <div className="label">Студентов</div>
        </Link>
        <Link to="/teacher/grading" className="dash-stat">
          <span className={`dash-stat-icon ${toGrade.length ? 'warn' : 'ok'}`}>
            <Icon name="check" size={20} />
          </span>
          <div className="num">{toGrade.length}</div>
          <div className="label">На проверке</div>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Последние задания</h2>
            <Link to="/teacher/subjects">К предметам →</Link>
          </div>
          {myAssignments.length === 0 ? (
            <p className="dash-empty">Создайте предмет и добавьте задание</p>
          ) : (
            <ul className="dash-feed">
              {myAssignments.slice(0, 6).map((a) => {
                const subject = data.subjects.find((s) => s.id === a.subjectId)
                const waiting = data.submissions.filter(
                  (s) => s.assignmentId === a.id && s.status === 'submitted'
                ).length
                return (
                  <li key={a.id}>
                    <Link to={`/teacher/subjects/${a.subjectId}`}>
                      <strong>{a.title}</strong>
                      {waiting > 0 && (
                        <span className="badge badge-submitted">{waiting} на проверке</span>
                      )}
                      <span className="meta">
                        {subject?.title} · срок {formatDate(a.deadline)}
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
            <h2>Быстрые действия</h2>
          </div>
          <div className="dash-actions">
            <Link to="/teacher/subjects" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="book" size={18} />
              </span>
              <span>
                <strong>Предметы и задания</strong>
                <small>Создание и редактирование</small>
              </span>
            </Link>
            <Link to="/teacher/students" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="users" size={18} />
              </span>
              <span>
                <strong>Студенты</strong>
                <small>Закрепление и списки</small>
              </span>
            </Link>
            <Link to="/teacher/grading" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="check" size={18} />
              </span>
              <span>
                <strong>Проверка работ</strong>
                <small>
                  {toGrade.length
                    ? `${toGrade.length} ожидают оценки`
                    : 'Нет новых сдач'}
                </small>
              </span>
            </Link>
            <Link to="/teacher/announcements" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="megaphone" size={18} />
              </span>
              <span>
                <strong>Объявления</strong>
                <small>Сообщения группам</small>
              </span>
            </Link>
            <Link to="/teacher/chat" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="chat" size={18} />
              </span>
              <span>
                <strong>Чаты</strong>
                <small>Связь со студентами</small>
              </span>
            </Link>
          </div>
          <p className="dash-empty" style={{ marginTop: '1rem' }}>
            Добро пожаловать, {firstName}. Начните с предметов или проверки работ.
          </p>
        </aside>
      </div>
    </div>
  )
}
