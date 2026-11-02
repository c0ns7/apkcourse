import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import type { EducationForm, StudyGroup } from '../../types'
import {
  ACADEMIC_YEARS,
  CURRENT_ACADEMIC_YEAR,
  EDUCATION_FORMS,
  SPECIALTIES,
  educationFormLabels,
  hasRole,
} from '../../utils/helpers'

export function AdminGroups() {
  const {
    data,
    currentUser,
    createGroup,
    updateGroup,
    deleteGroup,
    addStudentToGroup,
    removeStudentFromGroup,
  } = useApp()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | 'members' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [educationForm, setEducationForm] = useState<EducationForm>('fulltime')
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [course, setCourse] = useState(1)
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const teachers = data.users.filter((u) => hasRole(u, 'teacher'))
  const students = data.users.filter((u) => hasRole(u, 'student'))

  const filtered = data.groups.filter((g) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      g.name.toLowerCase().includes(q) ||
      (g.specialty || '').toLowerCase().includes(q) ||
      educationFormLabels[g.educationForm].toLowerCase().includes(q)
    )
  })

  const active = editId ? data.groups.find((g) => g.id === editId) : null

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  const close = () => {
    setModal(null)
    setEditId(null)
    setError('')
    setName('')
    setEducationForm('fulltime')
    setAcademicYear(CURRENT_ACADEMIC_YEAR)
    setSpecialty(SPECIALTIES[0])
    setCourse(1)
    setTeacherId('')
    setStudentId('')
  }

  const openCreate = () => {
    close()
    setModal('create')
  }

  const openEdit = (g: StudyGroup) => {
    setEditId(g.id)
    setName(g.name)
    setEducationForm(g.educationForm)
    setAcademicYear(g.academicYear || CURRENT_ACADEMIC_YEAR)
    setSpecialty(g.specialty || SPECIALTIES[0])
    setCourse(g.course || 1)
    setTeacherId(g.teacherId || '')
    setError('')
    setModal('edit')
  }

  const openMembers = (g: StudyGroup) => {
    setEditId(g.id)
    setStudentId('')
    setError('')
    setModal('members')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const fields = {
        name,
        educationForm,
        academicYear,
        specialty,
        course,
        teacherId: teacherId || null,
      }
      const err =
        modal === 'create'
          ? await createGroup(fields)
          : editId
            ? await updateGroup(editId, fields)
            : 'Ошибка'
      if (err) {
        setError(err)
        return
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="page">
      <PageHeader
        title="Группы"
        subtitle="Регистрация учебных групп и состав"
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            Добавить группу
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию, специальности…" />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Группа</th>
              <th>Форма обучения</th>
              <th>Курс</th>
              <th>Студентов</th>
              <th>Преподаватель</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => {
              const teacher = teachers.find((t) => t.id === g.teacherId)
              return (
                <tr key={g.id}>
                  <td>
                    <strong>{g.name}</strong>
                    {g.specialty ? (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{g.specialty}</div>
                    ) : null}
                  </td>
                  <td>{educationFormLabels[g.educationForm]}</td>
                  <td>{g.course || '—'}</td>
                  <td>{g.studentIds.length}</td>
                  <td>{teacher?.fullName || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openMembers(g)}>
                      Состав
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(g)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`Удалить группу ${g.name}?`) && void deleteGroup(g.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', opacity: 0.7 }}>
                  Групп пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={close} role="presentation">
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'Новая группа' : 'Редактировать группу'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={(e) => void save(e)}>
              <div className="form-group">
                <label>Название</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>Форма обучения</label>
                <select
                  value={educationForm}
                  onChange={(e) => setEducationForm(e.target.value as EducationForm)}
                >
                  {EDUCATION_FORMS.map((f) => (
                    <option key={f} value={f}>
                      {educationFormLabels[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Учебный год</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Специальность</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Курс</label>
                <select value={course} onChange={(e) => setCourse(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Закреплённый преподаватель</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  <option value="">Не назначен</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={close}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'members' && active && (
        <div className="modal-overlay" onClick={close} role="presentation">
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2>Состав: {active.name}</h2>
            <div className="form-group">
              <label>Добавить студента</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Выберите…</option>
                  {students
                    .filter((s) => !active.studentIds.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                        {s.group ? ` (${s.group})` : ''}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!studentId}
                  onClick={() => {
                    if (!studentId) return
                    void addStudentToGroup(active.id, studentId)
                    setStudentId('')
                  }}
                >
                  Добавить
                </button>
              </div>
            </div>
            <div className="card table-wrap" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {active.studentIds.map((sid) => {
                    const s = students.find((u) => u.id === sid)
                    if (!s) return null
                    return (
                      <tr key={sid}>
                        <td>{s.fullName}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => void removeStudentFromGroup(active.id, sid)}
                          >
                            Убрать
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {active.studentIds.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ opacity: 0.7 }}>
                        В группе пока нет студентов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={close}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
