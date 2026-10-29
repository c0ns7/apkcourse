import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Auth'
import { Profile } from './pages/shared/Profile'
import { Notifications } from './pages/shared/Notifications'
import { AnnouncementsPage } from './pages/shared/AnnouncementsPage'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentAssignments } from './pages/student/StudentAssignments'
import { StudentAssignment } from './pages/student/StudentAssignment'
import { StudentGrades } from './pages/student/StudentGrades'
import { StudentSchedule } from './pages/student/StudentSchedule'
import { TeacherDashboard } from './pages/teacher/TeacherDashboard'
import { TeacherSubjects } from './pages/teacher/TeacherSubjects'
import { TeacherSubjectDetail } from './pages/teacher/TeacherSubjectDetail'
import { TeacherStudents } from './pages/teacher/TeacherStudents'
import { TeacherGrading } from './pages/teacher/TeacherGrading'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminLogs } from './pages/admin/AdminLogs'
import { ChatPage } from './pages/shared/ChatPage'
import { PrivacyPolicy } from './pages/PrivacyPolicy'

function HomeRedirect() {
  const { currentUser, loading } = useApp()
  if (loading) {
    return (
      <div className="page" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
        Загрузка…
      </div>
    )
  }
  if (!currentUser) return <Landing />
  if (currentUser.role === 'student') return <Navigate to="/student" replace />
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />
  return <Navigate to="/admin" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />

        <Route
          path="student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/assignments"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/assignment/:id"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/grades"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentGrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/schedule"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/announcements"
          element={
            <ProtectedRoute roles={['student']}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/chat"
          element={
            <ProtectedRoute roles={['student']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="teacher"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/subjects"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/subjects/:id"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherSubjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/students"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/grading"
          element={
            <ProtectedRoute roles={['teacher']}>
              <TeacherGrading />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/announcements"
          element={
            <ProtectedRoute roles={['teacher']}>
              <AnnouncementsPage canCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher/chat"
          element={
            <ProtectedRoute roles={['teacher']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/announcements"
          element={
            <ProtectedRoute roles={['admin']}>
              <AnnouncementsPage canCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
