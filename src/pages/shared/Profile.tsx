import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../../components/Avatar'
import { PageHeader } from '../../components/PageHeader'
import { formatPhoneDisplay } from '../../utils/helpers'

export function Profile() {
  const { currentUser, updateProfile } = useApp()
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [bio, setBio] = useState(currentUser?.bio ?? '')
  const [group, setGroup] = useState(currentUser?.group ?? '')

  if (!currentUser) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      group: currentUser.role === 'student' ? group.trim() || undefined : undefined,
    })
  }

  return (
    <div className="page">
      <PageHeader title="Профиль" subtitle="Личные данные и настройки" />
      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <Avatar name={currentUser.fullName} size={80} />
          <h2 style={{ margin: '1rem 0 0.25rem', fontSize: '1.25rem' }}>{currentUser.fullName}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{formatPhoneDisplay(currentUser.phone)}</p>
          <span className={`badge badge-${currentUser.role}`}>
            {currentUser.role === 'student' ? 'Студент' : currentUser.role === 'teacher' ? 'Преподаватель' : 'Админ'}
          </span>
          {currentUser.group && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Группа: <strong>{currentUser.group}</strong></p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Редактировать</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ФИО</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 ..." />
            </div>
            {currentUser.role === 'student' && (
              <div className="form-group">
                <label>Группа</label>
                <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="ПД-21" />
              </div>
            )}
            <div className="form-group">
              <label>О себе</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Краткая информация..." />
            </div>
            <button type="submit" className="btn-primary">Сохранить</button>
          </form>
        </div>
      </div>
    </div>
  )
}
