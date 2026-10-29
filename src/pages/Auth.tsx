import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteChrome } from '../components/SiteChrome'
import { useApp } from '../context/AppContext'
import './Auth.css'

export function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const goHome = (role: string) => {
    if (role === 'student') navigate('/student')
    else if (role === 'teacher') navigate('/teacher')
    else navigate('/admin')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await login(loginName, password)
      if ('error' in result) {
        setError(result.error)
        return
      }
      goHome(result.user.role)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SiteChrome variant="login">
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <Link to="/" className="auth-back">
            ← На главную
          </Link>
          <h1>
            АПК
            <br />
            <span style={{ fontSize: '0.62em', fontWeight: 400, color: '#9bd' }}>
              Образовательный портал
            </span>
          </h1>
          <p className="auth-sub">Вход в личный кабинет</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login">Логин</label>
              <input
                id="login"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                autoComplete="username"
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
            <button type="submit" className="btn-primary btn-block" disabled={busy}>
              {busy ? 'Вход…' : 'Войти'}
            </button>
          </form>
          <p className="auth-hint">
            Учётную запись выдаёт администратор. Самостоятельная регистрация недоступна.
          </p>
        </div>
      </div>
    </SiteChrome>
  )
}
