# Deployment Guide

## Overview
This guide explains how to deploy the production-ready NestJS server with Supabase (managed Postgres), Prometheus, and Grafana using Docker Compose or Render.com.

---

## 1. Prerequisites
- Docker & Docker Compose installed (for local/manual deployment)
- Production `.env.production` file in `server/` directory (see `.env.example` for Supabase setup)
- **Supabase account and project created**
- Open ports: 3000 (API), 9464 (metrics), 9090 (Prometheus), 3001 (Grafana)

---

## 2. Environment Setup
- Copy the sample `.env.example` to `server/.env.production`
- Edit secrets and config as needed (Supabase DATABASE_URL, JWT secrets, etc.)
- Make sure database connection settings match your Supabase project

---

## 3. Deploy with Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 4. Render.com Deployment (Preferred)

### 1. Create a New Web Service
1. Sign in to [Render.com](https://render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub/GitLab repo
4. Configure your service:
   - **Name**: Choose a service name (e.g., `rmq-api`)
   - **Environment**: Node
   - **Root Directory**: `server` (This is crucial for monorepo deployments)
   - **Build Command**: `node fix-build.js && pnpm build`
   - **Start Command**: `node dist/main.js`

### 2. Set Environment Variables
In the "Environment" tab, add the following variables:
- `NODE_ENV`: `production`
- `DATABASE_URL`: Your Supabase PostgreSQL connection string (format: `postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`)
- `SUPABASE_PROJECT_URL`: Your Supabase project URL (format: `https://[your-project-ref].supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key (from Supabase dashboard → Project Settings → API)
- `JWT_SECRET`: A secure random string
- `JWT_REFRESH_SECRET`: Another secure random string
- `JWT_EXPIRATION_TIME`: `3600`
- `JWT_REFRESH_EXPIRATION_TIME`: `86400`
- `PORT`: `3002` (Render will expose this on port 443 via HTTPS)
- `CORS_ORIGIN`: Your frontend URL (or * for development)

### 3. Deploy
Click "Create Web Service" to deploy. Render will automatically:
1. Clone your repository
2. Run the specified build command
3. Start your service

Your API will be available at `https://your-service-name.onrender.com`.

---

## 5. Monitoring Setup
Prometheus and Grafana are configured in the docker-compose file for Docker deployments. 
For Render.com, consider adding a separate monitoring solution like Datadog or New Relic.

---

## 6. Backup & Restore
Use Supabase dashboard for database backup & restore operations, or connect directly to Supabase with pg_dump/psql tools.

---

## 7. Health Checks
- API health: [http://localhost:3000/health](http://localhost:3000/health)
- Metrics: [http://localhost:9464/metrics](http://localhost:9464/metrics)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001) (login: admin/admin)

---

## 8. Monitoring & Observability
- See `docs/monitoring.md` for full setup
- Prometheus scrapes API metrics at `/metrics` (port 9464)
- Grafana dashboards can be imported using queries from `monitoring.config.ts`

---

## 9. Database Persistence
- **Supabase manages all database persistence and backups.**
- For manual backup: use Supabase dashboard or connect via psql/pg_dump to the Supabase DB URL.

---

## 10. Stopping & Restarting
```bash
docker-compose -f docker-compose.prod.yml down
```
- To restart: use `up -d` again

---

## 11. Troubleshooting
- Check logs: `docker-compose logs api prometheus grafana`
- Ensure all environment variables are set
- Verify ports are not blocked
- For DB connection issues, check `DATABASE_URL` and Supabase project status
- For metrics issues, ensure `/metrics` is accessible from Prometheus

---

## 12. Security & Hardening
- Change all default passwords and secrets
- Use secure CORS origins
- Keep dependencies up to date (`npm audit`)
- Use HTTPS in production (behind a reverse proxy)
- **Never commit real Supabase credentials to public repos**

---

## 13. References
- [NestJS Deployment Docs](https://docs.nestjs.com/recipes/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/) 