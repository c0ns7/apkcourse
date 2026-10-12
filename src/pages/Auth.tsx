import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  ACADEMIC_YEARS,
  CURRENT_ACADEMIC_YEAR,
  SPECIALTIES,
} from '../utils/helpers'
import './Auth.css'

type Tab = 'login' | 'register'
type RegRole = 'student' | 'teacher'

export function Login() {
  const { login, register, data } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState('')

  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')

  const [regRole, setRegRole] = useState<RegRole>('student')
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [course, setCourse] = useState(1)
  const [group, setGroup] = useState('')
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [regLogin, setRegLogin] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [disciplines, setDisciplines] = useState<string[]>([])

  const catalog = useMemo(() => {
    const fromSubjects = data.subjects.map((s) => s.title)
    return Array.from(new Set([...data.disciplineCatalog, ...fromSubjects]))
  }, [data.disciplineCatalog, data.subjects])

  const goHome = (role: string) => {
    if (role === 'student') navigate('/student')
    else if (role === 'teacher') navigate('/teacher')
    else navigate('/admin')
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(loginName, password)
    if ('error' in result) {
      setError(result.error)
      return
    }
    goHome(result.user.role)
  }

  const toggleDiscipline = (title: string) => {
    setDisciplines((prev) =>
      prev.includes(title) ? prev.filter((x) => x !== title) : [...prev, title]
    )
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!consent) {
      setError('Необходимо согласие на обработку персональных данных')
      return
    }
    if (regPassword.length < 6) {
      setError('Пароль не менее 6 символов')
      return
    }
    if (regRole === 'teacher' && disciplines.length === 0) {
      setError('Выберите хотя бы одну дисциплину')
      return
    }

    const disciplineIds =
      regRole === 'teacher'
        ? data.subjects
            .filter((s) => disciplines.includes(s.title))
            .map((s) => s.id)
        : undefined

    const err = register({
      login: regLogin,
      password: regPassword,
      fullName,
      role: regRole,
      group: regRole === 'student' ? group : undefined,
      specialty: regRole === 'student' ? specialty : undefined,
      course: regRole === 'student' ? course : undefined,
      academicYear,
      disciplineIds,
      disciplines: regRole === 'teacher' ? disciplines : undefined,
      personalDataConsent: consent,
    })
    if (err) {
      setError(err)
      return
    }
    goHome(regRole)
  }

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: tab === 'register' ? 520 : 420 }}>
        <Link to="/" className="auth-back">
          ← На главную
        </Link>
        <div className="auth-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'active' : ''}
            onClick={() => {
              setTab('login')
              setError('')
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'active' : ''}
            onClick={() => {
              setTab('register')
              setError('')
            }}
          >
            Регистрация
          </button>
        </div>

        {tab === 'login' ? (
          <>
            <h1>Вход</h1>
            <p className="auth-sub">Агинский педагогический колледж им. Базара Ринчино</p>
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
              <button type="submit" className="btn-primary btn-block">
                Войти
              </button>
            </form>
            <div className="demo-hint">
              <strong>Демо-аккаунты:</strong>
              <br />
              Студент: <code>student</code> / <code>student123</code>
              <br />
              Преподаватель: <code>teacher</code> / <code>teacher123</code>
              <br />
              Админ: <code>admin</code> / <code>admin123</code>
            </div>
          </>
        ) : (
          <>
            <h1>Регистрация</h1>
            <p className="auth-sub">Создайте аккаунт студента или преподавателя</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Роль</label>
                <div className="auth-role-row">
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="regRole"
                      checked={regRole === 'student'}
                      onChange={() => setRegRole('student')}
                    />
                    Студент
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="regRole"
                      checked={regRole === 'teacher'}
                      onChange={() => setRegRole('teacher')}
                    />
                    Преподаватель
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fullName">ФИО</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {regRole === 'student' && (
                <>
                  <div className="form-group">
                    <label htmlFor="specialty">Специальность</label>
                    <select
                      id="specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    >
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="course">Курс</label>
                      <select
                        id="course"
                        value={course}
                        onChange={(e) => setCourse(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="group">Группа</label>
                      <input
                        id="group"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        placeholder="ПД-21"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {regRole === 'teacher' && (
                <div className="form-group">
                  <label>Дисциплины</label>
                  <div className="checkbox-grid">
                    {catalog.map((title) => (
                      <label key={title} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={disciplines.includes(title)}
                          onChange={() => toggleDiscipline(title)}
                        />
                        {title}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="academicYear">Учебный год</label>
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="regLogin">Логин</label>
                <input
                  id="regLogin"
                  value={regLogin}
                  onChange={(e) => setRegLogin(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="regPassword">Пароль</label>
                <input
                  id="regPassword"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <label className="checkbox-label consent-label">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Согласен(на) на обработку персональных данных
              </label>

              <button type="submit" className="btn-primary btn-block" disabled={!consent}>
                Зарегистрироваться
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
