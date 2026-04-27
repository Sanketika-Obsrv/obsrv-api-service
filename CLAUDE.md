# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**obsrv-api-service** is a monorepo for the Obsrv data platform. The primary service is a Node.js/TypeScript REST API (`api-service/`) that manages datasets, data ingestion/egress, querying, and configuration. A Python microservice (`command-service/`) handles long-running cluster operations.

## Commands

All commands below should be run from the `api-service/` directory unless noted.

```bash
# Install dependencies
npm install

# Run tests (full suite with coverage)
npm run test

# Run a single test file
npx mocha ./src/tests/DatasetManagement/DatasetRead/DatasetRead.spec.ts --exit

# Lint
npm run lint          # check
npm run lint-fix      # auto-fix

# Build TypeScript to dist/
npm run build

# Start development server (port 3000)
npm run start
```

## Architecture

### Monorepo Layout

- `api-service/` — Main TypeScript/Express service (Node.js 24, port 3000)
- `command-service/` — Python 3.12 microservice (Uvicorn, port 8000) for kubectl/Helm operations
- `system-rules-ingestor/` — Node.js utility for ingesting system rules via HTTP

### api-service Layers

**Entry point:** `src/app.ts` → routes defined in `src/routes/Router.ts`

All V2 API endpoints are prefixed with `/v2/`. Routes delegate to controllers.

| Layer | Location | Role |
|---|---|---|
| Routes | `src/routes/` | Maps HTTP paths to controllers |
| Controllers | `src/controllers/` | Request handling, input validation, response shaping |
| Services | `src/services/` | Business logic, orchestration |
| Models | `src/models/` | Sequelize ORM models (PostgreSQL) |
| Middleware | `src/middlewares/` | RBAC, audit logging, error handling |
| Config | `src/configs/Config.ts` | All environment-driven configuration |

**Key controllers** are organized by domain: `Dataset*`, `DataIngestion`, `DataEgress`, `Connectors*`, `QueryTemplate*`, `Alerts*`, `SchemaGeneration`.

**Key services:**
- `DatasetService.ts` — Core dataset CRUD operations
- `DatasetHealthService.ts` — Health monitoring
- `DatasetMetricsService.ts` — Metrics aggregation
- `WrapperService.ts` — Query wrapping (Druid/Trino)
- `CloudServices/` — Multi-cloud abstraction (AWS S3, GCS, Azure Blob)
- `telemetry.ts` — Audit event emission
- `otel/` — OpenTelemetry integration

### External Dependencies

- **PostgreSQL** — Primary store (Sequelize ORM), default: `localhost:5432`, db `sb-obsrv`
- **Redis** — Two instances: denorm cache and dedup (default: `localhost:6379`)
- **Kafka** — Ingestion pipeline (default: `localhost:9092`)
- **Druid** — Default query engine (`http://localhost:8888`)
- **Trino** — Alternative query engine
- **Prometheus** — Metrics (`http://localhost:9090`)

### Testing Approach

Tests live in `src/tests/` organized by feature domain. Tests use:
- **Mocha** as the runner (`--exit` flag always required)
- **Chai + Chai-HTTP** for HTTP assertions
- **Chai-spies / Sinon** for stubbing Sequelize model methods (no real DB needed in unit tests)
- **Nyc** for coverage (output to `coverage/`)

Test environment is configured via `.env.test`.

### TypeScript Configuration

- Target: ES2016, Module: CommonJS
- Source root: `src/`, output: `dist/`
- Strict mode on; no implicit `any`
- ESLint enforces double quotes

### Query Limits (defaults from Config.ts)

- `max_query_threshold` / `max_query_limit`: 5000 rows
- `max_date_range`: 30 days
- Excluded datasources (skip validation): `system-stats`, `failed-events-summary`, `masterdata-system-stats`, `system-events`
