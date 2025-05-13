# Monitoring & Observability Guide

## Overview
This guide explains how to set up production-grade monitoring for your NestJS server using Prometheus and Grafana. It covers metrics, dashboards, and alerting for robust observability.

---

## 1. Prerequisites
- Docker & Docker Compose installed
- Ports 3000 (API), 9464 (metrics), 9090 (Prometheus), 3001 (Grafana) available

---

## 2. Running Monitoring Stack

### Start All Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```
- This will start the API, Postgres, Prometheus, and Grafana.

### Access Services
- **API:** http://localhost:3000
- **Metrics:** http://localhost:9464/metrics
- **Prometheus UI:** http://localhost:9090
- **Grafana UI:** http://localhost:3001 (login: admin/admin)

---

## 3. Prometheus Configuration
- Config file: `prometheus.yml`
- Scrapes metrics from the API at `/metrics` (port 9464)
- Scrape interval: 15s
- Job name: `nestjs-api`

---

## 4. Grafana Dashboards
- Add Prometheus as a data source (URL: `http://prometheus:9090`)
- Import dashboards using the queries in `monitoring.config.ts`
- Example panels:
  - Message processing rate
  - Failure rate
  - Dead letter queue rate
  - Processing time (histogram)
  - Error distribution

---

## 5. Alerting
- Alert rules are defined in `monitoring.config.ts` (see `ALERT_RULES`)
- To enable alerting, add alertmanager config to `prometheus.yml` and set up notification channels (email, Slack, etc.)
- Example alert: High message processing failure rate (>10% for 5m)

---

## 6. Customization
- Edit `prometheus.yml` to add more scrape targets or change intervals
- Update `monitoring.config.ts` to add new metrics
- Use Grafana to build custom dashboards and alerts

---

## 7. Troubleshooting
- Check container logs: `docker-compose logs api prometheus grafana`
- Ensure ports are not blocked by firewalls
- Verify `/metrics` endpoint is accessible from Prometheus

---

## 8. References
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [NestJS OpenTelemetry](https://docs.nestjs.com/recipes/opentelemetry) 