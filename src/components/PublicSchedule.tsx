import { useEffect, useState } from 'react'
import type { ScheduleItem } from '../types'
import { ScheduleBoard } from './ScheduleBoard'
import { getStudyWeekNumber } from '../utils/helpers'
import { scheduleGroupKey, type ScheduleGroupOption } from '../utils/scheduleGroups'

type PublicResponse = {
  currentWeek: 1 | 2
  week: 1 | 2
  groups: string[]
  groupOptions?: ScheduleGroupOption[]
  lessons: ScheduleItem[]
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || ''

function normalizeOptions(data: PublicResponse): ScheduleGroupOption[] {
  if (data.groupOptions?.length) {
    return data.groupOptions.map((g) => ({
      ...g,
      key: g.key || scheduleGroupKey(g.name, g.specialty),
      label: g.label || (g.specialty ? `${g.name} — ${g.specialty}` : g.name),
    }))
  }
  return (data.groups || []).map((name) => ({
    key: scheduleGroupKey(name),
    name,
    label: name,
  }))
}

export function PublicSchedule() {
  const [options, setOptions] = useState<ScheduleGroupOption[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [currentWeek, setCurrentWeek] = useState<1 | 2>(getStudyWeekNumber())
  const [week, setWeek] = useState<1 | 2>(getStudyWeekNumber())
  const [lessons, setLessons] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selected = options.find((o) => o.key === selectedKey)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/schedule`)
        const data = (await res.json()) as PublicResponse
        if (cancelled) return
        const opts = normalizeOptions(data)
        setOptions(opts)
        setCurrentWeek(data.currentWeek)
        setWeek(data.currentWeek)
        if (opts.length) setSelectedKey((k) => k || opts[0].key)
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
    if (!selected) {
      setLessons([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams({
          group: selected.name,
          week: String(week),
        })
        if (selected.specialty) params.set('specialty', selected.specialty)
        const res = await fetch(`${API_BASE}/api/public/schedule?${params}`)
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
  }, [selected, week])

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
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                disabled={loading}
              >
                {!options.length && <option value="">Нет данных</option>}
                {options.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
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
            emptyText={
              selected
                ? `Для группы ${selected.label} на ${week}-й неделе занятий нет`
                : 'Выберите группу'
            }
          />
        )}
      </div>
    </section>
  )
}
