# Integration tests implementation plan

Before this work, nothing tested the server. The four Jest suites in `client/` all mock `api.js`, so no test sent a real HTTP request or touched SQLite, and CI ([.github/workflows/test.yml](.github/workflows/test.yml)) ran only the client tests. The sections below are in priority order.

## 1. HTTP API tests against a real SQLite database (highest value)

**Setup.** `createApp()` is exported from [server/src/app.js](server/src/app.js), which makes this straightforward:

- Use Node's built-in test runner (`node --test`) and start the app with `app.listen(0)` on a random port. Node's built-in `fetch` sends the requests, so no new dependencies are needed.
- Set `DATABASE_PATH` to a temporary file **before** importing the app. The connection opens when the module is imported, so setting it later has no effect.
- Clear the table with `DELETE FROM users` before each test.
- `node --test` runs each test file in its own process, so each file gets its own database.

**Create (`POST /api/users`)**

- A valid request returns 201, a `Location` header and the new user. Spaces are trimmed from name and email, the email is lowercased, and `" br "` is saved as `"BR"`.
- Leaving out `role` saves the user as `member`.
- A missing or invalid name, email, role or country returns 400, with a message for each field in `details`.
- An email that's already taken returns 409, including when only the letter case differs (`Ada@X.com` vs `ada@x.com`).

**Read and list (`GET /api/users`, `GET /api/users/:id`)**

- Getting a user that exists returns it. An unknown id returns 404. Ids like `0`, `-1`, `abc` or `1.5` return 400.
- `search` matches both name and email, and `meta.total` counts only the matching users, not the whole table.
- The order is newest first. `created_at` only stores whole seconds, so users created in the same second must still come out by id, newest first.
- `limit` and `offset` are clamped to a safe range, and `meta` shows the values actually used:
  - `limit=0` becomes 1
  - `limit=1000` becomes 200
  - `limit=abc` falls back to 50
  - `offset=-5` becomes 0

**Update (`PATCH`, `PUT`)**

- PATCH changes only the fields sent. Sending the user's own current email is not a conflict. Changing it to another user's email returns 409.
- PATCH with an empty body, or with only unknown fields, returns 400.
- `updated_at` changes on update and `created_at` stays the same. To test this without waiting a second, first set an old `updated_at` directly in the database.
- PATCH or PUT on an unknown id returns 404.

**Delete**

- Deleting a user returns 204. Deleting the same user again returns 404.

**Errors**

- A request body that isn't valid JSON returns 400.
- An unknown route returns 404 as JSON.
- `/api/health` responds.

## 2. Tests for known bugs

These bugs were found while reading the code. A correct test for each fails today, so each test should be added together with its fix.

1. **A request body over 100kb returns 500 instead of 413.** Express throws a "payload too large" error with `status: 413`. The error handler in [server/src/middleware/errors.js](server/src/middleware/errors.js) ignores `err.status`, so the response is "Internal server error".
2. **PUT silently resets the role.** The code comment says every field is required, but `replace` uses `validateCreate`, which fills in `role = 'member'` when it's missing. A PUT without `role` turns an admin into a member instead of returning 400.
3. **`%` and `_` in a search act as wildcards.** The search uses SQL `LIKE` without escaping them, so `?search=_` matches every user. Some test data should contain these characters.

A weaker case: `parseId` accepts `1e2` as id 100. It's harmless, but a test would record whether that's intended.

## 3. Database-level tests

- **Migration:** build a database with the old schema (no `country` column) and run `migrate()`. The column should be added, old rows should come back with `country: null`, and running `migrate()` again should change nothing.
- **Seed:** running the seed script twice should still leave exactly 5 users.
- **Duplicate emails at the database level:** insert the same email twice directly through `createUser`, skipping the API's check. The error should still have `code: 'ERR_SQLITE_ERROR'` and a message containing `UNIQUE constraint`. The 409 fallback in the error handler depends on that exact shape, and `node:sqlite` is new enough that it could change between Node versions. CI runs on Node 22 and 24, so it would catch that.

## 4. End-to-end browser tests (optional, small)

The client tests already cover the UI logic with mocks. What they can't check is that the client and server agree on request and response formats. A handful of Playwright tests against `vite preview` and the real server would cover that:

- Create a user and see it appear in the table.
- Edit a user in the modal.
- Save an email that's already taken and see the 409 message under the email field.
- Delete a user.
- Search, and move between pages.

Keep this to about five flows, since each one is slow.

## 5. CI changes

- Add a server job to the workflow that runs `node --test`.
- Update the root `npm test` so it runs the server tests too.
