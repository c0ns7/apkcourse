import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import './Landing.css'

const features: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'book', title: 'Задания онлайн', desc: 'Получайте, выполняйте и сдавайте работы в личном кабинете' },
  { icon: 'check', title: 'Проверка и оценки', desc: 'Преподаватель проверяет и выставляет баллы с комментарием' },
  { icon: 'chart', title: 'Успеваемость', desc: 'Журнал оценок и статистика по предметам' },
  { icon: 'calendar', title: 'Расписание', desc: 'Расписание занятий по группам' },
  { icon: 'megaphone', title: 'Объявления', desc: 'Новости колледжа и сообщения преподавателей' },
  { icon: 'bell', title: 'Уведомления', desc: 'Оповещения о новых заданиях и оценках' },
]

const stats = [
  { num: '500+', label: 'Студентов' },
  { num: '40+', label: 'Преподавателей' },
  { num: '15+', label: 'Специальностей' },
  { num: '85', label: 'Лет истории' },
]

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden></div>
      <header className="landing-header">
        <div className="landing-logo">
          <span className="logo-mark">АПК</span>
          <div>
            <strong>Агинский педагогический колледж</strong>
            <span>имени Базара Ринчино</span>
          </div>
        </div>
        <div className="landing-actions">
          <Link to="/login" className="btn-primary">Войти</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">Образовательный портал · 2026</p>
          <h1>
            Современное образование <em>Агинского педколледжа</em>
          </h1>
          <p className="hero-desc">
            Единая платформа для студентов, преподавателей и администрации.
            Задания, оценки, расписание и объявления — всё в одном месте.
          </p>
          <div className="hero-cta">
            <Link to="/login" className="btn-primary btn-lg">Войти в кабинет</Link>
          </div>
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <strong>{s.num}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-mockup card">
            <div className="mockup-header">
              <span className="logo-mark" style={{ width: 32, height: 32, fontSize: '0.65rem' }}>АПК</span>
              <span>Личный кабинет студента</span>
            </div>
            <div className="mockup-row"><span className="badge badge-submitted">Педагогика</span><span className="badge badge-pending">Не сдано</span></div>
            <div className="mockup-row"><span className="badge badge-graded">Оценено · 4/5</span></div>
            <div className="mockup-bar"><div style={{ width: '72%' }} /></div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Возможности портала</h2>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature-card card">
              <span className="feature-icon">
                <Icon name={f.icon} size={28} strokeWidth={1.75} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <h2>Готовы начать?</h2>
          <p>Войдите в личный кабинет. Аккаунт выдаёт администратор колледжа.</p>
          <Link to="/login" className="btn-accent btn-lg">Войти на портал</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Агинский педагогический колледж им. Базара Ринчино</p>
        <p className="proto-note">Прототип · данные в localStorage браузера</p>
      </footer>
    </div>
  )
}
