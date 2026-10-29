# Деплой АПК на сервер — apk.c0ns7.ru

Сайт работает как одно Node-приложение: **Express** отдаёт API, загрузки и собранный фронт (`dist`).  
**Nginx** принимает HTTPS на `apk.c0ns7.ru` и проксирует всё на порт `3000`.

---

## Что понадобится

- VPS с Ubuntu 22.04 / 24.04 и доступом `root` (или sudo)
- Домен `c0ns7.ru` (управление DNS)
- IP вашего VPS

---

## 1. Привязка домена (DNS)

В панели DNS для зоны `c0ns7.ru` создайте запись:

| Тип | Имя (host) | Значение | TTL |
|-----|------------|----------|-----|
| **A** | `apk` | IP вашего VPS | 300–3600 |

В итоге имя **apk.c0ns7.ru** должно указывать на сервер.

Проверка с вашего ПК (через 5–30 минут после сохранения DNS):

```bash
ping apk.c0ns7.ru
# или
nslookup apk.c0ns7.ru
```

Должен вернуться IP VPS. **Дальше без этого шага SSL не выпустится.**

---

## 2. Подготовка VPS

```bash
ssh root@IP_ВАШЕГО_VPS
```

```bash
apt update && apt upgrade -y
apt install -y nginx git curl build-essential python3

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # v20.x
npm -v

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

Пакет `build-essential` нужен для сборки `better-sqlite3`.

---

## 3. Загрузка проекта на сервер

### Вариант A — через git (предпочтительно)

```bash
mkdir -p /var/www
cd /var/www
git clone URL_ВАШЕГО_РЕПОЗИТОРИЯ apkcourse
cd apkcourse
```

### Вариант B — с вашего Windows (без git на сервере)

На локальной машине в папке проекта:

```powershell
npm ci
npm run server:install
npm run build
```

Затем скопируйте на сервер (нужны `dist`, `server`, корневые `package.json` и т.д.):

```powershell
scp -r dist server package.json package-lock.json root@IP_ВАШЕГО_VPS:/var/www/apkcourse/
```

На сервере:

```bash
mkdir -p /var/www/apkcourse
cd /var/www/apkcourse/server
npm ci --omit=dev
```

---

## 4. Настройка окружения

```bash
cd /var/www/apkcourse
npm ci
npm run server:install
# node_modules ставьте ТОЛЬКО на Linux-сервере, не копируйте с Windows

cp server/.env.example server/.env
nano server/.env
```

Содержимое `server/.env` для продакшена:

```env
PORT=3000
JWT_SECRET=сгенерируйте_длинную_случайную_строку_32+_символов
ROOT_LOGIN=root
ROOT_PASSWORD=надёжный_пароль_админа
NODE_ENV=production
CLIENT_ORIGIN=https://apk.c0ns7.ru
```

Сгенерировать секрет можно так:

```bash
openssl rand -hex 32
```

Сохраните файл (`Ctrl+O`, Enter, `Ctrl+X` в nano).

---

## 5. Сборка фронта и проверка API

```bash
cd /var/www/apkcourse
npm run build
```

Временный запуск для проверки:

```bash
cd /var/www/apkcourse/server
node index.js
```

В другом SSH-сеансе:

```bash
curl http://127.0.0.1:3000/api/health
# {"ok":true,"time":"..."}
```

В логе должно быть что-то вроде:

```text
[seed] root account created: login="root"
APK API listening on http://localhost:3000
```

Остановите процесс (`Ctrl+C`) — дальше будет systemd.

> Root-аккаунт создаётся **только один раз** при первом старте.  
> Смена `ROOT_PASSWORD` в `.env` позже **не** меняет пароль уже существующего пользователя в БД.

---

## 6. Автозапуск (systemd)

```bash
nano /etc/systemd/system/apkcourse.service
```

```ini
[Unit]
Description=APK education portal (apk.c0ns7.ru)
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/apkcourse/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now apkcourse
systemctl status apkcourse
```

Статус должен быть `active (running)`. Логи:

```bash
journalctl -u apkcourse -f
```

---

## 7. Nginx → домен apk.c0ns7.ru

```bash
nano /etc/nginx/sites-available/apk.c0ns7.ru
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name apk.c0ns7.ru;

    client_max_body_size 30m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Включить сайт:

```bash
ln -sf /etc/nginx/sites-available/apk.c0ns7.ru /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default   # если мешает
nginx -t
systemctl reload nginx
```

Проверка по HTTP (DNS уже должен смотреть на этот сервер):

```bash
curl -I http://apk.c0ns7.ru/api/health
```

В браузере: http://apk.c0ns7.ru

---

## 8. HTTPS (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d apk.c0ns7.ru
```

Укажите email, согласитесь с условиями. Certbot сам поправит Nginx и включит редирект HTTP → HTTPS.

Проверка обновления сертификата:

```bash
certbot renew --dry-run
```

Готово: **https://apk.c0ns7.ru**

Вход администратора — логин/пароль из `ROOT_LOGIN` / `ROOT_PASSWORD` в `server/.env`.

Дальше студентов и преподавателей создаёте в панели: **Админ → Пользователи**.

---

## 9. Обновление сайта после правок кода

```bash
cd /var/www/apkcourse
git pull
npm ci
npm run server:install
npm run build
systemctl restart apkcourse
```

Не удаляйте:

- `server/data/` — база SQLite (`apk.db`)
- `server/uploads/` — загруженные файлы
- `server/.env` — секреты

---

## Чеклист

1. [ ] A-запись `apk` → IP VPS, `nslookup apk.c0ns7.ru` ок  
2. [ ] Node 20, nginx, firewall  
3. [ ] Проект в `/var/www/apkcourse`, `npm run build`  
4. [ ] `server/.env` с `CLIENT_ORIGIN=https://apk.c0ns7.ru` и сильным `JWT_SECRET`  
5. [ ] `systemctl status apkcourse` → running  
6. [ ] Nginx proxy на `127.0.0.1:3000`  
7. [ ] Certbot SSL для `apk.c0ns7.ru`  
8. [ ] Вход под root на https://apk.c0ns7.ru/login  

---

## Типичные проблемы

| Симптом | Что сделать |
|---------|-------------|
| DNS не резолвится | Проверить A-запись, подождать TTL, `nslookup` |
| 502 Bad Gateway | `systemctl status apkcourse`, `curl 127.0.0.1:3000/api/health` |
| Не ставится better-sqlite3 | `apt install build-essential`, Node 20, `npm run server:install` |
| 404 на `/login`, `/admin` | Нет `dist` — выполните `npm run build` в корне проекта |
| Certbot ошибка | DNS уже на VPS, порты 80/443 открыты (`ufw`) |
| Неверный пароль root | Аккаунт уже в БД; сброс: остановить сервис, удалить пользователя `root` из `server/data/apk.db` или задать новый пароль через SQL/новый админ |

Сброс пароля root вручную (пример):

```bash
systemctl stop apkcourse
cd /var/www/apkcourse/server
# удалить БД только если можно потерять данные:
# rm -f data/apk.db data/apk.db-*
# или оставить БД и сменить пароль через node/sqlite
systemctl start apkcourse
```
