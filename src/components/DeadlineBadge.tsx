import { deadlineLabels, getDeadlineStatus } from '../utils/helpers'

export function DeadlineBadge({ deadline }: { deadline: string }) {
  const status = getDeadlineStatus(deadline)
  return (
    <span className={`deadline-badge deadline-${status}`}>
      {deadlineLabels[status]}
    </span>
  )
}
