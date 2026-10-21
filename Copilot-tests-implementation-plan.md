# Integration Tests Implementation Plan

## Goal

Add integration coverage for the user directory that exercises the HTTP API, SQLite persistence, and one real client-to-server workflow. Keep the existing Vue component tests as focused unit tests; the new tests should cover behavior those tests mock out.

## Current Coverage

- The client has Jest tests for Vue components. The `App` tests mock `client/src/api.js`, so they do not send requests to the server.
- The server exposes the users API through `server/src/app.js` and persists data in SQLite, but currently has no test suite or test script.
- `.github/workflows/test.yml` currently runs only the client Jest suite.

## Phase 1: API Integration Tests

Create a server test suite that starts the Express app, sends real HTTP requests, and uses an isolated SQLite database. Run it with the project's supported Node versions, since the application uses `node:sqlite`.

### Test environment

- Use a temporary database path for each test run; set `DATABASE_PATH` before importing the server app/database modules, which hold a module-level database connection.
- Start the app on an ephemeral local port and make requests with Node's built-in `fetch`.
- Reset fixture data between cases. If tests share one database connection, run database-mutating cases serially.
- Close the HTTP server and database connection, then remove the temporary database files during teardown.
- Add a server test script and include it in CI after the suite is working locally.

### Prioritized scenarios

#### 1. CRUD round trip

- `POST /api/users` creates a user and returns `201`, a `data` object, and a `Location` header.
- Creation trims the name, lowercases the email, normalizes the country code, and applies the default role when omitted.
- `GET /api/users/:id` returns the created user.
- `GET /api/users` includes the user and returns the expected pagination metadata.
- `PATCH /api/users/:id` changes only supplied fields and preserves the rest.
- `PUT /api/users/:id` replaces the user using the full required payload.
- `DELETE /api/users/:id` returns `204`; a subsequent fetch returns `404`.

#### 2. Validation and error responses

- Create rejects missing or invalid name, email, country, and role values with `400` and field-level `details`.
- Update rejects invalid supplied fields and an empty patch with `400`.
- Invalid IDs return `400`; valid but unknown IDs return `404`.
- Unknown routes return the documented not-found response.

#### 3. Duplicate email handling

- Creating an email that differs only by letter case from an existing email returns `409`.
- Updating a user to another user's email returns `409`.
- Updating a user without changing their own email succeeds.

#### 4. Search and pagination

- Search returns matching users and reports the normalized search term in `meta`.
- `limit`, `offset`, and `total` in `meta` match the returned page and total matching rows.
- Invalid or out-of-range query values are clamped to the API's supported bounds.

#### 5. Persistence and migration

- Running the schema migration more than once succeeds.
- Data remains available after closing and reopening a database at the same path.

## Phase 2: Client-to-Server Browser Flow

After API integration tests are stable, add one browser-level test using the real client and API, with the Vite `/api` proxy enabled. Cover the essential user workflow:

1. Load the user list from the API.
2. Create a user through the form and confirm it appears in the list.
3. Search for or edit that user and confirm the updated value appears.
4. Delete the user and confirm it disappears.

Keep form-validation details in the existing component tests unless the browser workflow reveals an important integration gap. Use a disposable database so the test is repeatable and does not depend on seeded or developer data.

## CI and Completion Criteria

- CI runs both the client unit suite and server integration suite on the supported Node matrix.
- The integration suite uses only isolated test data and leaves no database artifacts in the repository.
- The HTTP tests assert status codes and response contracts, not implementation details of individual controller functions.
- The browser flow uses a real API and database rather than mocked API calls.
- All tests pass locally and in CI on a clean checkout.
