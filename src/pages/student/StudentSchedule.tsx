import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { ScheduleBoard } from '../../components/ScheduleBoard'
import { getStudyWeekNumber } from '../../utils/helpers'
import { matchStudentSchedule } from '../../utils/scheduleGroups'

export function StudentSchedule() {
  const { data, currentUser } = useApp()
  const currentWeek = getStudyWeekNumber()
  const [week, setWeek] = useState<1 | 2>(currentWeek)

  if (!currentUser) return null

  const groupMeta = useMemo(() => {
    let groupCode = ''
    let specialty = currentUser.specialty || ''
    if (currentUser.groupId) {
      const g = data.groups.find((x) => x.id === currentUser.groupId)
      if (g) {
        const m = g.name.match(/(\d{2,4})/)
        groupCode = m ? m[1] : g.name
        if (!specialty && g.specialty) specialty = g.specialty
      }
    }
    if (!groupCode && currentUser.group) {
      const m = currentUser.group.match(/(\d{2,4})/)
      groupCode = m ? m[1] : currentUser.group
    }
    return { groupCode, specialty }
  }, [currentUser, data.groups])

  const groupCode = groupMeta.groupCode
  const items = matchStudentSchedule(data.schedule, groupCode, groupMeta.specialty)

  return (
    <div className="page">
      <PageHeader
        title="Расписание"
        subtitle={
          groupCode
            ? `Группа ${currentUser.group || groupCode} · сейчас ${currentWeek}-я учебная неделя`
            : 'Группа не назначена'
        }
      />

      <div className="filter-chips" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`chip ${week === 1 ? 'active' : ''}`}
          onClick={() => setWeek(1)}
        >
          1 неделя{currentWeek === 1 ? ' · текущая' : ''}
        </button>
        <button
          type="button"
          className={`chip ${week === 2 ? 'active' : ''}`}
          onClick={() => setWeek(2)}
        >
          2 неделя{currentWeek === 2 ? ' · текущая' : ''}
        </button>
      </div>

      {!groupCode ? (
        <div className="card empty-state">Обратитесь к администратору для назначения группы</div>
      ) : (
        <ScheduleBoard
          lessons={items}
          week={week}
          emptyText={`На ${week}-й неделе занятий нет`}
        />
      )}
    </div>
  )
}
