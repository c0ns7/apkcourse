import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteChrome } from '../components/SiteChrome'
import { Icon } from '../components/Icon'
import { useApp } from '../context/AppContext'
import './Auth.css'

/** Положите фото сюда: public/college.jpg (или college.png / college.webp) */
const COLLEGE_PHOTO = '/college.jfif'

export function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoOk, setPhotoOk] = useState(true)

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
        <div className="auth-shell">
          <aside className={`auth-aside ${photoOk ? 'has-photo' : ''}`}>
            {photoOk && (
              <img
                className="auth-aside-photo"
                src={COLLEGE_PHOTO}
                alt="Здание Агинского педагогического колледжа"
                onError={() => setPhotoOk(false)}
              />
            )}
            <div className="auth-aside-shade" aria-hidden />
            <div className="auth-aside-content">
              <Link to="/" className="auth-aside-brand">
                АПК
              </Link>
              <h1 className="auth-aside-title">
                Агинский педагогический колледж
                <span>им. Базара Ринчино</span>
              </h1>
              <p className="auth-aside-text">
                Личный кабинет студента, преподавателя и администратора.
              </p>
              <ul className="auth-aside-list">
                <li>Задания и журнал оценок</li>
                <li>Расписание и объявления</li>
                <li>Чат с преподавателем</li>
              </ul>
            </div>
          </aside>

          <div className="auth-card">
            <Link to="/" className="auth-back">
              ← На главную
            </Link>
            <h2>Вход в кабинет</h2>
            <p className="auth-sub">Введите логин и пароль, выданные администратором</p>
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
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary btn-block" disabled={busy}>
                {busy ? 'Вход…' : 'Войти'}
              </button>
            </form>
            <p className="auth-hint">
              Самостоятельная регистрация недоступна. Обратитесь к администратору колледжа.
            </p>
            <p className="auth-legal">
              <Link to="/privacy">Политика конфиденциальности</Link>
            </p>
          </div>
        </div>
      </div>
    </SiteChrome>
  )
}
