import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { ScheduleBoard } from '../../components/ScheduleBoard'
import { api } from '../../api'
import {
  adminCanManageSchedule,
  dayLabels,
  getStudyWeekNumber,
} from '../../utils/helpers'
import { buildScheduleGroupOptions } from '../../utils/scheduleGroups'

export function AdminSchedule() {
  const { data, currentUser, refresh } = useApp()
  const canEdit = adminCanManageSchedule(currentUser)
  const currentWeek = getStudyWeekNumber()
  const groupOptions = useMemo(
    () => buildScheduleGroupOptions(data.schedule),
    [data.schedule]
  )
  const [selectedKey, setSelectedKey] = useState('')
  const [week, setWeek] = useState<1 | 2>(currentWeek)

  useEffect(() => {
    if (!selectedKey && groupOptions[0]) setSelectedKey(groupOptions[0].key)
  }, [groupOptions, selectedKey])

  const selected = groupOptions.find((g) => g.key === selectedKey)
  const group = selected?.name || ''

  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    day: 0,
    timeStart: '08:30',
    timeEnd: '10:00',
    teacherName: '',
    room: '',
    week: '' as '' | '1' | '2',
    subgroup: '',
  })

  const lessons = data.schedule.filter((s) => {
    if (!selected) return false
    if (s.group !== selected.name) return false
    if (selected.specialty) return s.specialty === selected.specialty
    return !s.specialty
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit || !group) return
    setBusy(true)
    setError('')
    try {
      await api.createScheduleLesson({
        group,
        day: form.day,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        title: form.title.trim(),
        teacherName: form.teacherName.trim() || undefined,
        room: form.room.trim() || undefined,
        week: form.week ? Number(form.week) : null,
        subgroup: form.subgroup || undefined,
        specialty: selected?.specialty,
      })
      await refresh()
      setShowModal(false)
      setForm({
        title: '',
        day: 0,
        timeStart: '08:30',
        timeEnd: '10:00',
        teacherName: '',
        room: '',
        week: '',
        subgroup: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canEdit || !confirm('Удалить занятие?')) return
    await api.deleteScheduleLesson(id)
    await refresh()
  }

  return (
    <div className="page">
      <PageHeader
        title="Расписание"
        subtitle={`Сейчас ${currentWeek}-я учебная неделя (отсчёт с 1 сентября)`}
        actions={
          canEdit ? (
            <button
              type="button"
              className="btn-primary"
              disabled={!group}
              onClick={() => setShowModal(true)}
            >
              + Занятие
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          У вашей учётной записи нет права «Расписание занятий». Его выдаёт root в карточке
          пользователя.
        </div>
      )}

      <div className="dash-toolbar" style={{ marginBottom: '1rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Группа</label>
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
            {!groupOptions.length && <option value="">Нет данных</option>}
            {groupOptions.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-chips" style={{ margin: 0, alignSelf: 'end' }}>
          <button
            type="button"
            className={`chip ${week === 1 ? 'active' : ''}`}
            onClick={() => setWeek(1)}
          >
            1 неделя
          </button>
          <button
            type="button"
            className={`chip ${week === 2 ? 'active' : ''}`}
            onClick={() => setWeek(2)}
          >
            2 неделя
          </button>
        </div>
      </div>

      <ScheduleBoard lessons={lessons} week={week} />

      {canEdit && group && (
        <div className="card table-wrap" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>
            Все занятия · {selected?.label || group}
          </h3>
          <table>
            <thead>
              <tr>
                <th>День</th>
                <th>Время</th>
                <th>Занятие</th>
                <th>Нед.</th>
                <th>Подгр.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lessons
                .slice()
                .sort(
                  (a, b) =>
                    a.day - b.day ||
                    a.timeStart.localeCompare(b.timeStart) ||
                    String(a.subgroup || '').localeCompare(String(b.subgroup || ''))
                )
                .map((L) => (
                  <tr key={L.id}>
                    <td>{dayLabels[L.day] || L.day}</td>
                    <td>
                      {L.timeStart}–{L.timeEnd}
                    </td>
                    <td>
                      {L.title}
                      {L.teacherName ? ` · ${L.teacherName}` : ''}
                      {L.room ? ` · ${L.room}` : ''}
                    </td>
                    <td>{L.week ?? 'каждая'}</td>
                    <td>{L.subgroup || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => void handleDelete(L.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новое занятие · группа {group}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={(e) => void handleCreate(e)}>
              <div className="form-group">
                <label>Название</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>День</label>
                <select
                  value={form.day}
                  onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
                >
                  {dayLabels.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Начало</label>
                  <input
                    type="time"
                    value={form.timeStart}
                    onChange={(e) => setForm((f) => ({ ...f, timeStart: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Конец</label>
                  <input
                    type="time"
                    value={form.timeEnd}
                    onChange={(e) => setForm((f) => ({ ...f, timeEnd: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Преподаватель</label>
                <input
                  value={form.teacherName}
                  onChange={(e) => setForm((f) => ({ ...f, teacherName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Аудитория</label>
                <input
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Неделя</label>
                  <select
                    value={form.week}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, week: e.target.value as '' | '1' | '2' }))
                    }
                  >
                    <option value="">Каждая</option>
                    <option value="1">Только 1</option>
                    <option value="2">Только 2</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Подгруппа</label>
                  <select
                    value={form.subgroup}
                    onChange={(e) => setForm((f) => ({ ...f, subgroup: e.target.value }))}
                  >
                    <option value="">Вся группа</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? 'Сохранение…' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
