# Informasi JP App

Next.js application for Informasi JP, backed by Prisma and MariaDB.

## Local Development

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:migrate
npm run db:seed
npm run dev
```

The development server runs on `http://localhost:3500`.

## Production Docker Deployment

The production compose file runs:

- `app`: Next.js on `127.0.0.1:3500`
- `mariadb`: MariaDB for Prisma
- `uploads_data`: persistent uploaded files
- `mariadb_data`: persistent database storage

Deploy from your local machine:

```bash
cd app
SSH_HOST=your.server.ip SSH_USER=deploy ./deploy/deploy.sh
```

Optional deployment variables:

```bash
SSH_PORT=22
REMOTE_DIR=/opt/informasijp
BRANCH=v2
REPO_URL=https://github.com/bp2jkjatim/informasijp.git
```

On first deploy, the script creates `/opt/informasijp/app/.env.production` with generated database and session credentials. Edit that file on the server if you need custom credentials, then redeploy.

Nginx should reverse proxy to the app container through the host loopback address:

```nginx
proxy_pass http://127.0.0.1:3500;
```

Use `deploy/nginx.conf.example` as the server block template.

Useful server commands:

```bash
cd /opt/informasijp/app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f mariadb
docker compose -f docker-compose.prod.yml down
```
