import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './SiteChrome.css'

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-chrome">
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>

      <div className="official-bar" role="banner">
        <div className="official-bar-inner">
          <span className="official-flag" aria-hidden />
          <p>
            Официальный образовательный портал · субъект РФ · обработка персональных данных
            в соответствии с 152-ФЗ
          </p>
        </div>
      </div>

      <header className="site-header">
        <Link to="/" className="site-brand">
          <span className="logo-mark" aria-hidden>
            АПК
          </span>
          <div>
            <strong>Агинский педагогический колледж</strong>
            <span>имени Базара Ринчино · образовательный портал</span>
          </div>
        </Link>
        <nav className="site-header-nav" aria-label="Основная навигация">
          <Link to="/privacy">Персональные данные</Link>
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
            <p>
              Образовательный портал. Оператор персональных данных — образовательная организация.
              Политика обработки ПДн размещена в открытом доступе.
            </p>
          </div>
          <div className="site-footer-links">
            <Link to="/privacy">Обработка персональных данных</Link>
            <Link to="/login">Вход в личный кабинет</Link>
            <a
              href="https://rkn.gov.ru/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Роскомнадзор
            </a>
          </div>
          <p className="site-footer-copy">
            © {new Date().getFullYear()} Агинский педагогический колледж им. Базара Ринчино.
            Версия интерфейса ориентирована на требования доступности и информирования субъектов ПДн.
          </p>
        </div>
      </footer>
    </div>
  )
}
