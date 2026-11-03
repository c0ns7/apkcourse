import type { ScheduleItem } from '../types'
import { dayLabels, lessonVisibleOnWeek } from '../utils/helpers'

type Props = {
  lessons: ScheduleItem[]
  week: 1 | 2
  emptyText?: string
}

function LessonCard({ item }: { item: ScheduleItem }) {
  return (
    <div className="schedule-card">
      <strong className="schedule-card-title">{item.title || 'Занятие'}</strong>
      {item.teacherName && <span className="schedule-card-meta">{item.teacherName}</span>}
      {item.room && <span className="schedule-card-meta">{item.room}</span>}
      {item.week != null && (
        <span className="schedule-weekchip">{item.week} неделя</span>
      )}
    </div>
  )
}

function TimeSlot({
  timeStart,
  timeEnd,
  items,
}: {
  timeStart: string
  timeEnd: string
  items: ScheduleItem[]
}) {
  const whole = items.filter((x) => !x.subgroup)
  const sub1 = items.filter((x) => x.subgroup === '1')
  const sub2 = items.filter((x) => x.subgroup === '2')
  const hasSubs = sub1.length > 0 || sub2.length > 0

  return (
    <div className="schedule-slot">
      <div className="schedule-slot-time">
        {timeStart}–{timeEnd}
      </div>

      {whole.map((item) => (
        <LessonCard key={item.id} item={item} />
      ))}

      {hasSubs && (
        <div className="schedule-subgrid">
          <div className="schedule-subcol">
            <span className="schedule-subbadge">1 подгруппа</span>
            {sub1.length ? (
              sub1.map((item) => <LessonCard key={item.id} item={item} />)
            ) : (
              <span className="schedule-subempty">—</span>
            )}
          </div>
          <div className="schedule-subcol">
            <span className="schedule-subbadge">2 подгруппа</span>
            {sub2.length ? (
              sub2.map((item) => <LessonCard key={item.id} item={item} />)
            ) : (
              <span className="schedule-subempty">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ScheduleBoard({ lessons, week, emptyText = 'Нет занятий' }: Props) {
  const visible = lessons.filter((L) => lessonVisibleOnWeek(L.week, week))

  return (
    <div className="schedule-grid">
      {dayLabels.map((day, i) => {
        const dayItems = visible.filter((s) => s.day === i)
        const times = [
          ...new Set(dayItems.map((s) => `${s.timeStart}|${s.timeEnd}`)),
        ].sort((a, b) => a.localeCompare(b))

        return (
          <div key={day} className="schedule-day">
            <h4>{day}</h4>
            {times.length === 0 ? (
              <p className="schedule-day-empty">—</p>
            ) : (
              times.map((key) => {
                const [timeStart, timeEnd] = key.split('|')
                const slotItems = dayItems
                  .filter((s) => s.timeStart === timeStart && s.timeEnd === timeEnd)
                  .slice()
                  .sort((a, b) => String(a.subgroup || '').localeCompare(String(b.subgroup || '')))
                return (
                  <TimeSlot
                    key={key}
                    timeStart={timeStart}
                    timeEnd={timeEnd}
                    items={slotItems}
                  />
                )
              })
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
