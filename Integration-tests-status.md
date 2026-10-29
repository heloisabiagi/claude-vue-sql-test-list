## Integration tests implementation Status

| Section | Status |
|---|---|
| 1. HTTP API tests against a real SQLite database | Done: 41 tests in [server/test/](server/test/), in [PR #3](https://github.com/heloisabiagi/claude-vue-sql-test-list/pull/3) (open) |
| 2. Tests for known bugs | Not started. Each test should land together with its fix. |
| 3. Database-level tests | Not started |
| 4. End-to-end browser tests (optional) | Not started |
| 5. CI changes | Done in PR #3: an `api` job on Node 22 and 24, and the root `npm test` runs the server tests |
