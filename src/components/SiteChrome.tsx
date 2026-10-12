import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './SiteChrome.css'

export function SiteChrome({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'login' }) {
  return (
    <div className={`site-chrome ${variant === 'login' ? 'site-chrome-login' : ''}`}>
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>

      {variant !== 'login' && (
        <header className="sg-public-header">
          <nav className="sg-public-menu">
            <Link to="/" className="sg-public-home" title="Главная">
              АПК
            </Link>
            <Link to="/" className="sg-public-item">
              Портал
            </Link>
            <Link to="/privacy" className="sg-public-item">
              Конфиденциальность
            </Link>
            <div className="sg-public-actions">
              <Link to="/login" className="sg-public-login">
                Войти
              </Link>
            </div>
          </nav>
        </header>
      )}

      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>

      {variant !== 'login' && (
        <footer className="site-footer">
          <div className="site-footer-inner">
            <strong>Агинский педагогический колледж им. Базара Ринчино</strong>
            <div className="site-footer-links">
              <Link to="/privacy">Конфиденциальность</Link>
              <Link to="/login">Личный кабинет</Link>
            </div>
            <p className="site-footer-copy">
              © {new Date().getFullYear()} Образовательный портал АПК
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
