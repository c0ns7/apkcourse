import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './SiteChrome.css'

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-chrome">
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>

      <header className="site-header">
        <Link to="/" className="site-brand">
          <span className="logo-mark" aria-hidden>
            АПК
          </span>
          <div>
            <strong>Агинский педагогический колледж</strong>
            <span>имени Базара Ринчино</span>
          </div>
        </Link>
        <nav className="site-header-nav" aria-label="Основная навигация">
          <Link to="/privacy">Конфиденциальность</Link>
          <Link to="/login" className="btn-primary btn-sm">
            Войти
          </Link>
        </nav>
      </header>

      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong>АПК им. Б. Ринчино</strong>
            <p>Образовательный портал колледжа для студентов и преподавателей.</p>
          </div>
          <div className="site-footer-links">
            <Link to="/privacy">Конфиденциальность</Link>
            <Link to="/login">Личный кабинет</Link>
          </div>
          <p className="site-footer-copy">
            © {new Date().getFullYear()} Агинский педагогический колледж им. Базара Ринчино
          </p>
        </div>
      </footer>
    </div>
  )
}
