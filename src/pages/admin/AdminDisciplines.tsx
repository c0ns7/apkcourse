import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { hasRole } from '../../utils/helpers'

/** Смена преподавателя дисциплины в течение учебного года */
export function AdminDisciplines() {
  const { data, reassignSubjectTeacher } = useApp()
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const teachers = useMemo(
    () => data.users.filter((u) => hasRole(u, 'teacher')),
    [data.users]
  )

  const subjects = useMemo(() => {
    const q = search.toLowerCase()
    return data.subjects.filter((s) => {
      if (!q) return true
      const teacher = teachers.find((t) => t.id === s.teacherId)
      return (
        s.title.toLowerCase().includes(q) ||
        (teacher?.fullName || '').toLowerCase().includes(q)
      )
    })
  }, [data.subjects, teachers, search])

  const handleChange = async (subjectId: string, teacherId: string) => {
    setError('')
    setBusyId(subjectId)
    try {
      const err = await reassignSubjectTeacher(subjectId, teacherId)
      if (err) setError(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Дисциплины"
        subtitle="Назначение преподавателя в течение учебного года (увольнение, замена)"
      />
      {error && <div className="alert alert-error">{error}</div>}
      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по предмету или ФИО…" />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дисциплина</th>
              <th>Студентов</th>
              <th>Групп</th>
              <th>Преподаватель</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.title}</strong>
                  {s.description ? (
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.description}</div>
                  ) : null}
                </td>
                <td>{s.studentIds.length}</td>
                <td>{s.groupIds?.length || 0}</td>
                <td>
                  <select
                    value={s.teacherId}
                    disabled={busyId === s.id}
                    onChange={(e) => void handleChange(s.id, e.target.value)}
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', opacity: 0.7 }}>
                  Предметов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
