# EVE Healthcare Backend

A REST API for diagnostic centres, tests, patient bookings, payments, and payment webhooks. The service uses Express, PostgreSQL, Prisma 7, and JWT authentication.

## Run Locally

### Prerequisites

- Node.js 20.19 or newer
- PostgreSQL

### Setup

```bash
npm install
```

Create a local `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eve_healthcare"
JWT_SECRET="replace-with-a-local-secret"
```

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the API:

```bash
npm start
```

The API runs at `http://localhost:3000`. Check the database connection with `npm run db:check`. Run the tests with `npm test`.

## API Endpoints

JSON request bodies are required where shown. Signup and login return JSON; protected endpoints require `Authorization: Bearer <token>`.

### Health

`GET /`

Returns `EVE Healthcare Backend is running`.

### Authentication

`POST /api/auth/signup`

```json
{
  "name": "Asha Patel",
  "email": "asha@example.com",
  "password": "secret123"
}
```

`POST /api/auth/login`

```json
{
  "email": "asha@example.com",
  "password": "secret123"
}
```

`GET /api/auth/profile` requires a bearer token.

### Diagnostic Centres and Tests

`POST /api/centres/tests`

```json
{
  "name": "Full Blood Count",
  "price": 35
}
```

`POST /api/centres`

```json
{
  "name": "EVE Central Diagnostics",
  "location": "London"
}
```

`POST /api/centres/:centreId/tests/:testId` connects an existing test to a centre.

`GET /api/centres` lists centres and their available tests.

### Bookings

All booking endpoints require a bearer token.

`POST /api/bookings`

```json
{
  "testId": 1,
  "centreId": 1,
  "appointmentDate": "2030-01-15T10:00:00.000Z"
}
```

`GET /api/bookings/my` lists the authenticated patient's bookings.

`GET /api/bookings/:bookingId` gets one booking owned by the authenticated patient.

`PUT /api/bookings/:bookingId/cancel` cancels an owned booking when it is still cancellable.

### Payments

`POST /api/payments` requires a bearer token:

```json
{
  "bookingId": 1,
  "status": "SUCCESS"
}
```

`POST /api/payments/webhook` is unauthenticated because it represents a payment-provider callback:

```json
{
  "transactionId": "provider-transaction-123",
  "bookingId": 1,
  "status": "SUCCESS"
}
```

Webhook transactions are idempotent. Repeating the same `transactionId` returns `Webhook already processed` and does not create another payment.

## Database Design

The PostgreSQL schema contains:

- `User`: patient identity and hashed password.
- `DiagnosticTest`: named test and price.
- `DiagnosticCentre`: centre name and location.
- `Booking`: patient, test, centre, appointment date, amount, and status.
- `Payment`: one payment per booking, with status and a unique provider transaction ID.

`DiagnosticCentre` and `DiagnosticTest` have a many-to-many relationship. A `User` has many bookings. A booking belongs to one user, test, and centre and can have one payment. Payment webhook handling updates the booking and payment together in a Prisma transaction.

## Assumptions

- Centre and diagnostic-test management are trusted internal operations and are not role-protected in this version.
- JWTs expire after one hour and are signed with `JWT_SECRET`.
- Payment providers send `SUCCESS` or `FAILED` statuses and a stable unique transaction ID.
- Appointment dates must be in the future, and cancelled or failed bookings do not block a duplicate appointment request.
- PostgreSQL is the required database for local development and deployment.

## Improvements With More Time

- Add role-based access control (RBAC) so only authorized staff can manage centres and diagnostic tests.

## Project Layout

```text
prisma/                 Schema and migrations
src/config/             Prisma client configuration
src/controllers/        Request handlers
src/middleware/         JWT authentication
src/routes/             Express routes
tests/                  API tests
```
