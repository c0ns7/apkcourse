import { Icon, type IconName } from './Icon'

export function EmptyState({
  icon = 'inbox',
  title,
  description,
}: {
  icon?: IconName
  title: string
  description?: string
}) {
  return (
    <div className="empty-state card">
      <span className="empty-icon">
        <Icon name={icon} size={40} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  )
}
