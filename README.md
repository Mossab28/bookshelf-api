# BookShelf API

Room booking REST API with conflict detection.

**Live:** https://mossabmirandeney.fr/bookshelf

## Stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication (role-based: user/admin)
- Zod input validation
- Docker (multi-stage build)

## Endpoints

### Auth
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — get JWT token

### Rooms
- `GET /api/rooms` — list rooms (filter: `?capacity=&floor=`)
- `GET /api/rooms/:id` — room details + upcoming bookings
- `POST /api/rooms` — create room (admin)
- `PATCH /api/rooms/:id` — update room (admin)
- `DELETE /api/rooms/:id` — soft-delete (admin)

### Bookings
- `GET /api/bookings` — list (filter: `?mine=true&roomId=&from=&to=`)
- `POST /api/bookings` — book a room (with overlap detection)
- `POST /api/bookings/:id/cancel` — cancel
- `GET /api/bookings/room/:roomId/availability` — check availability

## Run locally

```
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:4000

## Architecture

```
src/
  config/       env validation (Zod)
  middleware/    auth (JWT), validate (Zod), errorHandler
  routes/       auth, rooms, bookings
  services/     business logic (conflict detection, CRUD)
  schemas/      request validation schemas
  lib/          Prisma client
```

## Booking conflict detection

When creating a booking, the API checks for overlapping time slots on the same room:

```sql
WHERE roomId = ? AND status = 'CONFIRMED'
  AND startTime < :endTime AND endTime > :startTime
```

Returns `409 Conflict` with the conflicting booking details.
