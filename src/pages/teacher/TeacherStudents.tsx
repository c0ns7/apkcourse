import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatPhoneDisplay } from '../../utils/helpers'

export function TeacherStudents() {
  const { data, currentUser, assignStudentToTeacher } = useApp()
  const [selected, setSelected] = useState('')

  if (!currentUser) return null

  const allStudents = data.users.filter((u) => u.role === 'student')
  const myStudents = allStudents.filter((u) => u.teacherId === currentUser.id)
  const unassigned = allStudents.filter((u) => !u.teacherId || u.teacherId === currentUser.id)

  const handleAssign = () => {
    if (selected) {
      assignStudentToTeacher(selected, currentUser.id)
      setSelected('')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Мои студенты</h1>
        <p>Закрепите студентов за собой, затем добавляйте их к предметам</p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Добавить студента</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Студент</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Выберите студента...</option>
              {unassigned
                .filter((u) => u.teacherId !== currentUser.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} {u.group ? `(${u.group})` : ''}
                    {u.teacherId ? ' — у другого преподавателя' : ''}
                  </option>
                ))}
            </select>
          </div>
          <button type="button" className="btn-primary" onClick={handleAssign} disabled={!selected}>
            Закрепить за мной
          </button>
        </div>
      </div>

      <div className="card table-wrap">
        <h3 style={{ marginTop: 0 }}>Закреплённые студенты ({myStudents.length})</h3>
        {myStudents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Пока нет закреплённых студентов</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Группа</th>
                <th>Предметов</th>
              </tr>
            </thead>
            <tbody>
              {myStudents.map((u) => {
                const subjCount = data.subjects.filter(
                  (s) => s.teacherId === currentUser.id && s.studentIds.includes(u.id)
                ).length
                return (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{formatPhoneDisplay(u.phone)}</td>
                    <td>{u.group || '—'}</td>
                    <td>{subjCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
