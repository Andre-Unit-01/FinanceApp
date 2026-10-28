# Ledgerly — Business Finance

**Know where your business money goes. Plan where it goes next.**

Ledgerly is a full-stack finance workspace for small businesses, freelancers, and independent operators. It brings income, expenses, categories, cash-flow summaries, and monthly budgets into one responsive dashboard—backed by PostgreSQL and an authenticated REST API.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-222222?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)
![Development status](https://img.shields.io/badge/status-local%20development-52796F)

---

## Contents

- [What Ledgerly does](#what-ledgerly-does)
- [Features](#features)
- [Technology stack](#technology-stack)
- [How the application is organized](#how-the-application-is-organized)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Demo account](#demo-account)
- [Available commands](#available-commands)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Testing and quality checks](#testing-and-quality-checks)
- [Troubleshooting](#troubleshooting)
- [Security and data safety](#security-and-data-safety)
- [Current scope and limitations](#current-scope-and-limitations)
- [Potential next steps](#potential-next-steps)

## What Ledgerly does

Ledgerly gives a business owner a practical view of money moving through the business. Record income and expenses, classify each transaction, set monthly targets, and compare planned expense allocations with recorded spending. Dashboard totals and charts are calculated from the stored records rather than maintained as separate manual totals.

The application is designed as a useful foundation for a business-finance product. It is not presented as a full accounting system and does not claim to connect to banks or process payments.

## Features

### Business overview

- Monthly revenue, expenses, net cash flow, and budget-utilization metrics.
- Six-month revenue-versus-expense visualization.
- Expense breakdown by category.
- Recent ledger activity and a budget snapshot.
- Loading, empty, and error states to guide setup and everyday use.

### Transactions

- Create, edit, view, and delete income and expense entries.
- Record amount, category, description, and transaction date.
- Filter by transaction type, category, and date range.
- Sort and paginate transaction results.
- Export the currently visible page to CSV.

### Categories

- Keep income categories separate from expense categories.
- Create, rename, and delete categories.
- Use suggested starter categories to speed up a new workspace.

### Budget planner

- Set monthly revenue and cash-reserve targets.
- Assign monthly budgets to expense categories.
- Compare actual spending with planned allocations.
- See remaining budget, utilization percentages, and budget-status indicators.
- Review future-dated expense entries within the selected month.
- Request suggested allocations as a starting point for a plan.

### Accounts and persistence

- Register and sign in with an email and password.
- Authenticate API requests with JSON Web Tokens (JWT).
- Hash account passwords with bcrypt before storing them.
- Store accounts, categories, transactions, and budgets in PostgreSQL through Prisma.

## Technology stack

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React, React Router, Vite | Screens, forms, navigation, and dashboard visualizations |
| API | Node.js, Express | REST endpoints, validation, and request handling |
| Database | PostgreSQL, Prisma ORM | Durable storage, relations, and versioned migrations |
| Authentication | JWT, bcryptjs | Token-based sessions and password hashing |
| Middleware | Helmet, CORS | HTTP security headers and controlled browser origins |
| Tests | Vitest, Supertest | API and database-backed integration tests |

## How the application is organized

```text
FinanceApp-main/
├── client/
│   ├── src/
│   │   ├── App.jsx                 # Routes and page composition
│   │   ├── App.css                 # Application styles
│   │   ├── index.css               # Global styles and design tokens
│   │   ├── repositories/
│   │   │   └── httpRepository.js   # HTTP requests and bearer token
│   │   ├── services/
│   │   │   ├── apiService.js       # Client-facing API wrapper
│   │   │   └── budgetService.js    # Budget suggestion helpers
│   │   └── utils/
│   │       └── formatting.js       # Shared money formatting
│   ├── .env.example                # Optional frontend configuration
│   └── package.json
├── server/
│   ├── src/
│   │   ├── app.js                  # Express middleware and routes
│   │   ├── server.js               # Server startup and shutdown
│   │   ├── controllers/            # HTTP request/response handlers
│   │   ├── middleware/             # Authentication and error handling
│   │   ├── repositories/           # Database access through Prisma
│   │   ├── routes/                 # API URL definitions
│   │   ├── services/               # Business rules and calculations
│   │   └── lib/prisma.js           # Shared Prisma client
│   ├── prisma/
│   │   ├── migrations/             # Versioned database migrations
│   │   ├── schema.prisma           # Database model definitions
│   │   └── seed.js                 # Destructive demo-data seeder
│   ├── tests/                      # API integration tests
│   ├── .env.example                # Backend configuration template
│   └── package.json
├── ARCHITECTURE.md                 # Detailed architecture guide
├── CHANGELOG.md                    # Project conversion notes
└── package.json                    # Root development scripts
```

The application follows a layered request flow:

```text
React page
   ↓
Client service / HTTP repository
   ↓
Express route → controller → service
   ↓
Repository → Prisma → PostgreSQL
   ↓
Response returned to the React page
```

Routes define the URL, controllers handle HTTP details, services enforce business rules, and repositories perform database operations. This separation makes it easier to test business behavior and maintain the code without putting database logic in the UI.

## Quick start

### Requirements

- **Node.js:** `20.19+` or `22.12+` (required by the Vite version in this project).
- **npm:** included with Node.js.
- **PostgreSQL:** installed and running locally, or a reachable PostgreSQL instance.
- A terminal and a code editor.

### 1. Get the code

Extract the project archive, or clone your repository, then enter the project directory:

```bash
cd FinanceApp-main
```

### 2. Install dependencies

There are three package manifests: one at the project root and one each in `client/` and `server/`.

```bash
npm ci
npm --prefix server ci
npm --prefix client ci
```

If you do not have the lockfiles available, use `npm install` in each of those three directories instead.

### 3. Configure the server

Create the server environment file:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set `DATABASE_URL` to your own PostgreSQL connection string. Also replace the sample `JWT_SECRET` with a long, random secret.

Example for a local database:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/finance_tracker?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
PORT=5000
```

Replace `YOUR_POSTGRES_PASSWORD` with the actual password for the PostgreSQL `postgres` role. The credentials shown in `.env.example` are only defaults for illustration; they are not guaranteed to match your machine. If the password contains reserved URL characters, URL-encode those characters in the connection string.

### 4. Create the database

On a typical Linux installation, create the database with:

```bash
sudo -u postgres psql -c "CREATE DATABASE finance_tracker OWNER postgres;"
```

If the database already exists, do not create it again. Make sure the role in `DATABASE_URL` has access to it. The `could not change directory ... Permission denied` message sometimes printed by `sudo -u postgres` is a working-directory warning; if PostgreSQL ends with `CREATE DATABASE`, the command succeeded.

### 5. Apply migrations and generate Prisma Client

```bash
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

`migrate deploy` applies the migration files already included in `server/prisma/migrations/`. It does not create a missing database, so complete the previous step first.

### 6. (Optional) Add demo data

To populate the database with example business activity:

```bash
cd server
npm run prisma:seed
cd ..
```

The seed script prints the demo login when it completes. **It deletes existing users, transactions, budgets, and categories in the configured database before recreating its sample data.** Only run it against a disposable development database. Do not use it against a database containing information you want to keep.

### 7. Start the application

From the project root, start the API and frontend together:

```bash
npm run dev
```

Open the frontend at **http://localhost:5173**. The API listens at **http://localhost:5000** by default.

To check that the API process responds, open [http://localhost:5000/api/health](http://localhost:5000/api/health). A successful response looks like:

```json
{ "status": "ok" }
```

Keep the terminal running while using the app. Press `Ctrl+C` to stop the development processes.

## Environment configuration

### Backend: `server/.env`

| Variable | Required | Default / example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL URL in `.env.example` | Prisma database connection |
| `JWT_SECRET` | Yes for secure use | `replace-with-strong-secret` in template | Signs authentication tokens; replace before use |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed frontend origin for CORS |
| `PORT` | No | `5000` | API listening port |

### Frontend: `client/.env`

The frontend defaults to `http://localhost:5000/api`. To use another API origin, copy the template and update the URL:

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` must point to the API base path, including `/api`. Frontend environment variables prefixed with `VITE_` are exposed to browser-side code; do not put secrets in this file.

## Demo account

After successfully running the seed script, use:

| Field | Value |
|---|---|
| Email | `demo@example.com` |
| Password | `secret123` |

These are public demo credentials intended only for local development. Do not reuse them for a production deployment or store real financial information in the seeded demo account.

## Available commands

Run commands from the project root unless noted otherwise.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the server and frontend together |
| `npm run backend` | Start only the backend development server |
| `npm run frontend` | Start only the frontend development server |
| `npm --prefix client run build` | Create the production frontend build in `client/dist/` |
| `npm --prefix client run preview` | Preview the built frontend locally |
| `npm --prefix client run lint` | Lint frontend source |
| `npm --prefix server run lint` | Lint backend source |
| `npm --prefix server test` | Run backend integration tests |
| `npm --prefix server run prisma:generate` | Generate Prisma Client |
| `npm --prefix server run prisma:seed` | **Destructively** replace development data with demo data |

For migration commands, change to `server/` first. Use `npx prisma migrate deploy` to apply committed migrations. The `npm run prisma:migrate` script is configured for creating a development migration with `prisma migrate dev --name init`; do not use that command as a substitute for applying existing migrations in a deployment environment.

## API overview

The base URL is `http://localhost:5000/api` by default. Except for health and authentication endpoints used to establish a session, the finance endpoints require a valid bearer token in the `Authorization` header.

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/health` | API health check | No |
| `POST` | `/auth/register` | Create an account | No |
| `POST` | `/auth/login` | Authenticate and receive a token | No |
| `POST` | `/auth/logout` | Logout endpoint | No token required by route |
| `GET` | `/auth/me` | Read the current authenticated user | Yes |
| `GET` | `/transactions` | List transactions; supports query-based filtering, sorting, and pagination | Yes |
| `GET` | `/transactions/:id` | Read a transaction | Yes |
| `POST` | `/transactions` | Create a transaction | Yes |
| `PATCH` | `/transactions/:id` | Update a transaction | Yes |
| `DELETE` | `/transactions/:id` | Delete a transaction | Yes |
| `GET` | `/categories` | List categories | Yes |
| `POST` | `/categories` | Create a category | Yes |
| `PATCH` | `/categories/:id` | Update a category | Yes |
| `DELETE` | `/categories/:id` | Delete a category | Yes |
| `GET` | `/budgets` | List monthly category budgets | Yes |
| `POST` | `/budgets` | Create a category budget | Yes |
| `PATCH` | `/budgets/:id` | Update a category budget | Yes |
| `DELETE` | `/budgets/:id` | Delete a category budget | Yes |
| `GET` | `/budgets/planner` | Retrieve monthly planning and actual-spending data | Yes |
| `PUT` | `/budgets/monthly` | Save monthly revenue/reserve targets | Yes |
| `GET` | `/analytics/monthly` | Retrieve monthly cash-flow and category analytics | Yes |

Example health request:

```bash
curl http://localhost:5000/api/health
```

Example login request:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"secret123"}'
```

A successful login returns a token. Protected API requests send it as `Authorization: Bearer <token>`.

## Data model

Prisma currently defines five core models:

- **User** — registered account and ownership root for finance records.
- **Category** — user-owned income or expense classification.
- **Transaction** — amount, type, category, description, and date.
- **Budget** — planned amount for one category in a given month and year.
- **MonthlyBudget** — monthly revenue target and cash-reserve target.

Transactions use decimal amounts in PostgreSQL to avoid storing money as floating-point database values. Budget totals, spending, remaining allocations, and dashboard analytics are derived from the relevant transactions and plans.

## Testing and quality checks

Frontend production build:

```bash
npm --prefix client run build
```

Lint checks:

```bash
npm --prefix client run lint
npm --prefix server run lint
```

Backend integration tests:

```bash
npm --prefix server test
```

The backend tests exercise authentication, transaction creation and filtering, sorting, monthly analytics, budget behavior, and ownership checks through the API. They connect to the database configured in `server/.env` and perform destructive cleanup. **Run tests only against a dedicated test database, not a database with real or important data.**

## Troubleshooting

### `Environment variable not found: DATABASE_URL`

Prisma cannot find the connection string. Create `server/.env` from the template, set `DATABASE_URL`, and run Prisma commands from the `server/` directory:

```bash
cd server
cp .env.example .env   # only if .env does not already exist
nano .env
npx prisma migrate deploy
```

### `Database "finance_tracker" does not exist`

Create the database first, then re-run migrations:

```bash
sudo -u postgres psql -c "CREATE DATABASE finance_tracker OWNER postgres;"
cd server
npx prisma migrate deploy
npx prisma generate
```

### `password authentication failed for user "postgres"`

The password in `DATABASE_URL` does not match the PostgreSQL role's configured password, or that role is not configured for the authentication method being used. Confirm the correct database role and password. On a local Linux machine where you administer PostgreSQL, you can change the `postgres` role password with:

```bash
sudo -u postgres psql
```

At the `psql` prompt:

```text
\password postgres
\q
```

Update `DATABASE_URL` with that password. Never paste passwords or tokens into public issue trackers.

### `Port 5000 is already in use`

Another process is occupying the API port. Stop the existing server or change `PORT` in `server/.env`. If you change the backend port, also update `VITE_API_URL` in `client/.env` to match.

### The frontend loads but requests fail

Check that the API is running at the URL configured in `VITE_API_URL`, that the URL includes `/api`, and that `CLIENT_URL` matches the frontend origin. Then inspect the browser developer console and the server terminal for the specific error.

### The demo login does not work

The demo account is created only when `npm run prisma:seed` completes successfully. Verify that the client and server use the expected database, then seed only if it is safe to replace the data in that database.

## Security and data safety

- Keep `server/.env` and `client/.env` out of version control. The repository `.gitignore` already excludes local environment files.
- Replace the example `JWT_SECRET` before using the app beyond local development.
- Treat the demo login as public and disposable.
- Use TLS, a least-privilege database role, managed secrets, backups, monitoring, and an appropriate deployment configuration before exposing the application publicly.
- Use a separate disposable PostgreSQL database for tests and demo seeding. Both test setup and the seed script delete records.
- This project is a development foundation, not a security-audited or compliance-certified financial platform.

## Current scope and limitations

Implemented: account registration/login, transaction management, categories, monthly category budgets, monthly revenue/reserve targets, cash-flow analytics, and a responsive browser interface.

Not implemented: direct bank connections, automated bank-feed imports, payment processing, invoice issuance/collection, payroll execution, tax filing, reconciliation workflows, multi-currency accounting, formal financial statements, or a full business-profile and permissions system.

Do not treat the dashboard as an authoritative accounting ledger or a replacement for a qualified accounting or tax professional. Sample records are illustrative only.

## Potential next steps

A sensible roadmap for a more complete product would be:

1. Add automated frontend tests and expand API integration coverage.
2. Add repeatable migrations, seed-safe fixtures, and a separate test-database configuration.
3. Add transaction import/export across all filtered results, with duplicate detection and import validation.
4. Add invoices and receivables only after defining their data model, payment states, and audit trail.
5. Harden production authentication, secrets management, monitoring, backups, and deployment workflows.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for more detail on the code structure and request flow, and [`CHANGELOG.md`](CHANGELOG.md) for the conversion notes.

---

**Ledgerly** — a clear starting point for small-business cash-flow management.
