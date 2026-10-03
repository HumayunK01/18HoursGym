<p align="center">
  <img src="./frontend/public/logo.png" width="160" alt="18 Hours Fitness Logo" />
</p>

<h1 align="center">18 Hours Fitness</h1>

<p align="center">
  Full-stack gym management web application and member portal for 18 Hours Fitness (Mumbra, Maharashtra).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/OpenAPI-Swagger_3.0-85EA2D?style=flat&logo=swagger&logoColor=black" alt="Swagger" />
</p>

---

## Overview

This repository contains the complete web application for 18 Hours Fitness. It includes a member-facing site, checkout simulation, member account portal, admin dashboard, and a REST API backed by PostgreSQL.

### Core Capabilities
* **Public Site**: Equipment gallery, pass pricing tiers, coach background, and facility hours.
* **Pass System**: 30-day, 90-day, 180-day, and 365-day passes with optional cardio add-on.
* **Checkout Sandbox**: Payment flow simulation with instant pass provisioning.
* **Member Portal**: Active pass status, remaining day count, digital access card, and receipts.
* **Admin Suite**: Gross revenue reports, member roster management, and plan pricing controls.
* **API & Security**: JWT rotation, role-based authorization, database transactions with PostgreSQL row-level locks, and structured logging.

---

## Architecture

```mermaid
graph TD
    Client([Web Browser / Mobile Client])

    subgraph Frontend["Frontend (React 19 + Vite + Tailwind v4)"]
        LandingView[Landing Page & Showcase]
        ProfileView[Member Profile & Pass Status]
        AdminDashboard[Admin Control Center]
        AuthModal[Auth & Role Gate]
        PaymentModal[Mock Payment Gateway]
        APIClient[Typed API Client / JWT Manager]
    end

    subgraph Network["Network & Security Layer"]
        CORS[CORS Policy]
        Helmet[Helmet CSP & Security Headers]
        RateLimit[Rate Limiting Middleware]
        AuthMiddleware[JWT Bearer & RBAC Guard]
    end

    subgraph Backend["Backend API (Node.js + Express 5)"]
        Router[Express Routers /api/v1]
        Controllers[API Controllers]
        Services[Domain Services & Transactions]
        Prisma[Prisma Client ORM]
    end

    subgraph Database["Database (PostgreSQL)"]
        PG[(PostgreSQL Database)]
    end

    Client <-->|HTTP / Client Render| Frontend
    LandingView & ProfileView & AdminDashboard --> APIClient
    AuthModal & PaymentModal --> APIClient

    APIClient <-->|REST API + JWT Bearer| Network
    Network <--> Router
    Router --> Controllers --> Services --> Prisma
    Prisma <-->|Parameterized SQL & Row Locks| PG
```

---

## Tech Stack

### Frontend
* **Framework**: React 19, TypeScript
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4
* **Motion & Scrolling**: Motion (`motion/react`), GSAP, Lenis
* **Routing**: React Router DOM v7
* **Icons**: Lucide React
* **Linting**: Oxlint

### Backend
* **Runtime & Framework**: Node.js, Express 5, TypeScript (`tsx`)
* **Database & ORM**: PostgreSQL 14+, Prisma Client v6
* **Authentication**: JWT access and refresh tokens, bcrypt
* **Validation**: Zod
* **API Documentation**: OpenAPI 3.0 via Swagger UI
* **Testing**: Vitest, Supertest (68 integration tests)
* **Observability**: Zero-dependency structured JSON logger with PII masking

---

## Repository Layout

```
Gym/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Models, indexes, enums, foreign keys
│   │   └── seed.ts               # Seed data for admin, trainers, passes, classes
│   ├── src/
│   │   ├── config/               # Environment validation (Zod), Prisma client, Swagger
│   │   ├── controllers/          # Request handlers and response formatting
│   │   ├── middleware/           # Auth tokens, RBAC, rate limits, error handling
│   │   ├── routes/               # Express routers mounted at /api/v1
│   │   ├── services/             # Business logic, transactions, row-level locks
│   │   ├── types/                # TypeScript interfaces, Express types, Zod schemas
│   │   ├── utils/                # Structured JSON logger with PII scrubbing
│   │   ├── app.ts                # Express app configuration
│   │   └── server.ts             # Server entry point and graceful shutdown
│   ├── tests/                    # 68 integration tests across 7 test suites
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.mts
│
├── frontend/
│   ├── public/
│   │   ├── images/               # Machine and facility photography
│   │   ├── favicon.svg           # Brand emblem
│   │   └── logo.png              # 18 Hours emblem
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # Fetch client with JWT injection and 401 refresh
│   │   ├── components/
│   │   │   ├── ui/               # Ribbons, carousel, pricing table
│   │   │   ├── AuthModal.tsx     # Sign-in and registration dialog
│   │   │   ├── Footer.tsx        # Footer navigation and hours
│   │   │   ├── MockPaymentModal.tsx # Checkout and pass activation
│   │   │   └── Navbar.tsx        # Floating nav with scroll spy
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state, session persistence, RBAC helpers
│   │   ├── views/
│   │   │   ├── LandingView.tsx   # Homepage
│   │   │   ├── ProfileView.tsx   # Member portal
│   │   │   └── AdminDashboardView.tsx # Admin revenue and roster management
│   │   ├── types/                # Frontend TypeScript contracts
│   │   ├── App.tsx               # App shell and route table
│   │   └── main.tsx              # DOM entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
├── AGENTS.md                     # Workspace guidelines
└── README.md                     # Project documentation
```

---

## Database Design

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

---

## Local Setup

### Prerequisites
* Node.js 18 or higher
* PostgreSQL 14 or higher
* npm 9 or higher

---

### Step 1: Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the environment configuration:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` to your PostgreSQL instance:
   ```ini
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gym_db?schema=public"
   JWT_ACCESS_SECRET="gym_dev_access_secret_super_secure_key_32chars_minimum"
   JWT_REFRESH_SECRET="gym_dev_refresh_secret_super_secure_key_32chars_minimum"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   MOCK_PAYMENT_LATENCY_MS=600
   ```

4. Apply the Prisma schema:
   ```bash
   npx prisma db push
   ```

5. Seed test accounts and plans:
   ```bash
   npx tsx prisma/seed.ts
   ```

6. Start the server:
   ```bash
   npm run dev
   ```
   * API: `http://localhost:5000/api/v1`
   * Swagger documentation: `http://localhost:5000/api/docs`
   * Health probe: `http://localhost:5000/health`

---

### Step 2: Frontend

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set the environment variable (optional, defaults to `http://localhost:5000/api/v1`):
   ```ini
   VITE_API_URL="http://localhost:5000/api/v1"
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Test Accounts

The seed script creates the following accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@gym.com` | `AdminPassword123!` | Analytics, member roster, plan manager, transactions |
| **Trainer (Strength)** | `marcus.pt@gym.com` | `TrainerPass123!` | Strength coach profile |
| **Trainer (Yoga)** | `elena.yoga@gym.com` | `TrainerPass123!` | Yoga coach profile |
| **Member** | Register via modal | 8+ characters | Checkout, pass countdown, digital ID |

---

## Verification and Tests

### Backend Tests
Run the 68 integration tests via Vitest:
```bash
cd backend
npm test
```

### Frontend Checks
Run TypeScript checks and linting:
```bash
cd frontend
npm run build
npm run lint
```

---

## Responsive Breakpoints

| Breakpoint | Target | Behavior |
| :--- | :--- | :--- |
| **`< 480px`** | Mobile | Stacked CTA buttons, single-column footer lists, single card carousel, 3-column drawer. |
| **`480px - 640px`** | Large Phones | 2-column footer grid, 1.2 visible carousel cards, clamp typography. |
| **`640px - 1024px`** | Tablets | 2-column pass grid, 2.2 carousel cards. |
| **`>= 1024px`** | Desktop | 4-column pass pricing, 3.5 carousel cards, horizontal navbar. |

---

## License

ISC
