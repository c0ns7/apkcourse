import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { educationFormLabels, hasRole } from '../../utils/helpers'

export function TeacherStudents() {
  const { data, currentUser, assignGroupToTeacher } = useApp()
  const [selectedGroup, setSelectedGroup] = useState('')

  if (!currentUser) return null

  const myGroups = data.groups.filter((g) => g.teacherId === currentUser.id)
  const freeGroups = data.groups.filter((g) => !g.teacherId)
  const students = data.users.filter((u) => hasRole(u, 'student'))

  return (
    <div className="page">
      <PageHeader
        title="Мои группы"
        subtitle="Закрепляйте учебные группы, а не отдельных студентов"
      />

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginTop: 0 }}>Закрепить группу за собой</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Выберите группу…</option>
            {freeGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {educationFormLabels[g.educationForm]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedGroup}
            onClick={() => {
              if (!selectedGroup) return
              void assignGroupToTeacher(selectedGroup)
              setSelectedGroup('')
            }}
          >
            Закрепить
          </button>
        </div>
        {!freeGroups.length && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
            Нет свободных групп — создайте группу в разделе администратора или попросите назначить
          </p>
        )}
      </div>

      {myGroups.length === 0 ? (
        <div className="card empty-state">У вас пока нет закреплённых групп</div>
      ) : (
        <div className="grid-2">
          {myGroups.map((g) => {
            const members = students.filter((s) => g.studentIds.includes(s.id))
            return (
              <div key={g.id} className="card">
                <h3 style={{ margin: '0 0 0.35rem' }}>{g.name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.75 }}>
                  {educationFormLabels[g.educationForm]}
                  {g.specialty ? ` · ${g.specialty}` : ''}
                  {g.course ? ` · курс ${g.course}` : ''}
                </p>
                <p style={{ fontSize: '0.9rem' }}>Студентов: {members.length}</p>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {members.map((s) => (
                    <li key={s.id}>{s.fullName}</li>
                  ))}
                  {!members.length && <li style={{ opacity: 0.7 }}>Состав пуст</li>}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
