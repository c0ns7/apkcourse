import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Auth.css'

export function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(phone, password)
    if ('error' in result) {
      setError(result.error)
      return
    }
    const { user } = result
    if (user.role === 'student') navigate('/student')
    else if (user.role === 'teacher') navigate('/teacher')
    else navigate('/admin')
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <Link to="/" className="auth-back">
          ← На главную
        </Link>
        <h1>Вход</h1>
        <p className="auth-sub">Агинский педагогический колледж им. Базара Ринчино</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Номер телефона</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (924) 555-12-34"
              autoComplete="tel"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block">
            Войти
          </button>
        </form>
        <p className="auth-note">Аккаунт выдаёт администратор колледжа.</p>
        <div className="demo-hint">
          <strong>Демо-аккаунты:</strong>
          <br />
          Студент: <code>+7 (924) 555-12-34</code> / <code>student123</code>
          <br />
          Преподаватель: <code>+7 (924) 123-45-67</code> / <code>teacher123</code>
          <br />
          Админ: <code>+7 (900) 000-00-01</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  )
}
