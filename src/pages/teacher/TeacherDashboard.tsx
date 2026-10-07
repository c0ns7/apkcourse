import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export function TeacherDashboard() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const mySubjects = data.subjects.filter((s) => s.teacherId === currentUser.id)
  const myAssignments = data.assignments.filter((a) =>
    mySubjects.some((s) => s.id === a.subjectId)
  )
  const toGrade = data.submissions.filter((sub) => {
    if (sub.status !== 'submitted') return false
    const a = data.assignments.find((x) => x.id === sub.assignmentId)
    const subj = a ? data.subjects.find((s) => s.id === a.subjectId) : null
    return subj?.teacherId === currentUser.id
  })

  const myStudents = data.users.filter(
    (u) => u.role === 'student' && u.teacherId === currentUser.id
  )

  return (
    <div className="page">
      <header className="page-header">
        <h1>Кабинет преподавателя</h1>
        <p>{currentUser.fullName}</p>
      </header>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="num">{mySubjects.length}</div>
          <div className="label">Предметов</div>
        </div>
        <div className="card stat-card">
          <div className="num">{myStudents.length}</div>
          <div className="label">Моих студентов</div>
        </div>
        <div className="card stat-card">
          <div className="num">{toGrade.length}</div>
          <div className="label">На проверке</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Быстрые действия</h3>
          <div className="action-links">
            <Link to="/teacher/subjects" className="btn-primary">
              Управление предметами
            </Link>
            <Link to="/teacher/students" className="btn-secondary">
              Мои студенты
            </Link>
            <Link to="/teacher/grading" className="btn-accent">
              Проверить работы ({toGrade.length})
            </Link>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Последние задания</h3>
          {myAssignments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Создайте предмет и добавьте задание</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {myAssignments.slice(0, 5).map((a) => (
                <li key={a.id} style={{ marginBottom: '0.35rem' }}>
                  {a.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
