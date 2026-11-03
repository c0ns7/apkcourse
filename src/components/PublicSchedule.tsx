import { useEffect, useState } from 'react'
import type { ScheduleItem } from '../types'
import { ScheduleBoard } from './ScheduleBoard'
import { getStudyWeekNumber } from '../utils/helpers'

type PublicResponse = {
  currentWeek: 1 | 2
  week: 1 | 2
  groups: string[]
  lessons: ScheduleItem[]
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || ''

export function PublicSchedule() {
  const [groups, setGroups] = useState<string[]>([])
  const [group, setGroup] = useState('')
  const [currentWeek, setCurrentWeek] = useState<1 | 2>(getStudyWeekNumber())
  const [week, setWeek] = useState<1 | 2>(getStudyWeekNumber())
  const [lessons, setLessons] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/schedule`)
        const data = (await res.json()) as PublicResponse
        if (cancelled) return
        setGroups(data.groups || [])
        setCurrentWeek(data.currentWeek)
        setWeek(data.currentWeek)
        if (data.groups?.length) setGroup((g) => g || data.groups[0])
      } catch {
        if (!cancelled) setError('Не удалось загрузить расписание')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!group) {
      setLessons([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/schedule?group=${encodeURIComponent(group)}&week=${week}`
        )
        const data = (await res.json()) as PublicResponse
        if (cancelled) return
        setLessons(data.lessons || [])
        setCurrentWeek(data.currentWeek)
      } catch {
        if (!cancelled) setError('Ошибка загрузки группы')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [group, week])

  return (
    <section className="landing-schedule" id="schedule" aria-label="Расписание занятий">
      <div className="landing-schedule-inner">
        <div className="landing-schedule-head">
          <div>
            <p className="landing-schedule-kicker">Расписание</p>
            <h2>Занятия по группам</h2>
            <p>
              Сейчас идёт <strong>{currentWeek}-я</strong> учебная неделя
              <span style={{ opacity: 0.75 }}> (отсчёт с 1 сентября)</span>
            </p>
          </div>
          <div className="landing-schedule-controls">
            <label>
              Группа
              <select value={group} onChange={(e) => setGroup(e.target.value)} disabled={loading}>
                {!groups.length && <option value="">Нет данных</option>}
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <div className="filter-chips" style={{ margin: 0 }}>
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
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p style={{ opacity: 0.7 }}>Загрузка…</p>
        ) : (
          <ScheduleBoard
            lessons={lessons}
            week={week}
            emptyText={group ? `Для группы ${group} на ${week}-й неделе занятий нет` : 'Выберите группу'}
          />
        )}
      </div>
    </section>
  )
}
