import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { unlockedDayCount, isUnlocked, localDayIndex } from '../dist/src/unlock.js';

const iso = value => new Date(value).toISOString();
const start = iso('2026-08-01T09:00:00');

test('day 1 is immediate; unlocks at local midnight, not after 24 hours', () => {
  const late = iso('2026-08-01T23:50:00');
  assert.equal(unlockedDayCount(late, iso('2026-08-01T23:59:00'), 2), 1);
  assert.equal(unlockedDayCount(late, iso('2026-08-02T00:01:00'), 2), 2);
  assert.equal(localDayIndex(iso('2026-08-02T00:01:00')) - localDayIndex(late), 1);
});
test('catch-up caps at pack size; clock rollback preserves day 1', () => {
  assert.equal(unlockedDayCount(start, iso('2026-12-01T12:00:00'), 2), 2);
  assert.equal(unlockedDayCount(start, iso('2026-07-01T12:00:00'), 2), 1);
});
test('day bounds reject fractions and non-finite numbers', () => {
  for (const day of [0, -1, 1.5, 3, Infinity, NaN]) {
    assert.equal(isUnlocked(day, start, iso('2026-08-03T09:00:00'), 2), false);
  }
});
test('invalid dates and invalid pack sizes are rejected explicitly', () => {
  assert.throws(() => localDayIndex('not-a-date'), RangeError);
  for (const size of [0, -1, 1.5, NaN, Infinity, 367]) {
    assert.throws(() => unlockedDayCount(start, start, size), RangeError);
  }
});
test('calendar unlocking handles both daylight-saving transitions', () => {
  const code = `import { unlockedDayCount } from './dist/src/unlock.js';
    console.log(JSON.stringify([
      unlockedDayCount('2026-03-08T05:30:00.000Z', '2026-03-09T04:01:00.000Z', 2),
      unlockedDayCount('2026-11-01T04:30:00.000Z', '2026-11-02T05:01:00.000Z', 2)
    ]));`;
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8', env: { ...process.env, TZ: 'America/New_York' }
  });
  assert.deepEqual(JSON.parse(result), [2, 2]);
});
