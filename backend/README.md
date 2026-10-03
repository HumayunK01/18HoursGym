# Gym Management API

Backend API for the gym management system. Handles member authentication, fixed-duration membership passes, workout class schedules, capacity-checked reservations, mock checkout, and admin analytics.

## Tech Stack
* Node.js (TypeScript strict mode)
* Express 5
* PostgreSQL
* Prisma ORM
* Vitest & Supertest
* Zod
* Swagger (OpenAPI 3.0)

---

## Directory Structure

The backend separates responsibilities across modular directories in `src/`:

```
backend/
├── prisma/
│   ├── schema.prisma         # Models, indexes, enums, and foreign keys
│   └── seed.ts               # Seed data for admin, trainers, passes, and classes
├── src/
│   ├── config/               # Environment validation (Zod), Prisma client, constants, Swagger
│   ├── controllers/          # Unwraps requests, sends status codes and unified envelopes
│   ├── middleware/           # Auth tokens, RBAC, Zod validation, rate limits, request IDs, error handling
│   ├── routes/               # Express routers mounted at /api/v1
│   ├── services/             # Domain logic, database transactions, concurrency row locks, payments
│   ├── types/                # TypeScript interfaces, Express types, Zod validation schemas
│   ├── utils/                # Zero-dependency structured JSON logger with PII scrubbing
│   ├── app.ts                # Express app setup (Helmet CSP, CORS, cookies, rate limits, health probes)
│   └── server.ts             # Starts server, manages connection draining and graceful shutdown
├── tests/                    # 68 integration tests across 7 suites (Auth, Bookings, RBAC, Security, etc.)
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

---

## Database Design

PostgreSQL tables, enums, and relationships managed by Prisma:

```mermaid
erDiagram
    USERS ||--o{ PASS_PURCHASES : "holds"
    USERS ||--o{ BOOKINGS : "books"
    USERS ||--o| TRAINER_PROFILES : "extends"
    USERS ||--o{ PAYMENTS : "initiates"
    USERS ||--o{ SESSIONS : "authenticates"

    MEMBERSHIP_PLANS ||--o{ PASS_PURCHASES : "specifies"
    PASS_PURCHASES ||--o{ PAYMENTS : "bills"

    TRAINER_PROFILES ||--o{ CLASSES : "coaches"
    CLASSES ||--o{ BOOKINGS : "contains"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        enum role "MEMBER, TRAINER, ADMIN"
        enum status "ACTIVE, SUSPENDED"
        timestamptz created_at
        timestamptz updated_at
    }

    MEMBERSHIP_PLANS {
        uuid id PK
        string name
        string description
        int duration_in_days
        decimal price
        boolean is_active
        jsonb features
        timestamptz created_at
    }

    PASS_PURCHASES {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        timestamptz start_date
        timestamptz end_date
        enum status "PENDING, ACTIVE, EXPIRED, CANCELLED"
        decimal amount_paid
        timestamptz created_at
    }

    PAYMENTS {
        uuid id PK
        uuid user_id FK
        uuid pass_purchase_id FK
        decimal amount
        string currency
        enum status "PENDING, SUCCESS, FAILED, REFUNDED"
        string payment_method
        string transaction_ref UK
        jsonb gateway_response
        timestamptz created_at
    }

    TRAINER_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        string bio
        string specialization
        int years_experience
        string avatar_url
    }

    CLASSES {
        uuid id PK
        uuid trainer_id FK
        string title
        string description
        timestamptz start_time
        timestamptz end_time
        int capacity
        enum status "SCHEDULED, ONGOING, COMPLETED, CANCELLED"
        timestamptz created_at
    }

    BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid class_id FK
        enum status "CONFIRMED, CANCELLED, ATTENDED, NO_SHOW"
        timestamptz booked_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        uuid replaced_by
        timestamptz created_at
        timestamptz updated_at
    }
```

### Database Decisions
* **Timestamps**: Uses `timestamptz(6)` on all date and time fields to prevent timezone drift.
* **Currency**: Uses `Decimal(10, 2)` for prices and payments. Avoids floating-point math inaccuracies.
* **Indexes**:
  * `pass_purchases`: `[user_id, status]`, `[end_date]` for active pass evaluation and fast expiration lookups.
  * `payments`: `[user_id, status]`, `[created_at]` for optimized admin revenue ledger queries.
  * `classes`: `[start_time, status]`, `[trainer_id]` for upcoming class schedules and trainer filtering.
  * `bookings`: `[class_id, status]` for spot capacity sums.
  * `sessions`: `[user_id]`, `[token_hash]` for refresh token lookup, rotation, and revocation.
* **Double Booking Prevention**: Composite unique constraint on `(user_id, class_id)` guarantees one reservation per member per class.

---

## Prerequisites and Configuration

### Requirements
* Node.js 18 or newer
* PostgreSQL 14 or newer running locally or on a cloud provider (Supabase, Neon)

### Environment Variables
Copy `.env.example` to `.env`:

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/gym_db?schema=public"

# JWT secrets (32 characters minimum)
JWT_ACCESS_SECRET="gym_dev_access_secret_super_secure_key_32chars_minimum"
JWT_REFRESH_SECRET="gym_dev_refresh_secret_super_secure_key_32chars_minimum"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Payment sandbox latency in ms
MOCK_PAYMENT_LATENCY_MS=600
```

`src/config/env.ts` parses and validates these values using Zod on boot.

---

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create the Database
In PostgreSQL:
```sql
CREATE DATABASE gym_db;
```

### 3. Apply Schema
Push the Prisma models to PostgreSQL:
```bash
npx prisma db push
```

### 4. Seed Initial Data
Creates the admin account, trainers, passes, and a sample class:
```bash
npx tsx prisma/seed.ts
```

### 5. Run the Server
```bash
npm run dev
```

Endpoints:
* API root: `http://localhost:5000/api/v1`
* Interactive Swagger docs: `http://localhost:5000/api/docs`
* Process Liveness probe: `http://localhost:5000/health/live`
* Service Readiness probe: `http://localhost:5000/health/ready`
* Overall health check: `http://localhost:5000/health`

---

## Default Accounts

The seed script creates three accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gym.com` | `AdminPassword123!` | Analytics, member roster, plan creation, class creation |
| **Trainer (Strength)** | `marcus.pt@gym.com` | `TrainerPass123!` | Strength coach profile |
| **Trainer (Yoga)** | `elena.yoga@gym.com` | `TrainerPass123!` | Yoga coach profile |

---

## API Routes

All endpoints live under `/api/v1`. Every request returns or generates an `X-Request-Id` correlation header.

### Health Probes
* `GET /health/live`: Fast process liveness probe (HTTP 200) without database dependencies.
* `GET /health/ready`: Traffic readiness probe (HTTP 200 / 503) verifying PostgreSQL connectivity via `SELECT 1`.
* `GET /health`: Backward-compatible overall health check.

### Auth (`/api/v1/auth`)
* `POST /signup`: Registers a new member account.
* `POST /login`: Verifies credentials, returns an access token, stores hashed session, and sets an HTTP-only refresh cookie.
* `POST /refresh`: Validates refresh token against database session, rotates token, detects reuse/theft, and issues a new access token.
* `POST /logout`: Revokes active session and clears the refresh cookie.

### User Profile (`/api/v1/users`)
* `GET /me`: Returns profile details and active pass. Requires auth.
* `PATCH /me`: Updates first name, last name, or phone. Requires auth.
* `GET /me/membership`: Lists pass purchase history with pagination (`?page=1&limit=20`). Requires auth.
* `GET /me/bookings`: Lists class bookings with pagination (`?page=1&limit=20`). Requires auth.

### Plans (`/api/v1/plans`)
* `GET /`: Lists active passes (1-Month, 3-Months, 1-Year).
* `GET /:id`: Returns details for a single pass.

### Checkout (`/api/v1/checkout`)
* `POST /create-intent`: Creates a pending pass purchase and payment order. Requires auth.
* `POST /mock-pay`: Simulates card payment with `SUCCESS` or `FAILED` outcomes. Requires auth.
* `GET /receipt/:paymentId`: Returns payment receipt. Enforces caller ownership or `ADMIN` role. Requires auth.

### Classes (`/api/v1/classes`)
* `GET /`: Lists upcoming scheduled classes and spot counts (supports `?trainerId=...&status=...&startDate=...&endDate=...`).
* `GET /:id`: Returns single class details.
* `POST /:id/book`: Reserves a spot in a class. Concurrency-safe via row-level locking. Requires an active pass and open capacity.
* `DELETE /:id/book`: Cancels an existing booking. Requires auth.

### Admin Dashboard (`/api/v1/admin`)
Requires `ADMIN` role.
* `GET /analytics/overview`: Member counts, revenue total, upcoming classes count.
* `GET /members`: Paginated member roster with `search`, `status`, `page`, and `limit` filters.
* `PATCH /members/:id/status`: Suspends or activates a member. Revokes all active user sessions on suspension.
* `POST /plans`: Creates a new pass tier.
* `PATCH /plans/:id`: Updates an existing pass tier.
* `POST /classes`: Schedules a new group class.
* `GET /payments`: Paginated transaction ledger with `status`, `userId`, `page`, and `limit` filters.

---

## Key Workflows

### Pass Expiration
Passes run for 30, 90, or 365 days. When a purchase succeeds, the pass becomes `ACTIVE`. When `now() > end_date`, read queries update the status to `EXPIRED`.

### Class Booking
Reserving a class runs in a Prisma transaction:
1. Verifies that the member holds an active pass.
2. Counts confirmed bookings against class capacity.
3. Creates the booking record if a spot is open.
4. Fails with a conflict error if the class is full or already booked.

### Payment Simulation
The payment service implements a `PaymentGateway` interface. The mock provider accepts `simulateOutcome: "SUCCESS" | "FAILED"`, generates a unique `transactionRef`, and updates the pass status. Replacing the mock with Stripe or Razorpay requires adding their SDK calls to the interface implementation.

---

## Security Controls

* **BOLA / IDOR**: Database queries filter by `userId: req.user.id`. Users cannot read or modify other accounts.
* **Passwords**: Hashed with bcrypt (12 salt rounds). Compares dummy hashes on unknown emails to prevent timing attacks.
* **Tokens**: 15-minute access token in memory or authorization header. 7-day refresh token in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
* **Mass Assignment**: Zod schemas strip `role`, `status`, and `id` from update requests.
* **Rate Limits**: 10 attempts per 15 minutes on auth routes. 20 requests per minute on bookings. 200 requests per 15 minutes globally.
* **Payload Size**: JSON parser limited to 10 KB to prevent memory exhaustion.
* **Headers**: Helmet sets HSTS, frameguard, and nosniff. CORS restricts access to your frontend domain.
* **Error Leaks**: Centralized error middleware masks database queries and stack traces in production.

---

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs the server with `tsx watch` hot reloading |
| `npm test` | Runs the full Vitest integration test suite (68 tests) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run build` | Compiles TypeScript into `dist/` |
| `npm start` | Runs the production build (`node dist/server.js`) |
| `npm run prisma:generate` | Updates Prisma Client types |
| `npm run prisma:migrate` | Runs Prisma migrations in development |
| `npm run prisma:seed` | Runs `prisma/seed.ts` |

---

## Troubleshooting

### Database authentication failed (`P1000`)
Check `DATABASE_URL` in `.env`. Verify your local PostgreSQL password:
```ini
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gym_db?schema=public"
```

### Port 5000 in use (`EADDRINUSE`)
Change `PORT=5001` in `.env`, or stop the process holding port 5000:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```
