# Third-party notices

The original code and synthetic sample in this repository use the MIT license in
`LICENSE`. No third-party course, artwork, font, media or runtime library is
included. Build output, installed packages and test browsers are not distributed
in this repository.

The lockfile pins these **development-only** dependencies:

| Package | Version | Package license | Purpose |
| --- | --- | --- | --- |
| TypeScript | 7.0.2 | Apache-2.0 | Compile the source |
| `@typescript/typescript-*` | 7.0.2 | Apache-2.0 | Optional platform-specific compiler binaries |
| `@playwright/test` | 1.61.1 | Apache-2.0 | Browser test runner |
| `playwright` | 1.61.1 | Apache-2.0 | Browser automation |
| `playwright-core` | 1.61.1 | Apache-2.0 | Browser automation implementation |
| `fsevents` | 2.3.2 | MIT | Optional macOS file watcher |

Package license fields were checked against the locked versions. The installed
compiler and browser tools contain additional third-party software; their original
copyright and license notices are preserved verbatim under `third-party/`.
Playwright's bundled dependencies use sidecar `.js.LICENSE` files. Those sidecars
are included alongside its main license and notices. Compiler platform notices
match the main TypeScript package's notices for the tested Windows x64 platform.
Other platform binaries remain external dependencies, not repository assets.

The preserved files retain their own terms and attribution; they are not
relicensed as original MIT code. When redistributing installed dependencies or a
browser binary, preserve the licenses shipped with that particular distribution.

Primary project references:

- [TypeScript license](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt)
- [Playwright license](https://github.com/microsoft/playwright/blob/main/LICENSE)
- [fsevents license](https://github.com/fsevents/fsevents/blob/v2.3.2/LICENSE)

`npm ci --ignore-scripts` retains package notices and disables lifecycle scripts.
The optional file watcher is not needed by the build or one-shot tests. Browser
installation is a separate explicit testing step; no browser is bundled here.
