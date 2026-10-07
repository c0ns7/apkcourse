import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { dayLabels } from '../../utils/helpers'

export function StudentSchedule() {
  const { data, currentUser } = useApp()
  if (!currentUser) return null

  const group = currentUser.group || 'ПД-21'
  const items = data.schedule.filter((s) => s.group === group)

  return (
    <div className="page">
      <PageHeader title="Расписание" subtitle={`Группа ${group}`} />

      <div className="schedule-grid">
        {dayLabels.map((day, i) => {
          const dayItems = items.filter((s) => s.day === i)
          return (
            <div key={day} className="schedule-day">
              <h4>{day}</h4>
              {dayItems.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>—</p>
              ) : (
                dayItems.map((item) => {
                  const subject = data.subjects.find((s) => s.id === item.subjectId)
                  return (
                    <div key={item.id} className="schedule-item" style={{ borderLeftColor: subject?.color }}>
                      <strong>{subject?.title ?? 'Занятие'}</strong>
                      <span>{item.timeStart} – {item.timeEnd}</span>
                      <span>ауд. {item.room}</span>
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
