import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../../components/Avatar'
import { PageHeader } from '../../components/PageHeader'
import {
  ACADEMIC_YEARS,
  ALL_ASSIGNMENT_TYPES,
  DEFAULT_ENABLED_ASSIGNMENT_TYPES,
  SPECIALTIES,
  assignmentTypeLabels,
} from '../../utils/helpers'
import type { AssignmentType } from '../../types'

export function Profile() {
  const { currentUser, updateProfile, setEnabledAssignmentTypes } = useApp()
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '')
  const [login, setLogin] = useState(currentUser?.login ?? '')
  const [bio, setBio] = useState(currentUser?.bio ?? '')
  const [group, setGroup] = useState(currentUser?.group ?? '')
  const [specialty, setSpecialty] = useState(currentUser?.specialty ?? SPECIALTIES[0])
  const [course, setCourse] = useState(currentUser?.course ?? 1)
  const [academicYear, setAcademicYear] = useState(
    currentUser?.academicYear ?? ACADEMIC_YEARS[1]
  )
  const [enabledTypes, setEnabledTypes] = useState<AssignmentType[]>(
    currentUser?.enabledAssignmentTypes ?? DEFAULT_ENABLED_ASSIGNMENT_TYPES
  )

  if (!currentUser) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      fullName: fullName.trim(),
      login: login.trim(),
      bio: bio.trim() || undefined,
      group: currentUser.role === 'student' ? group.trim() || undefined : undefined,
      specialty: currentUser.role === 'student' ? specialty : undefined,
      course: currentUser.role === 'student' ? course : undefined,
      academicYear,
    })
    if (currentUser.role === 'teacher') {
      setEnabledAssignmentTypes(enabledTypes)
    }
  }

  const toggleType = (t: AssignmentType) => {
    setEnabledTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  return (
    <div className="page">
      <PageHeader title="Профиль" subtitle="Личные данные и настройки кабинета" />
      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <Avatar name={currentUser.fullName} size={80} />
          <h2 style={{ margin: '1rem 0 0.25rem', fontSize: '1.25rem' }}>{currentUser.fullName}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>@{currentUser.login}</p>
          <span className={`badge badge-${currentUser.role}`}>
            {currentUser.role === 'student'
              ? 'Студент'
              : currentUser.role === 'teacher'
                ? 'Преподаватель'
                : 'Админ'}
          </span>
          {currentUser.group && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
              Группа: <strong>{currentUser.group}</strong>
            </p>
          )}
          {currentUser.academicYear && (
            <p style={{ fontSize: '0.9rem' }}>
              Учебный год: <strong>{currentUser.academicYear}</strong>
            </p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Редактировать</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ФИО</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Логин</label>
              <input value={login} onChange={(e) => setLogin(e.target.value)} required />
            </div>
            {currentUser.role === 'student' && (
              <>
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
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Курс</label>
                    <select value={course} onChange={(e) => setCourse(Number(e.target.value))}>
                      {[1, 2, 3, 4].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Группа</label>
                    <input
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="ПД-21"
                    />
                  </div>
                </div>
              </>
            )}
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
              <label>О себе</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Краткая информация..."
              />
            </div>

            {currentUser.role === 'teacher' && (
              <div className="form-group">
                <label>Типы заданий в кабинете</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                  Отметьте, какие пункты показывать при создании задания
                </p>
                <div className="checkbox-grid">
                  {ALL_ASSIGNMENT_TYPES.map((t) => (
                    <label key={t} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={enabledTypes.includes(t)}
                        onChange={() => toggleType(t)}
                      />
                      {assignmentTypeLabels[t]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary">
              Сохранить
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
