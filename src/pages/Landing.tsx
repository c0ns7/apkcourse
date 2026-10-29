import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { SiteChrome } from '../components/SiteChrome'
import './Landing.css'

const sections: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'book', title: 'Задания', desc: 'Получение и сдача работ в личном кабинете' },
  { icon: 'chart', title: 'Успеваемость', desc: 'Журнал оценок и зачётов по предметам' },
  { icon: 'calendar', title: 'Расписание', desc: 'Занятия по группам и аудиториям' },
  { icon: 'megaphone', title: 'Объявления', desc: 'Новости колледжа и сообщения преподавателей' },
  { icon: 'chat', title: 'Чаты', desc: 'Связь студента с преподавателем' },
  { icon: 'check', title: 'Проверка работ', desc: 'Оценка 2–5 или зачёт / незачёт' },
]

const floatCards: { icon: IconName; title: string; meta: string; delay: string }[] = [
  { icon: 'book', title: 'Новое задание', meta: 'Педагогика · до пятницы', delay: '0s' },
  { icon: 'chart', title: 'Средний балл', meta: '4,6 по семестру', delay: '0.35s' },
  { icon: 'calendar', title: 'Сегодня', meta: '2 пары · ауд. 214', delay: '0.7s' },
]

function formatClock(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(d: Date) {
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function Landing() {
  const [photoSrc, setPhotoSrc] = useState('/college.jfif')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <SiteChrome overlayNav>
      <div className="landing">
        <section className="landing-hero" aria-label="Главный экран">
          <div className="landing-hero-bg" aria-hidden="true" />

          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-brand">АПК</p>
              <h1>
                Агинский педагогический колледж
                <span>им. Базара Ринчино</span>
              </h1>
              <p className="landing-lead">
                Образовательный портал для учёбы: задания, оценки, расписание и связь
                с преподавателем.
              </p>
              <div className="landing-cta">
                <Link to="/login" className="landing-btn-main">
                  Войти в кабинет
                </Link>
                <Link to="/privacy" className="landing-btn-secondary">
                  Конфиденциальность
                </Link>
              </div>
            </div>

            <div className="landing-stage" aria-label="Обзор кабинета">
              <div className="landing-stage-frame">
                <img
                  className="landing-stage-photo"
                  src={photoSrc}
                  alt="Агинский педагогический колледж"
                  onError={() => setPhotoSrc('/hero-college.svg')}
                />
                <div className="landing-stage-glow" aria-hidden />
              </div>

              <div className="landing-float-stack" aria-hidden="false">
                {floatCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    className="landing-float-card"
                    style={{ animationDelay: card.delay }}
                  >
                    <span className="landing-float-icon">
                      <Icon name={card.icon} size={18} />
                    </span>
                    <span>
                      <strong>{card.title}</strong>
                      <small>{card.meta}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="landing-status-panel">
                <div className="landing-status-top">
                  <span className="landing-status-live">
                    <i aria-hidden />
                    Портал доступен
                  </span>
                  <time dateTime={now.toISOString()}>{formatClock(now)}</time>
                </div>
                <p className="landing-status-day">{formatDay(now)}</p>
                <div className="landing-status-chips">
                  <span>Учебный год 2026–2027</span>
                  <span>Вход по логину колледжа</span>
                  <span>Данные на сервере</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-sections" aria-labelledby="sections-title">
          <div className="landing-sections-inner">
            <h2 id="sections-title">Что есть в портале</h2>
            <ul className="landing-features">
              {sections.map((s) => (
                <li key={s.title}>
                  <span className="landing-feature-icon" aria-hidden>
                    <Icon name={s.icon} size={24} strokeWidth={1.75} />
                  </span>
                  <strong className="landing-feature-title">{s.title}</strong>
                  <p className="landing-feature-desc">{s.desc}</p>
                </li>
              ))}
            </ul>
            <div className="landing-foot">
              <p>Учётную запись выдаёт администратор колледжа.</p>
              <Link to="/login" className="btn-primary">
                Перейти ко входу
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
