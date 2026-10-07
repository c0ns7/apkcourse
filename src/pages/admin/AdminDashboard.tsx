import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'

export function AdminDashboard() {
  const { data, resetDemo } = useApp()

  const students = data.users.filter((u) => u.role === 'student')
  const teachers = data.users.filter((u) => u.role === 'teacher')
  const pending = data.submissions.filter((s) => s.status === 'submitted').length
  const graded = data.submissions.filter((s) => s.status === 'graded').length

  return (
    <div className="page">
      <PageHeader
        title="Панель администратора"
        subtitle="Обзор образовательного портала АПК"
        actions={
          <button type="button" className="btn-secondary btn-sm" onClick={resetDemo}>
            Сбросить демо
          </button>
        }
      />

      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="student" size={24} /></span>
          <div className="num">{students.length}</div>
          <div className="label">Студентов</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="teacher" size={24} /></span>
          <div className="num">{teachers.length}</div>
          <div className="label">Преподавателей</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="book" size={24} /></span>
          <div className="num">{data.subjects.length}</div>
          <div className="label">Предметов</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon"><Icon name="file" size={24} /></span>
          <div className="num">{data.assignments.length}</div>
          <div className="label">Заданий</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Активность</h3>
          <div className="activity-stats">
            <div className="activity-row">
              <span>На проверке</span>
              <strong>{pending}</strong>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${Math.min(100, pending * 10)}%` }} /></div>
            </div>
            <div className="activity-row">
              <span>Оценено работ</span>
              <strong>{graded}</strong>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${Math.min(100, graded * 10)}%` }} /></div>
            </div>
            <div className="activity-row">
              <span>Объявлений</span>
              <strong>{data.announcements.length}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Быстрые ссылки</h3>
          <div className="action-links">
            <Link to="/admin/users" className="btn-primary">Пользователи</Link>
            <Link to="/admin/announcements" className="btn-secondary">Объявления</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
