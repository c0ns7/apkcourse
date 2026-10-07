# Деплой на VPS — apk.c0ns7.ru

Статический фронтенд (Vite + React). Бэкенд не нужен: данные в `localStorage`.

Ниже — Ubuntu 22.04/24.04, Nginx, Let's Encrypt.

---

## 1. DNS

В панели домена `c0ns7.ru` создайте запись:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A   | `apk` | IP вашего VPS | 300–3600 |

Проверка (через 5–30 мин):

```bash
ping apk.c0ns7.ru
# или
dig +short apk.c0ns7.ru
```

Должен вернуться IP сервера.

---

## 2. Подготовка сервера

```bash
ssh root@YOUR_VPS_IP
```

```bash
apt update && apt upgrade -y
apt install -y nginx git curl
```

Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v
```

Firewall (если ufw включён):

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## 3. Сборка проекта

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_РЕПОЗИТОРИЯ> apkcourse
# или загрузите файлы через scp/rsync
cd apkcourse
npm ci
npm run build
```

Готовые файлы: `/var/www/apkcourse/dist`

Права:

```bash
chown -R www-data:www-data /var/www/apkcourse/dist
```

---

## 4. Nginx

```bash
nano /etc/nginx/sites-available/apk.c0ns7.ru
```

Содержимое:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name apk.c0ns7.ru;

    root /var/www/apkcourse/dist;
    index index.html;

    # SPA: все маршруты → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэш статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

Включить сайт:

```bash
ln -s /etc/nginx/sites-available/apk.c0ns7.ru /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Проверка: `http://apk.c0ns7.ru` (пока без HTTPS).

---

## 5. HTTPS (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d apk.c0ns7.ru
```

Следуйте подсказкам (email, согласие). Certbot сам поправит Nginx и включит редирект HTTP → HTTPS.

Автообновление сертификата:

```bash
systemctl status certbot.timer
certbot renew --dry-run
```

После этого сайт: **https://apk.c0ns7.ru**

---

## 6. Обновление сайта

```bash
cd /var/www/apkcourse
git pull
npm ci
npm run build
chown -R www-data:www-data dist
systemctl reload nginx
```

---

## 7. Быстрый деплой без git (с локальной машины)

Собрать локально:

```bash
npm ci
npm run build
```

Залить `dist` на сервер:

```bash
# PowerShell / Git Bash
scp -r dist/* root@YOUR_VPS_IP:/var/www/apkcourse/dist/
```

На сервере:

```bash
chown -R www-data:www-data /var/www/apkcourse/dist
systemctl reload nginx
```

---

## Чеклист

- [ ] A-запись `apk` → IP VPS
- [ ] Nginx отдаёт `/var/www/apkcourse/dist`
- [ ] `try_files` для React Router
- [ ] Certbot SSL для `apk.c0ns7.ru`
- [ ] Сайт открывается по HTTPS

## Типичные проблемы

| Симптом | Что проверить |
|---------|----------------|
| DNS не резолвится | A-запись, TTL, `dig apk.c0ns7.ru` |
| 502 / пустая страница | путь `root`, наличиемое `dist`, `nginx -t` |
| 404 на `/login` и т.п. | есть ли `try_files ... /index.html` |
| Certbot падает | DNS уже указывает на VPS, порты 80/443 открыты |
