import { Link } from 'react-router-dom'
import { SiteChrome } from '../components/SiteChrome'
import './LegalPage.css'

export function PrivacyPolicy() {
  return (
    <SiteChrome>
      <article className="legal-page">
        <nav className="legal-breadcrumb" aria-label="Навигация">
          <Link to="/">Главная</Link>
          <span aria-hidden>/</span>
          <span>Конфиденциальность</span>
        </nav>

        <header className="legal-header">
          <h1>Политика конфиденциальности</h1>
          <p className="legal-meta">
            Образовательный портал Агинского педагогического колледжа им. Базара Ринчино
          </p>
        </header>

        <div className="legal-toc card">
          <strong>Содержание</strong>
          <ol>
            <li><a href="#s1">Общие положения</a></li>
            <li><a href="#s2">Кто обрабатывает данные</a></li>
            <li><a href="#s3">Какие данные используются</a></li>
            <li><a href="#s4">Зачем они нужны</a></li>
            <li><a href="#s5">Основания обработки</a></li>
            <li><a href="#s6">Сроки и передача</a></li>
            <li><a href="#s7">Защита данных</a></li>
            <li><a href="#s8">Ваши права</a></li>
            <li><a href="#s9">Технические данные</a></li>
            <li><a href="#s10">Изменения политики</a></li>
          </ol>
        </div>

        <section id="s1" className="legal-section card">
          <h2>1. Общие положения</h2>
          <p>
            Эта политика описывает, как портал колледжа обрабатывает персональные данные
            пользователей. Получая доступ к личному кабинету, вы подтверждаете, что ознакомились
            с документом.
          </p>
        </section>

        <section id="s2" className="legal-section card">
          <h2>2. Кто обрабатывает данные</h2>
          <dl className="legal-dl">
            <dt>Организация</dt>
            <dd>Агинский педагогический колледж им. Базара Ринчино</dd>
            <dt>Назначение портала</dt>
            <dd>Поддержка учебного процесса в электронной форме</dd>
            <dt>Контакт</dt>
            <dd>
              <a href="mailto:pdn@apk.example">pdn@apk.example</a>
            </dd>
          </dl>
        </section>

        <section id="s3" className="legal-section card">
          <h2>3. Какие данные используются</h2>
          <p>В зависимости от роли (студент, преподаватель, администратор) могут обрабатываться:</p>
          <ul>
            <li>ФИО и логин учётной записи;</li>
            <li>специальность, курс, группа, учебный год;</li>
            <li>сведения об учебных дисциплинах и результатах обучения;</li>
            <li>содержание работ, сообщений в чате и объявлений;</li>
            <li>технические данные сессии (токен входа в браузере).</li>
          </ul>
          <p>Номер телефона на портале не запрашивается.</p>
        </section>

        <section id="s4" className="legal-section card">
          <h2>4. Зачем они нужны</h2>
          <ul>
            <li>доступ к личному кабинету и учебным сервисам;</li>
            <li>задания, проверка работ и учёт успеваемости;</li>
            <li>объявления и уведомления по учёбе;</li>
            <li>обмен сообщениями между студентом и преподавателем;</li>
            <li>внутренняя аналитика для администрации колледжа.</li>
          </ul>
        </section>

        <section id="s5" className="legal-section card">
          <h2>5. Основания обработки</h2>
          <ul>
            <li>создание учётной записи администратором и согласие пользователя на обработку ПДн;</li>
            <li>необходимость организации образовательного процесса;</li>
            <li>требования законодательства Российской Федерации.</li>
          </ul>
        </section>

        <section id="s6" className="legal-section card">
          <h2>6. Сроки и передача</h2>
          <p>
            Данные обрабатываются в объёме, нужном для учёбы на портале, и хранятся на
            сервере образовательной информационной системы. Передача третьим лицам не
            выполняется, кроме случаев, прямо предусмотренных законом.
          </p>
        </section>

        <section id="s7" className="legal-section card">
          <h2>7. Защита данных</h2>
          <ul>
            <li>доступ по ролям;</li>
            <li>вход по логину и паролю;</li>
            <li>ограничение видимости учебных данных в кабинете.</li>
          </ul>
        </section>

        <section id="s8" className="legal-section card">
          <h2>8. Ваши права</h2>
          <p>Вы можете запросить сведения о своих данных, уточнить их или отозвать согласие.
            Для этого напишите по адресу из раздела 2.</p>
        </section>

        <section id="s9" className="legal-section card">
          <h2>9. Технические данные</h2>
          <p>
            В браузере сохраняется только токен авторизации для поддержания сессии.
            Учебные данные хранятся на сервере.
          </p>
        </section>

        <section id="s10" className="legal-section card">
          <h2>10. Изменения политики</h2>
          <p>
            Актуальная версия всегда доступна на этой странице. Дата редакции: 12.10.2026.
          </p>
        </section>

        <div className="legal-actions">
          <Link to="/login" className="btn-primary">
            Ко входу
          </Link>
          <Link to="/" className="btn-secondary">
            На главную
          </Link>
        </div>
      </article>
    </SiteChrome>
  )
}
