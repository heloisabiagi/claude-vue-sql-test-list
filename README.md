# User Directory

A REST API for managing users, built with Express and SQLite, plus a Vue 3 frontend.

## Requirements

Node.js 22.5 or newer. The API uses Node's built-in `node:sqlite` driver, so there is
no native module to compile.

## Setup

```bash
npm run install:all   # installs server/ and client/ dependencies
npm run seed          # optional: adds five sample users
```

## Running

Two terminals:

```bash
npm run dev:api       # http://localhost:3000
npm run dev:client    # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the API, so the
browser only ever talks to one origin. Override the API port with `PORT=4000`, and
point the proxy at it with `API_URL=http://localhost:4000`.

The database file is created on first run at `server/data/users.db`. Set
`DATABASE_PATH` to put it somewhere else.

## Tests

Jest with `@vue/test-utils` covers the two components:

```bash
npm test                              # from client/
npm --prefix client test              # or from the project root
npm --prefix client run test:coverage
```

The suite runs against jsdom and needs no server. Vue SFCs go through
`@vue/vue3-jest` and plain JS through `babel-jest`; because `client/` is an ESM
package, both configs are `.cjs` ([jest.config.cjs](client/jest.config.cjs),
[babel.config.cjs](client/babel.config.cjs)). `TZ` is pinned to UTC there so date
assertions do not shift with the machine's timezone.

## API

Base URL: `http://localhost:3000/api`

| Method   | Path          | Description                                        |
| -------- | ------------- | -------------------------------------------------- |
| `GET`    | `/health`     | Liveness check                                      |
| `GET`    | `/users`      | List users; `?search=`, `?limit=` (max 200), `?offset=` |
| `GET`    | `/users/:id`  | Fetch one user                                      |
| `POST`   | `/users`      | Create a user                                       |
| `PATCH`  | `/users/:id`  | Partial update (any of `name`, `email`, `role`)     |
| `PUT`    | `/users/:id`  | Full replacement; all fields required               |
| `DELETE` | `/users/:id`  | Delete a user                                       |

### User shape

```json
{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "admin",
  "createdAt": "2026-09-24 19:02:20",
  "updatedAt": "2026-09-24 19:02:20"
}
```

`role` is one of `admin`, `member`, or `viewer`, defaulting to `member`. Names are
trimmed and emails are lowercased before they are stored.

### Responses

A single resource comes back as `{ "data": {...} }`; a list adds pagination info:

```json
{ "data": [...], "meta": { "total": 5, "limit": 50, "offset": 0, "search": "" } }
```

Errors return `{ "error": "message" }`, and validation failures add a `details`
object keyed by field name:

```json
{
  "error": "Validation failed",
  "details": { "email": "Email must be a valid address" }
}
```

Status codes: `400` invalid input, `404` unknown user or route, `409` duplicate
email, `500` unexpected failure.

### Examples

```bash
curl http://localhost:3000/api/users

curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Grace Hopper","email":"grace@example.com","role":"admin"}'

curl -X PATCH http://localhost:3000/api/users/1 \
  -H 'Content-Type: application/json' \
  -d '{"role":"viewer"}'

curl -X DELETE http://localhost:3000/api/users/1
```

## Layout

```
server/
  src/
    server.js            entry point, graceful shutdown
    app.js               Express wiring
    db/index.js          connection, pragmas, schema migration
    db/users.js          all SQL for the users table
    db/seed.js           sample data
    routes/users.js      REST endpoints
    middleware/          validation and error handling
client/
  src/
    api.js               fetch wrapper
    composables/useUsers.js   list state: search, paging, CRUD
    components/          UserForm, UserTable
    App.vue
```

## Notes

Emails are unique case-insensitively, enforced by a `UNIQUE INDEX` on
`lower(email)` rather than only in application code, so concurrent writes cannot
slip a duplicate past the check. All queries use bound parameters.

The schema is created on startup by `migrate()` in `server/src/db/index.js`. It is
idempotent, but it only creates the table — for schema changes beyond that, add a
real migration step.
