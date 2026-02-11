## Sycamore Assessment – Wallet & Interest Service

This project implements:
- An **idempotent `/transfer` endpoint** for wallet-to-wallet transfers with race-condition safety.
- A **daily interest accumulator job** that applies interest at **27.5% per annum** using precise integer math.

### Tech stack

- Node.js, TypeScript, Express
- Sequelize (MySQL)
- Redis (for idempotency caching)
- Jest + Supertest (tests)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root (already present in this repo) with:

- `PORT` – HTTP port for the API (e.g. `3000`).
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` – MySQL connection.
- or `DATABASE_URL` – full MySQL URL.
- `DB_TYPE` – should be `mysql`.
- `NODE_ENV` – e.g. `dev` (used by Sequelize CLI).
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASS` – Redis connection.

### 3. Database migrations

Run Sequelize migrations to create the tables (`Wallets`, `TransactionLogs`, `InterestAccruals`):

```bash
npm run db:migrate
```

---

## Running the API

### Dev server

```bash
npm run dev
```

The server starts on `http://localhost:<PORT>` (default `3000`).

### Health check

```http
GET /health
```

Response:

```text
Service is up and running
```

### Transfer endpoint

```http
POST /transfer
Content-Type: application/json
```

Example request body:

```json
{
  "fromWalletId": 1,
  "toWalletId": 2,
  "amountMinor": 5000,
  "idempotencyKey": "transfer-1"
}
```

- `amountMinor` is in **minor units** (e.g. cents/kobo).
- `idempotencyKey` must be unique per logical transfer request.

#### Example Postman request/response

![Transfer endpoint via Postman](assets/sycamore.avif)

#### Behavior

- Validates the body with `express-validator`.
- Creates a `TransactionLog` row in `PENDING` state before updating balances.
- Uses a Sequelize transaction and row locks to avoid race conditions.
- Debits the source wallet and credits the destination wallet if there are sufficient funds.
- Marks the `TransactionLog` as `COMPLETED` or `FAILED`.
- Uses Redis + a unique `idempotencyKey` to ensure **idempotency**: re-sending the same request returns the same result and does not double-spend.

---

## Daily interest job

### What it does

- Applies **27.5% per annum** interest, calculated daily.
- Represents money in **integer minor units** (`BIGINT`) and uses **`bigint` math only** – no floating point.
- For each wallet with a positive balance:
  - Calculates that day’s interest based on 365/366 days (handles leap years).
  - Creates an `InterestAccrual` row with `principalMinor` and `interestMinor`.
  - Creates a `TransactionLog` row of type `INTEREST`.
  - Updates the wallet balance by adding the interest.
- Is **idempotent per wallet per day** using a unique `(walletId, date)` constraint.

### Running the job

```bash
npm run interest:run
```

This:

- Connects to the database.
- Runs the daily interest calculation for `new Date()`.
- Logs success/failure and closes the connection.

In production, you would schedule this command once per day using cron, Task Scheduler, or a hosted scheduler.

---

## Testing

Run the Jest test suite:

```bash
npm test
```

The tests cover:

- `/transfer` endpoint:
  - Request validation errors.
  - Successful transfers (balances updated, `COMPLETED` log).
  - Insufficient funds (no balance change, `FAILED` log).
  - Idempotent behavior for the same `idempotencyKey`.
- Interest math:
  - Leap year vs non-leap year day counts.
  - Zero/negative balances.
  - Aggregate interest over 365 days is close to 27.5% of principal using integer math.

---

## Key design choices

- **Idempotent transfers**: combination of a database-unique `idempotencyKey`, Redis caching, and Sequelize transactions with row-level locks to prevent double-spending.
- **Money representation**: all monetary amounts are stored as integer minor units (`BIGINT`) and manipulated with `bigint` in TypeScript to avoid floating-point rounding issues.
- **Jobs as scripts**: the interest accumulator runs via `npm run interest:run`, which is easy to wire into any external scheduler (cron, Task Scheduler, CI, or cloud cron).

