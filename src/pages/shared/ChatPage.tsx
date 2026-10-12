import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/PageHeader'
import { Avatar } from '../../components/Avatar'
import { formatDateTime } from '../../utils/helpers'
import './ChatPage.css'

export function ChatPage() {
  const {
    data,
    currentUser,
    getOrCreateChatThread,
    sendChatMessage,
    markThreadRead,
  } = useApp()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [newTeacherId, setNewTeacherId] = useState('')
  const [newStudentId, setNewStudentId] = useState('')

  if (!currentUser) return null

  const myThreads = useMemo(() => {
    return data.chatThreads
      .filter(
        (t) =>
          t.studentId === currentUser.id || t.teacherId === currentUser.id
      )
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  }, [data.chatThreads, currentUser.id])

  useEffect(() => {
    if (!activeId && myThreads[0]) setActiveId(myThreads[0].id)
  }, [activeId, myThreads])

  useEffect(() => {
    if (activeId) markThreadRead(activeId)
  }, [activeId, data.chatMessages.length])

  const active = myThreads.find((t) => t.id === activeId)
  const messages = data.chatMessages
    .filter((m) => m.threadId === activeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const peer = active
    ? data.users.find(
        (u) =>
          u.id ===
          (currentUser.id === active.studentId ? active.teacherId : active.studentId)
      )
    : null

  const teachers = data.users.filter((u) => u.role === 'teacher')
  const students = data.users.filter((u) => {
    if (u.role !== 'student') return false
    if (currentUser.role !== 'teacher') return false
    return (
      u.teacherId === currentUser.id ||
      data.subjects.some(
        (s) => s.teacherId === currentUser.id && s.studentIds.includes(u.id)
      )
    )
  })

  const unreadCount = (threadId: string) =>
    data.chatMessages.filter(
      (m) => m.threadId === threadId && !m.read && m.senderId !== currentUser.id
    ).length

  const startChat = () => {
    const otherId = currentUser.role === 'student' ? newTeacherId : newStudentId
    if (!otherId) return
    const id = getOrCreateChatThread(otherId)
    setActiveId(id)
    setNewTeacherId('')
    setNewStudentId('')
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeId || !text.trim()) return
    sendChatMessage(activeId, text)
    setText('')
  }

  return (
    <div className="page">
      <PageHeader
        title="Чат"
        subtitle="Связь студента с преподавателем (прототип без сервера)"
      />

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          {currentUser.role === 'student' ? (
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Начать диалог с преподавателем</label>
              <select value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value)}>
                <option value="">Выберите...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Написать студенту</label>
              <select value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)}>
                <option value="">Выберите...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.group ? `(${s.group})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="button" className="btn-primary" onClick={startChat}>
            Открыть
          </button>
        </div>
      </div>

      <div className="chat-layout">
        <aside className="chat-threads card">
          {myThreads.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>Нет диалогов</p>
          ) : (
            myThreads.map((t) => {
              const other = data.users.find(
                (u) =>
                  u.id === (currentUser.id === t.studentId ? t.teacherId : t.studentId)
              )
              const unread = unreadCount(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`chat-thread-item ${activeId === t.id ? 'active' : ''}`}
                  onClick={() => setActiveId(t.id)}
                >
                  <Avatar name={other?.fullName ?? '?'} size={36} />
                  <div>
                    <strong>{other?.fullName ?? 'Пользователь'}</strong>
                    <small>{formatDateTime(t.updatedAt)}</small>
                  </div>
                  {unread > 0 && <span className="sidebar-badge">{unread}</span>}
                </button>
              )
            })
          )}
        </aside>

        <section className="chat-panel card">
          {!active ? (
            <p style={{ color: 'var(--text-muted)' }}>Выберите диалог</p>
          ) : (
            <>
              <header className="chat-panel-header">
                <Avatar name={peer?.fullName ?? '?'} size={40} />
                <div>
                  <strong>{peer?.fullName}</strong>
                  <small>{peer?.role === 'teacher' ? 'Преподаватель' : 'Студент'}</small>
                </div>
              </header>
              <div className="chat-messages">
                {messages.map((m) => {
                  const mine = m.senderId === currentUser.id
                  return (
                    <div key={m.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
                      <p>{m.body}</p>
                      <small>{formatDateTime(m.createdAt)}</small>
                    </div>
                  )
                })}
              </div>
              <form className="chat-compose" onSubmit={handleSend}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Напишите сообщение..."
                />
                <button type="submit" className="btn-primary" disabled={!text.trim()}>
                  Отправить
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
