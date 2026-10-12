import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { SiteChrome } from '../components/SiteChrome'
import './Landing.css'

const features: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'book', title: 'Задания', desc: 'Получение и сдача работ в личном кабинете' },
  { icon: 'chart', title: 'Успеваемость', desc: 'Журнал оценок и зачётов по предметам' },
  { icon: 'calendar', title: 'Расписание', desc: 'Занятия по группам и кабинетам' },
  { icon: 'megaphone', title: 'Объявления', desc: 'Новости колледжа и сообщения преподавателей' },
  { icon: 'chat', title: 'Чаты', desc: 'Связь студента с преподавателем' },
  { icon: 'check', title: 'Проверка работ', desc: 'Оценка 2–5 или зачёт / незачёт' },
]

export function Landing() {
  return (
    <SiteChrome>
      <div className="landing">
        <section className="hero">
          <div className="hero-content">
            <p className="hero-tag">Образовательный портал</p>
            <h1>
              Агинский педагогический колледж
              <small>им. Базара Ринчино</small>
            </h1>
            <p className="hero-desc">
              Электронный кабинет для студентов и преподавателей: задания, оценки,
              расписание, объявления и чаты.
            </p>
            <div className="hero-cta">
              <Link to="/login" className="btn-primary btn-lg">
                Войти в систему
              </Link>
            </div>
          </div>
          <div className="hero-panel card">
            <h2>Быстрый вход</h2>
            <p>Используйте логин и пароль, выданные администратором, или зарегистрируйтесь.</p>
            <Link to="/login" className="btn-primary btn-block">
              Перейти ко входу
            </Link>
            <ul className="hero-links">
              <li>
                <Icon name="book" size={16} /> Журнал и задания
              </li>
              <li>
                <Icon name="calendar" size={16} /> Расписание занятий
              </li>
              <li>
                <Icon name="chat" size={16} /> Чаты с преподавателем
              </li>
            </ul>
          </div>
        </section>

        <section className="features-section">
          <h2>Разделы портала</h2>
          <div className="features-grid">
            {features.map((f) => (
              <article key={f.title} className="feature-card card">
                <span className="feature-icon">
                  <Icon name={f.icon} size={24} strokeWidth={1.75} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SiteChrome>
  )
}
