import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Role } from '../types'

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Role[]
}) {
  const { currentUser, loading } = useApp()

  if (loading) {
    return (
      <div className="page" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
        Загрузка…
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(currentUser.role)) {
    const redirect =
      currentUser.role === 'student'
        ? '/student'
        : currentUser.role === 'teacher'
          ? '/teacher'
          : '/admin'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
