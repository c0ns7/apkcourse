import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { formatDateTime } from '../../utils/helpers'
import { EmptyState } from '../../components/EmptyState'

export function Notifications() {
  const { data, currentUser, markNotificationRead, markAllNotificationsRead } = useApp()
  if (!currentUser) return null

  const items = data.notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="page">
      <PageHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} непрочитанных` : 'Все прочитаны'}
        actions={
          unread > 0 ? (
            <button type="button" className="btn-secondary btn-sm" onClick={markAllNotificationsRead}>
              Прочитать все
            </button>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon="bell" title="Нет уведомлений" description="Здесь появятся оценки, задания и объявления" />
      ) : (
        <div className="notifications-list">
          {items.map((n) => (
            <div
              key={n.id}
              className={`card notification-item ${!n.read ? 'unread' : ''}`}
              onClick={() => markNotificationRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && markNotificationRead(n.id)}
            >
              <div className="notification-content">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{formatDateTime(n.createdAt)}</small>
              </div>
              {n.link && (
                <Link to={n.link} className="btn-primary btn-sm" onClick={(e) => e.stopPropagation()}>
                  Открыть
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
