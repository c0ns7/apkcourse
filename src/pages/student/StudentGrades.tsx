import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/EmptyState'
import { averageScore, formatDate, GRADE_MAX, gradePercent } from '../../utils/helpers'

export function StudentGrades() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const mySubjects = data.subjects.filter((s) => s.studentIds.includes(currentUser.id))
  const graded = data.submissions.filter(
    (s) => s.studentId === currentUser.id && s.status === 'graded' && s.score != null
  )

  const bySubject = mySubjects.map((subject) => {
    const assignIds = data.assignments.filter((a) => a.subjectId === subject.id).map((a) => a.id)
    const subs = graded.filter((s) => assignIds.includes(s.assignmentId))
    const scores = subs.map((s) => s.score!)
    return { subject, subs, avg: averageScore(scores) }
  })

  const allScores = graded.map((s) => s.score!)
  const totalAvg = averageScore(allScores)

  return (
    <div className="page">
      <PageHeader
        title="Успеваемость"
        subtitle={graded.length ? `Средняя оценка: ${totalAvg} из ${GRADE_MAX}` : 'Пока нет оценок'}
      />

      {graded.length === 0 ? (
        <EmptyState icon="chart" title="Оценок пока нет" description="Сдавайте задания — оценки появятся здесь" />
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Общий прогресс</h3>
            <div className="grade-bar">
              <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>{totalAvg}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>из {GRADE_MAX}</span>
              <div className="grade-bar-track">
                <div
                  className="grade-bar-fill"
                  style={{
                    width: `${gradePercent(totalAvg)}%`,
                    background: totalAvg >= 4 ? 'var(--success)' : totalAvg >= 3 ? 'var(--warning)' : 'var(--danger)',
                  }}
                />
              </div>
            </div>
          </div>

          {bySubject.map(({ subject, subs, avg }) => (
            <div key={subject.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{subject.title}</h3>
                {subs.length > 0 && (
                  <span className="badge badge-graded">Среднее: {avg} / {GRADE_MAX}</span>
                )}
              </div>
              {subs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет оценок по предмету</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Задание</th>
                        <th>Оценка</th>
                        <th>Дата</th>
                        <th>Комментарий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((s) => {
                        const a = data.assignments.find((x) => x.id === s.assignmentId)!
                        return (
                          <tr key={s.id}>
                            <td>{a.title}</td>
                            <td>
                              <strong>{s.score}</strong> / {GRADE_MAX}
                              <div className="progress-bar" style={{ maxWidth: 120 }}>
                                <div className="progress-bar-fill" style={{ width: `${gradePercent(s.score!)}%` }} />
                              </div>
                            </td>
                            <td>{s.gradedAt ? formatDate(s.gradedAt) : '—'}</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.feedback || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
