import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { GradeMode } from '../../types'
import { AttachmentList } from '../../components/AttachmentFile'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { EmptyState } from '../../components/EmptyState'
import { Avatar } from '../../components/Avatar'
import {
  formatDateTime,
  formatGrade,
  GRADE_MAX,
  GRADE_MIN,
  clampGrade,
} from '../../utils/helpers'
import { exportGradesToExcel } from '../../utils/exportExcel'

export function TeacherGrading() {
  const { data, currentUser, gradeSubmission, returnSubmission } = useApp()
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [mode, setMode] = useState<'grade' | 'return'>('grade')
  const [gradeMode, setGradeMode] = useState<GradeMode>('score')
  const [score, setScore] = useState(4)
  const [passed, setPassed] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')

  if (!currentUser) return null

  const mySubjectIds = data.subjects
    .filter((s) => s.teacherId === currentUser.id)
    .map((s) => s.id)

  const toGrade = data.submissions.filter((sub) => {
    if (sub.status !== 'submitted') return false
    const a = data.assignments.find((x) => x.id === sub.assignmentId)
    return a && mySubjectIds.includes(a.subjectId)
  })

  const graded = data.submissions.filter((sub) => {
    if (sub.status !== 'graded') return false
    const a = data.assignments.find((x) => x.id === sub.assignmentId)
    return a && mySubjectIds.includes(a.subjectId)
  })

  const filterList = (list: typeof toGrade) =>
    list.filter((sub) => {
      if (!search) return true
      const student = data.users.find((u) => u.id === sub.studentId)
      const a = data.assignments.find((x) => x.id === sub.assignmentId)
      const q = search.toLowerCase()
      return (
        student?.fullName.toLowerCase().includes(q) ||
        a?.title.toLowerCase().includes(q)
      )
    })

  const openGrade = (
    subId: string,
    gradeOrReturn: 'grade' | 'return',
    existing?: { score?: number; feedback?: string; gradeMode?: GradeMode; passed?: boolean }
  ) => {
    setGradingId(subId)
    setMode(gradeOrReturn)
    setGradeMode(existing?.gradeMode ?? 'score')
    setScore(existing?.score ?? 4)
    setPassed(existing?.passed ?? true)
    setFeedback(existing?.feedback ?? '')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingId) return
    if (mode === 'grade') {
      gradeSubmission(gradingId, {
        gradeMode,
        score: gradeMode === 'score' ? clampGrade(score) : undefined,
        passed: gradeMode === 'pass_fail' ? passed : undefined,
        feedback,
      })
    } else {
      returnSubmission(gradingId, feedback || 'Требуется доработка')
    }
    setGradingId(null)
  }

  const handleExport = () => {
    exportGradesToExcel(data, {
      teacherId: currentUser.id,
      filename: 'ocenki-prepodavatel.xlsx',
    })
  }

  return (
    <div className="page">
      <PageHeader
        title="Проверка работ"
        subtitle={`${toGrade.length} ожидают · ${graded.length} проверено`}
        actions={
          <button type="button" className="btn-secondary btn-sm" onClick={handleExport}>
            Экспорт в Excel
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по студенту или заданию..." />

      <h2 className="section-title">Ожидают проверки</h2>
      {filterList(toGrade).length === 0 ? (
        <EmptyState icon="check" title="Нет работ на проверке" />
      ) : (
        <div className="grading-list">
          {filterList(toGrade).map((sub) => {
            const assignment = data.assignments.find((a) => a.id === sub.assignmentId)!
            const student = data.users.find((u) => u.id === sub.studentId)!
            const subject = data.subjects.find((s) => s.id === assignment.subjectId)!
            return (
              <div key={sub.id} className="card grading-card">
                <div className="grading-card-header">
                  <Avatar name={student.fullName} size={44} />
                  <div>
                    <strong>{student.fullName}</strong>
                    <span>
                      {student.group} · {subject.title}
                    </span>
                    <h3>{assignment.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => openGrade(sub.id, 'grade')}
                    >
                      Оценить
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => openGrade(sub.id, 'return')}
                    >
                      На доработку
                    </button>
                  </div>
                </div>
                {sub.content && <div className="submission-preview">{sub.content}</div>}
                {sub.answers && (
                  <div className="submission-preview">
                    <strong>Ответы:</strong>
                    {'\n'}
                    {sub.answers}
                  </div>
                )}
                <AttachmentList items={sub.attachments} />
                {sub.submittedAt && <small>Сдано: {formatDateTime(sub.submittedAt)}</small>}
              </div>
            )
          })}
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: '2rem' }}>
        Проверенные
      </h2>
      {graded.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Задание</th>
                <th>Оценка</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filterList(graded).map((sub) => {
                const assignment = data.assignments.find((a) => a.id === sub.assignmentId)!
                const student = data.users.find((u) => u.id === sub.studentId)!
                return (
                  <tr key={sub.id}>
                    <td>{student.fullName}</td>
                    <td>{assignment.title}</td>
                    <td>
                      <strong>{formatGrade(sub)}</strong>
                      {sub.gradeMode !== 'pass_fail' ? ` / ${GRADE_MAX}` : ''}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() =>
                          openGrade(sub.id, 'grade', {
                            score: sub.score,
                            feedback: sub.feedback,
                            gradeMode: sub.gradeMode,
                            passed: sub.passed,
                          })
                        }
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {gradingId && (
        <div className="modal-overlay" onClick={() => setGradingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{mode === 'grade' ? 'Выставить оценку' : 'Вернуть на доработку'}</h2>
            <form onSubmit={handleSubmit}>
              {mode === 'grade' && (
                <>
                  <div className="form-group">
                    <label>Способ оценки</label>
                    <select
                      value={gradeMode}
                      onChange={(e) => setGradeMode(e.target.value as GradeMode)}
                    >
                      <option value="score">Оценка от 2 до 5</option>
                      <option value="pass_fail">Зачёт / Незачёт</option>
                    </select>
                  </div>
                  {gradeMode === 'score' ? (
                    <div className="form-group">
                      <label>
                        Оценка ({GRADE_MIN}–{GRADE_MAX})
                      </label>
                      <input
                        type="number"
                        min={GRADE_MIN}
                        max={GRADE_MAX}
                        step={1}
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Результат</label>
                      <div className="auth-role-row">
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="pass"
                            checked={passed}
                            onChange={() => setPassed(true)}
                          />
                          Зачёт
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="radio"
                            name="pass"
                            checked={!passed}
                            onChange={() => setPassed(false)}
                          />
                          Незачёт
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="form-group">
                <label>Комментарий</label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required={mode === 'return'}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setGradingId(null)}>
                  Отмена
                </button>
                <button type="submit" className={mode === 'grade' ? 'btn-primary' : 'btn-danger'}>
                  {mode === 'grade' ? 'Сохранить' : 'Вернуть'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
