# NihongoQuest Offline

A small Japanese practice app and reusable TypeScript learning core. Run a local
server, open your browser, and practise a two-day synthetic example with meaning
choices, sentence ordering, situational choices, and an ungraded written attempt.

Day 1 opens immediately. Day 2 repeats the short lesson for review and opens on the
next **local calendar day**, even if fewer than 24 hours have elapsed. Completed
days can be replayed; a completed replay replaces that day's score.

## Run locally

Requires Node.js 24 or later and npm. The initial dependency install needs internet
access. After installation and build, the app runs without an internet connection.

```sh
npm ci --ignore-scripts
npm run build
npm start
```

Open **http://127.0.0.1:4173**. Keep the terminal running; Ctrl+C stops the server.
Use this exact address and port again to see the same browser storage. `localhost`
and `127.0.0.1` have separate storage. Do not double-click `index.html`: browser ES
modules need the local HTTP server. There is no service worker or offline cache.
The server binds only to the loopback interface and serves built HTML, CSS and JS.

## Privacy and persistence

- No accounts, analytics, remote API calls, external fonts, media or runtime
  dependencies. All demo content ships in the source.
- The browser saves one `localStorage` record, `nq.pack_offline-demo.v1`, containing
  start/update timestamps, day completion, aggregate scores and self-ratings.
- Written attempts stay only in the current text box. They are neither saved nor
  sent. Leaving a practice before rating it discards that unfinished run.
- If storage fails or an existing record is unreadable, a visible notice explains
  that progress is session-only. New progress may be lost after reload. Unreadable
  records are preserved until an explicit reset.
- Reset removes only this demo's key. If removal fails, reset affects the current
  session; clear this site's data in browser settings to erase inaccessible data.
- This is ordinary unencrypted browser storage. Other people or scripts with
  access to the same browser profile and origin can read it. It is not a backup or
  synchronization service. Concurrent edits in several tabs are not synchronized.

The included server sends a restrictive Content Security Policy and does not log
requests. Browser extensions and operating-system behavior are outside the app's
control. Installing dependencies or the test browser contacts their distributors.

## Verify

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run check:public
```

`npm test` compiles the app and runs Node's built-in unit tests. The browser download
needs internet access once and is only needed for testing. Linux may also need
Playwright's documented browser system libraries. The E2E suite starts its own
loopback server on port 4179, uses disposable Chromium contexts, and refuses to
reuse an existing server. Keep that port free. No shared browser profile is used.
`npm run verify` runs the three verification commands after browser installation.

Tests cover grading, local midnight, invalid dates, malformed storage, quota and
removal failures, reset isolation, safe text rendering, completion, replay, reload,
second-day unlock, local request confinement and the local server's file boundary.
The browser suite uses a mobile viewport. It is not certification for all browsers
or assistive technologies. See [AUDIT.md](AUDIT.md) for the review checklist.

## Core modules

| Module | Purpose |
| --- | --- |
| `src/types.ts` | Types for trusted, developer-authored lesson content |
| `src/grading.ts` | Pure graders for the three objective question types |
| `src/unlock.ts` | Device-local calendar-day unlock, with explicit time input |
| `src/storage.ts` | Validated progress, session fallback and exact-key reset |
| `src/render.ts` | DOM text and furigana helpers; content is not interpreted as HTML |
| `src/sample.ts` | Two original synthetic practice days |
| `src/app.ts` | Small browser interface using the core |

Build output is in `dist/`, including JavaScript and type declarations. Consumers
can import the compiled core directly; no npm package is published. For example:

```js
import { unlockedDayCount } from './dist/src/unlock.js';
const started = new Date('2026-08-01T09:00:00Z').toISOString();
const available = unlockedDayCount(started, new Date().toISOString(), 2);
```

Timestamp arguments must be canonical UTC strings from `Date.toISOString()` with
four-digit years. Packs and progress support days 1–366; scores support 0–1000
graded items per day. IDs use 1–80 letters, digits, underscores or hyphens, starting
with a letter or digit. Invalid API inputs throw; invalid stored data is unreadable.
Clock rollback keeps day 1 available. Clock or timezone changes can change which
later days are open; this is a practice convenience, not a security or paywall rule.

Content types are compile-time interfaces, not an arbitrary-JSON import validator.
There is no uploader or content-fetching route. To customize the demo, edit trusted
`src/sample.ts`, use a new pack ID when replacing lessons, then rebuild and test.
Keep day numbers contiguous and answer IDs consistent with the available choices.

## Scope and license

This export contains generic original code, new synthetic examples, tests and local
tooling. It excludes the larger product's commercial pages, learning packs, media,
account integrations, operational records and history. It does not claim to repair
or validate the larger product. The sample is a demonstration, not a complete
course or a claim of learning effectiveness.

Original project code and synthetic examples are MIT licensed; see [LICENSE](LICENSE).
Development tools keep their own licenses. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
records the pinned dependency licenses and preserved notices. No third-party
library, test browser, generated build, local data or repository history is bundled.
`public-files.json` is the explicit publication allowlist. The automated check
supports, but does not replace, a human content and Git-history review.
