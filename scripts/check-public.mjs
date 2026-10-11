import { readFile, readdir, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('public-files.json', root), 'utf8'));
const allowed = new Set(manifest);
const errors = [];
if (!Array.isArray(manifest) || allowed.size !== manifest.length) throw new Error('Invalid file allowlist');
for (const name of manifest) {
  if (!/^[a-zA-Z0-9_./@-]+$/.test(name) || name.includes('..') || name.startsWith('/')) errors.push(`Unsafe path: ${name}`);
  const bytes = await readFile(new URL(name, root));
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (bytes.includes(0)) errors.push(`Binary data: ${name}`);
  // Third-party legal text retains original public author attributions and URLs.
  // All other files are constrained to this project's source/test/documentation.
  if (!name.startsWith('third-party/')) {
    const rules = [
      /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /[A-Z]:[\\/]Users[\\/]/i,
      /[A-Z]:[\\/]Projects[\\/]/i,
      /https?:\/\/[^\s/]+:[^\s/@]+@/i
    ];
    if (rules.some(rule => rule.test(text))) errors.push(`Sensitive-pattern match: ${name}`);
    const emails = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) ?? [];
    if (emails.length) errors.push(`Email address requires review: ${name}`);
  }
}
async function inspect(dir = '') {
  for (const entry of await readdir(new URL(dir || '.', root), { withFileTypes: true })) {
    const path = dir + entry.name;
    if (!dir && ['.git', 'node_modules', 'dist', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    if (entry.isSymbolicLink()) errors.push(`Symlink: ${path}`);
    else if (entry.isDirectory()) await inspect(path + '/');
    else if (!allowed.has(path)) errors.push(`File outside allowlist: ${path}`);
  }
}
await inspect();
let hasGit = false;
try { hasGit = (await lstat(new URL('.git', root))).isDirectory(); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (hasGit) {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: fileURLToPath(root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
  for (const path of tracked) if (!allowed.has(path)) errors.push(`Tracked file outside allowlist: ${path}`);
  for (const path of manifest) if (!tracked.includes(path)) errors.push(`Allowed file missing from Git index: ${path}`);
}
const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
for (const [name, pkg] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (!['Apache-2.0', 'MIT'].includes(pkg.license)) errors.push(`Unreviewed package license: ${name}`);
  if (!pkg.resolved?.startsWith('https://registry.npmjs.org/') || !pkg.integrity?.startsWith('sha512-')) errors.push(`Unpinned dependency: ${name}`);
}
const runtime = ['app.ts', 'grading.ts', 'render.ts', 'sample.ts', 'storage.ts', 'types.ts', 'unlock.ts'];
for (const name of runtime) {
  const text = await readFile(new URL(`src/${name}`, root), 'utf8');
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|innerHTML|outerHTML|insertAdjacentHTML|eval)\s*(?:\(|=)/.test(text)) errors.push(`Runtime network or unsafe DOM API: ${name}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Public allowlist passed: ${manifest.length} UTF-8 files; locked development licenses and runtime API checks passed.`);
