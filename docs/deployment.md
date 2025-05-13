# Deployment Guide

## Overview
This guide explains how to deploy the production-ready NestJS server with Supabase (managed Postgres), Prometheus, and Grafana using Docker Compose.

---

## 1. Prerequisites
- Docker & Docker Compose installed
- Production `.env.production` file in `server/` directory (see `.env.example` for Supabase setup)
- **Supabase account and project created**
- Open ports: 3000 (API), 9464 (metrics), 9090 (Prometheus), 3001 (Grafana)

---

## 2. Environment Setup
- Copy the sample `.env.example` to `server/.env.production`
- Edit secrets and config as needed (Supabase DB, JWT, CORS, etc.)
- **Set `DATABASE_URL` to your Supabase connection string:**

```
DATABASE_URL=postgresql://postgres:IELTSguru%4011a@db.msjzaofoazznvcdsjeby.supabase.co:5432/postgres
# or use the pooler URL if preferred:
# DATABASE_URL=postgresql://postgres.msjzaofoazznvcdsjeby:IELTSguru%4011a@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## 3. Build & Run the Stack
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
- This will build and start all services: API, Prometheus, Grafana
- **Note:** The database is managed by Supabase and is NOT run as a local container.

---

## 4. Health Checks
- API health: [http://localhost:3000/health](http://localhost:3000/health)
- Metrics: [http://localhost:9464/metrics](http://localhost:9464/metrics)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3001](http://localhost:3001) (login: admin/admin)

---

## 5. Monitoring & Observability
- See `docs/monitoring.md` for full setup
- Prometheus scrapes API metrics at `/metrics` (port 9464)
- Grafana dashboards can be imported using queries from `monitoring.config.ts`

---

## 6. Database Persistence
- **Supabase manages all database persistence and backups.**
- For manual backup: use Supabase dashboard or connect via psql/pg_dump to the Supabase DB URL.

---

## 7. Stopping & Restarting
```bash
docker-compose -f docker-compose.prod.yml down
```
- To restart: use `up -d` again

---

## 8. Troubleshooting
- Check logs: `docker-compose logs api prometheus grafana`
- Ensure all environment variables are set
- Verify ports are not blocked
- For DB connection issues, check `DATABASE_URL` and Supabase project status
- For metrics issues, ensure `/metrics` is accessible from Prometheus

---

## 9. Security & Hardening
- Change all default passwords and secrets
- Use secure CORS origins
- Keep dependencies up to date (`npm audit`)
- Use HTTPS in production (behind a reverse proxy)
- **Never commit real Supabase credentials to public repos**

---

## 10. References
- [NestJS Deployment Docs](https://docs.nestjs.com/recipes/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/) 