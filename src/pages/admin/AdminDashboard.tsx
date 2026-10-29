import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { ACADEMIC_YEARS, averageScore } from '../../utils/helpers'
import {
  exportGradesToExcel,
  exportStudentAnalyticsToExcel,
} from '../../utils/exportExcel'
import '../Dashboard.css'

export function AdminDashboard() {
  const { data, currentUser } = useApp()
  const [year, setYear] = useState<string>('all')

  const students = data.users.filter((u) => u.role === 'student')
  const teachers = data.users.filter((u) => u.role === 'teacher')
  const pending = data.submissions.filter((s) => s.status === 'submitted').length
  const graded = data.submissions.filter((s) => s.status === 'graded').length

  const filteredStudents = useMemo(
    () => students.filter((s) => year === 'all' || s.academicYear === year),
    [students, year]
  )

  const byGroup = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of filteredStudents) {
      const g = s.group || 'Без группы'
      map.set(g, (map.get(g) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filteredStudents])

  const byCourse = useMemo(() => {
    const map = new Map<number, number>()
    for (const s of filteredStudents) {
      const c = s.course ?? 0
      map.set(c, (map.get(c) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredStudents])

  const studentRows = useMemo(() => {
    return filteredStudents.map((s) => {
      const subs = data.submissions.filter((x) => x.studentId === s.id)
      const gradedSubs = subs.filter((x) => x.status === 'graded')
      const scores = gradedSubs
        .filter((x) => x.gradeMode !== 'pass_fail' && x.score != null)
        .map((x) => x.score!)
      const assignTotal = data.assignments.filter((a) => {
        const subj = data.subjects.find((sj) => sj.id === a.subjectId)
        return subj?.studentIds.includes(s.id)
      }).length
      const submitted = subs.filter(
        (x) => x.status === 'submitted' || x.status === 'graded'
      ).length
      return {
        student: s,
        avg: averageScore(scores),
        submitted,
        assignTotal,
        rate: assignTotal ? Math.round((submitted / assignTotal) * 100) : 0,
        pass: gradedSubs.filter((x) => x.gradeMode === 'pass_fail' && x.passed).length,
        fail: gradedSubs.filter((x) => x.gradeMode === 'pass_fail' && !x.passed).length,
      }
    })
  }, [filteredStudents, data])

  const teacherCount =
    year === 'all'
      ? teachers.length
      : teachers.filter((t) => t.academicYear === year).length

  return (
    <div className="page">
      <section className="dash-welcome">
        <div className="dash-welcome-inner">
          <div>
            <p className="dash-welcome-kicker">
              {currentUser?.isRoot ? 'Root · полный доступ' : 'Администратор'}
            </p>
            <h1>Панель управления</h1>
            <p className="dash-welcome-meta">
              Аналитика и пользователи образовательного портала АПК
            </p>
          </div>
          <div className="dash-welcome-actions">
            <Link to="/admin/users" className="btn-primary">
              Пользователи
            </Link>
            <Link to="/admin/announcements" className="btn-secondary">
              Объявления
            </Link>
          </div>
        </div>
      </section>

      <div className="dash-toolbar">
        <div className="form-group">
          <label htmlFor="admin-year">Учебный год</label>
          <select
            id="admin-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="all">Все годы</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() =>
              exportGradesToExcel(data, {
                academicYear: year === 'all' ? undefined : year,
                filename: 'ocenki-admin.xlsx',
              })
            }
          >
            Excel: оценки
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() =>
              exportStudentAnalyticsToExcel(
                data,
                year === 'all' ? undefined : year,
                'analitika-studenty.xlsx'
              )
            }
          >
            Excel: студенты
          </button>
        </div>
      </div>

      <div className="dash-stats">
        <Link to="/admin/users" className="dash-stat">
          <span className="dash-stat-icon">
            <Icon name="student" size={20} />
          </span>
          <div className="num">{filteredStudents.length}</div>
          <div className="label">Студентов</div>
        </Link>
        <Link to="/admin/users" className="dash-stat">
          <span className="dash-stat-icon">
            <Icon name="teacher" size={20} />
          </span>
          <div className="num">{teacherCount}</div>
          <div className="label">Преподавателей</div>
        </Link>
        <div className="dash-stat" role="presentation">
          <span className="dash-stat-icon">
            <Icon name="book" size={20} />
          </span>
          <div className="num">{data.subjects.length}</div>
          <div className="label">Предметов</div>
        </div>
        <div className="dash-stat" role="presentation">
          <span className={`dash-stat-icon ${pending ? 'warn' : 'ok'}`}>
            <Icon name="file" size={20} />
          </span>
          <div className="num">{pending}</div>
          <div className="label">На проверке</div>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Активность портала</h2>
          </div>
          <div className="dash-actions">
            <div className="dash-action" style={{ cursor: 'default' }}>
              <span className="dash-action-icon">
                <Icon name="clock" size={18} />
              </span>
              <span>
                <strong>На проверке</strong>
                <small>{pending} работ ожидают оценки</small>
              </span>
              <strong style={{ marginLeft: 'auto' }}>{pending}</strong>
            </div>
            <div className="dash-action" style={{ cursor: 'default' }}>
              <span className="dash-action-icon">
                <Icon name="check" size={18} />
              </span>
              <span>
                <strong>Оценено</strong>
                <small>Всего проверенных работ</small>
              </span>
              <strong style={{ marginLeft: 'auto' }}>{graded}</strong>
            </div>
            <div className="dash-action" style={{ cursor: 'default' }}>
              <span className="dash-action-icon">
                <Icon name="megaphone" size={18} />
              </span>
              <span>
                <strong>Объявления</strong>
                <small>Опубликованные сообщения</small>
              </span>
              <strong style={{ marginLeft: 'auto' }}>{data.announcements.length}</strong>
            </div>
            <div className="dash-action" style={{ cursor: 'default' }}>
              <span className="dash-action-icon">
                <Icon name="chat" size={18} />
              </span>
              <span>
                <strong>Диалоги</strong>
                <small>Чаты студент — преподаватель</small>
              </span>
              <strong style={{ marginLeft: 'auto' }}>{data.chatThreads.length}</strong>
            </div>
          </div>
        </section>

        <aside className="dash-panel">
          <div className="dash-panel-head">
            <h2>По группам и курсам</h2>
          </div>
          <div className="grid-2">
            <div>
              <strong style={{ color: 'var(--primary-dark)' }}>Группы</strong>
              <ul style={{ margin: '0.55rem 0 0', paddingLeft: '1.1rem' }}>
                {byGroup.map(([g, n]) => (
                  <li key={g}>
                    {g}: {n}
                  </li>
                ))}
                {byGroup.length === 0 && <li>Нет данных</li>}
              </ul>
            </div>
            <div>
              <strong style={{ color: 'var(--primary-dark)' }}>Курсы</strong>
              <ul style={{ margin: '0.55rem 0 0', paddingLeft: '1.1rem' }}>
                {byCourse.map(([c, n]) => (
                  <li key={c}>
                    {c || '—'}-й курс: {n}
                  </li>
                ))}
                {byCourse.length === 0 && <li>Нет данных</li>}
              </ul>
            </div>
          </div>
          <div className="dash-actions" style={{ marginTop: '1.1rem' }}>
            <Link to="/admin/users" className="dash-action">
              <span className="dash-action-icon">
                <Icon name="user" size={18} />
              </span>
              <span>
                <strong>Управление пользователями</strong>
                <small>Студенты, преподаватели, админы</small>
              </span>
            </Link>
            {currentUser?.isRoot && (
              <Link to="/admin/logs" className="dash-action">
                <span className="dash-action-icon">
                  <Icon name="file" size={18} />
                </span>
                <span>
                  <strong>Журнал действий</strong>
                  <small>Только для root</small>
                </span>
              </Link>
            )}
          </div>
        </aside>
      </div>

      <section className="dash-panel table-wrap" style={{ marginTop: '1rem' }}>
        <div className="dash-panel-head">
          <h2>Аналитика по студентам</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Группа</th>
              <th>Курс</th>
              <th>Год</th>
              <th>Средний балл</th>
              <th>Сдача</th>
              <th>Зачёт / Незачёт</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map((row) => (
              <tr key={row.student.id}>
                <td>{row.student.fullName}</td>
                <td>{row.student.group || '—'}</td>
                <td>{row.student.course ?? '—'}</td>
                <td>{row.student.academicYear || '—'}</td>
                <td>{row.avg || '—'}</td>
                <td>
                  {row.submitted}/{row.assignTotal} ({row.rate}%)
                </td>
                <td>
                  {row.pass} / {row.fail}
                </td>
              </tr>
            ))}
            {studentRows.length === 0 && (
              <tr>
                <td colSpan={7}>Нет студентов за выбранный период</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
