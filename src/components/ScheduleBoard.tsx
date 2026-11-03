import type { ScheduleItem } from '../types'
import { dayLabels, lessonVisibleOnWeek } from '../utils/helpers'

type Props = {
  lessons: ScheduleItem[]
  week: 1 | 2
  emptyText?: string
}

export function ScheduleBoard({ lessons, week, emptyText = 'Нет занятий' }: Props) {
  const visible = lessons.filter((L) => lessonVisibleOnWeek(L.week, week))

  return (
    <div className="schedule-grid">
      {dayLabels.map((day, i) => {
        const dayItems = visible
          .filter((s) => s.day === i)
          .slice()
          .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
        return (
          <div key={day} className="schedule-day">
            <h4>{day}</h4>
            {dayItems.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>—</p>
            ) : (
              dayItems.map((item) => (
                <div key={item.id} className="schedule-item">
                  <strong>{item.title || 'Занятие'}</strong>
                  <span>
                    {item.timeStart} – {item.timeEnd}
                  </span>
                  {item.teacherName && <span>{item.teacherName}</span>}
                  {(item.room || item.subgroup || item.week) && (
                    <span>
                      {item.room ? item.room : ''}
                      {item.subgroup ? `${item.room ? ' · ' : ''}${item.subgroup} подгр.` : ''}
                      {item.week ? `${item.room || item.subgroup ? ' · ' : ''}${item.week} нед.` : ''}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )
      })}
      {!visible.length && (
        <p style={{ gridColumn: '1 / -1', opacity: 0.7, margin: 0 }}>{emptyText}</p>
      )}
    </div>
  )
}
