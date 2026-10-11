# Bounded review checklist

This file defines repeatable checks for this small export. It is not an assertion
that a particular GitHub revision has been independently reviewed or is bug-free.

1. Start with a fresh clone. Confirm its exact commit and that tracked files match
   `public-files.json`. Inspect commit metadata, refs and outbound objects before
   any publication. Do not carry an unrelated repository's history into the export.
2. Run `npm ci --ignore-scripts`, `npm test`, install the test browser, and run
   `npm run test:e2e`. Check actual exit codes and server teardown. Retain failure
   reproductions, then test affected fixes again.
3. Run `npm run check:public`. Inspect the source and README directly as well:
   scans alone cannot establish ownership, absence of private data, or safety.
4. Inspect the lockfile's exact versions, licenses, registry URLs and integrity
   values. Run `npm audit` when network access is available. A clean advisory
   response is only a point-in-time check, not a guarantee.
5. Trace written attempts, question selections, ratings, timestamps and storage
   through the app. Verify that only the documented aggregate progress is stored
   and that no requests leave the local origin during use.
6. Exercise incorrect answers, distractor removal, replay, incomplete attempts,
   all reading modes, reload, midnight unlock, corruption, quota failure, reset
   failure and a denied-storage browser. Check mobile layout and keyboard use.
7. Verify README setup and API examples against the built app. Distinguish offline
   runtime from the initial online dependency/browser downloads.
8. Before publishing, inspect host workflows, Pages, deployments, hooks and app
   subscriptions. Bound repository event side effects. No workflow, deployment,
   release or package publication is part of this project.
9. After publication, verify the remote commit and tree, clone anonymously, repeat
   the applicable checks and investigate fresh findings. Two unchanged clean
   review passes support only the bounded surfaces above.

## Regression mechanisms covered

The export hardens the extracted storage and unlock logic for these cases:

- A successful disk record followed by a failed write must not mask newer session
  progress with stale disk data.
- Reset must target exactly one key and prevent stale progress from reappearing
  in the current session if removal fails.
- Malformed records, dates, scores and day indices must not silently enter the
  state. Unreadable or future records survive until reset.
- Returned or input objects cannot mutate the stored session state by aliasing.
- Extra input properties, including a synthetic attempt, must never be persisted.
- Fractional day numbers and invalid pack bounds are rejected.

## Remaining boundaries

Chromium is the automated browser target. Firefox, Safari, real mobile hardware,
screen-reader acceptance, multi-tab conflict resolution and third-party browser
extensions are not covered. There is no synchronization, import, backup, speech,
media, account connection or full curriculum. Content supplied by a developer is
trusted. This project provides no security guarantee against a user changing the
clock or their own local storage.
