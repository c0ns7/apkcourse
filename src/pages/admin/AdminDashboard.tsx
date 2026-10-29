import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Icon } from '../../components/Icon'
import { PageHeader } from '../../components/PageHeader'
import { ACADEMIC_YEARS, averageScore } from '../../utils/helpers'
import {
  exportGradesToExcel,
  exportStudentAnalyticsToExcel,
} from '../../utils/exportExcel'

export function AdminDashboard() {
  const { data } = useApp()
  const [year, setYear] = useState<string>('all')

  const students = data.users.filter((u) => u.role === 'student')
  const teachers = data.users.filter((u) => u.role === 'teacher')
  const pending = data.submissions.filter((s) => s.status === 'submitted').length
  const graded = data.submissions.filter((s) => s.status === 'graded').length

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => year === 'all' || s.academicYear === year),
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

  return (
    <div className="page">
      <PageHeader
        title="Панель администратора"
        subtitle="Аналитика и отчётность образовательного портала АПК"
        actions={
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
        }
      />

      <div className="form-group" style={{ maxWidth: 260, marginBottom: '1.25rem' }}>
        <label>Учебный год</label>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">Все годы</option>
          {ACADEMIC_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <span className="stat-icon">
            <Icon name="student" size={24} />
          </span>
          <div className="num">{filteredStudents.length}</div>
          <div className="label">Студентов</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">
            <Icon name="teacher" size={24} />
          </span>
          <div className="num">
            {year === 'all'
              ? teachers.length
              : teachers.filter((t) => t.academicYear === year).length}
          </div>
          <div className="label">Преподавателей</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">
            <Icon name="book" size={24} />
          </span>
          <div className="num">{data.subjects.length}</div>
          <div className="label">Курсов / предметов</div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">
            <Icon name="file" size={24} />
          </span>
          <div className="num">{data.assignments.length}</div>
          <div className="label">Заданий</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Активность</h3>
          <div className="activity-stats">
            <div className="activity-row">
              <span>На проверке</span>
              <strong>{pending}</strong>
            </div>
            <div className="activity-row">
              <span>Оценено работ</span>
              <strong>{graded}</strong>
            </div>
            <div className="activity-row">
              <span>Объявлений</span>
              <strong>{data.announcements.length}</strong>
            </div>
            <div className="activity-row">
              <span>Диалогов в чате</span>
              <strong>{data.chatThreads.length}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>По группам / курсам</h3>
          <div className="grid-2">
            <div>
              <strong>Группы</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                {byGroup.map(([g, n]) => (
                  <li key={g}>
                    {g}: {n}
                  </li>
                ))}
                {byGroup.length === 0 && <li>Нет данных</li>}
              </ul>
            </div>
            <div>
              <strong>Курсы</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                {byCourse.map(([c, n]) => (
                  <li key={c}>
                    {c || '—'}-й курс: {n}
                  </li>
                ))}
                {byCourse.length === 0 && <li>Нет данных</li>}
              </ul>
            </div>
          </div>
          <div className="action-links" style={{ marginTop: '1rem' }}>
            <Link to="/admin/users" className="btn-primary">
              Пользователи
            </Link>
            <Link to="/admin/announcements" className="btn-secondary">
              Объявления
            </Link>
          </div>
        </div>
      </div>

      <div className="card table-wrap">
        <h3 style={{ marginTop: 0 }}>Аналитика по студентам</h3>
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
      </div>
    </div>
  )
}
