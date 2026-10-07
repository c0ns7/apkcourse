import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { AttachmentFile } from '../../components/AttachmentFile'
import { DeadlineBadge } from '../../components/DeadlineBadge'
import { EmptyState } from '../../components/EmptyState'
import { assignmentTypeLabels, formatDate, getDeadlineStatus, GRADE_MAX } from '../../utils/helpers'

type Filter = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue'

const statusLabels = {
  pending: 'Не сдано',
  submitted: 'На проверке',
  graded: 'Оценено',
  returned: 'На доработке',
}

export function StudentAssignments() {
  const { data, currentUser } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  if (!currentUser) return null

  const mySubjects = data.subjects.filter((s) => s.studentIds.includes(currentUser.id))
  const myAssignments = data.assignments.filter((a) =>
    mySubjects.some((s) => s.id === a.subjectId)
  )
  const mySubmissions = data.submissions.filter((s) => s.studentId === currentUser.id)

  const filtered = useMemo(() => {
    return myAssignments.filter((a) => {
      const sub = mySubmissions.find((s) => s.assignmentId === a.id)
      const status = sub?.status ?? 'pending'
      const overdue = getDeadlineStatus(a.deadline) === 'overdue' && status !== 'graded' && status !== 'submitted'

      if (filter === 'pending' && status !== 'pending' && status !== 'returned') return false
      if (filter === 'submitted' && status !== 'submitted') return false
      if (filter === 'graded' && status !== 'graded') return false
      if (filter === 'overdue' && !overdue) return false

      const q = search.toLowerCase()
      if (q && !a.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [myAssignments, mySubmissions, filter, search])

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'pending', label: 'К сдаче' },
    { id: 'submitted', label: 'На проверке' },
    { id: 'graded', label: 'Оценено' },
    { id: 'overdue', label: 'Просрочено' },
  ]

  return (
    <div className="page">
      <PageHeader title="Задания" subtitle={`${myAssignments.length} заданий по вашим предметам`} />

      <SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию..." />

      <div className="filter-chips">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${filter === c.id ? 'active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="book" title="Заданий не найдено" description="Попробуйте другой фильтр" />
      ) : (
        <div className="grid-2">
          {filtered.map((a) => {
            const subject = data.subjects.find((s) => s.id === a.subjectId)
            const sub = mySubmissions.find((s) => s.assignmentId === a.id)
            return (
              <Link
                key={a.id}
                to={`/student/assignment/${a.id}`}
                className="card card-hover assignment-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="assignment-card-top">
                  <span className="badge badge-submitted">{subject?.title}</span>
                  <DeadlineBadge deadline={a.deadline} />
                </div>
                <h3>{a.title}</h3>
                {a.type && (
                  <span className="badge" style={{ background: 'var(--accent-soft)', color: '#78350f' }}>
                    {assignmentTypeLabels[a.type]}
                  </span>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Срок: {formatDate(a.deadline)} · оценка 2–5
                </p>
                <span className={`badge badge-${sub?.status ?? 'pending'}`}>
                  {statusLabels[sub?.status ?? 'pending']}
                  {sub?.status === 'graded' && sub.score != null && ` · оценка ${sub.score}/${GRADE_MAX}`}
                </span>
                {a.attachmentName && (
                  <AttachmentFile name={a.attachmentName} label="Документ" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
