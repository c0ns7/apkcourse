import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { SiteChrome } from '../components/SiteChrome'
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
    <SiteChrome>
      <div className="landing">
        <section className="hero">
          <div className="hero-content">
            <p className="hero-tag">Образовательный портал</p>
            <h1>
              Учёба и общение в{' '}
              <em>одном кабинете</em>
            </h1>
            <p className="hero-desc">
              Платформа Агинского педагогического колледжа для студентов, преподавателей
              и администрации: задания, оценки, расписание и объявления.
            </p>
            <div className="hero-cta">
              <Link to="/login" className="btn-primary btn-lg">
                Войти в кабинет
              </Link>
              <Link to="/login" className="btn-secondary btn-lg">
                Регистрация
              </Link>
            </div>
            <div className="hero-stats" role="list">
              {stats.map((s) => (
                <div key={s.label} role="listitem">
                  <strong>{s.num}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-mockup card">
              <div className="mockup-header">
                <span className="logo-mark" style={{ width: 32, height: 32, fontSize: '0.65rem' }}>
                  АПК
                </span>
                <span>Личный кабинет студента</span>
              </div>
              <div className="mockup-row">
                <span className="badge badge-submitted">Педагогика</span>
                <span className="badge badge-pending">Не сдано</span>
              </div>
              <div className="mockup-row">
                <span className="badge badge-graded">Оценено · 4/5</span>
              </div>
              <div className="mockup-bar">
                <div style={{ width: '72%' }} />
              </div>
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
            <p>Войдите в личный кабинет или создайте учётную запись на странице входа.</p>
            <Link to="/login" className="btn-accent btn-lg">
              Перейти ко входу
            </Link>
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
