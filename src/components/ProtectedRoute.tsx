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
  const { currentUser } = useApp()

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
