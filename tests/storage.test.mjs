import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadProgress, beginPack, saveDay, resetPack } from '../dist/src/storage.js';

const id = 'pack_synthetic';
const key = `nq.${id}.v1`;
const t1 = '2026-08-01T09:00:00.000Z';
const t2 = '2026-08-02T09:00:00.000Z';
const day = { done: true, correctCount: 2, gradedCount: 3, anyWrong: true, selfRating: 'appropriate' };
let data, storage;
beforeEach(() => {
  data = new Map();
  storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
    key: i => [...data.keys()][i] ?? null,
    get length() { return data.size; }
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  resetPack(id);
});
afterEach(() => { resetPack(id); delete globalThis.localStorage; });

test('begin is idempotent; completed day round-trips and replaces on replay', () => {
  beginPack(id, t1);
  assert.equal(beginPack(id, t2).startedAt, t1);
  saveDay(id, 1, day, t2);
  assert.deepEqual(loadProgress(id).days[1], day);
  saveDay(id, 1, { ...day, correctCount: 3, anyWrong: false }, t2);
  assert.equal(loadProgress(id).days[1].correctCount, 3);
  assert.equal(loadProgress(id).updatedAt, t2);
});
test('failed write after a successful write keeps the newest session progress', () => {
  beginPack(id, t1);
  storage.setItem = () => { throw new Error('quota'); };
  saveDay(id, 1, day, t2);
  assert.deepEqual(loadProgress(id).days[1], day);
});
test('fully unavailable storage still permits begin, save, read and reset', () => {
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('denied'); }, configurable: true });
  beginPack(id, t1);
  saveDay(id, 1, day, t2);
  assert.deepEqual(loadProgress(id).days[1], day);
  resetPack(id);
  assert.equal(loadProgress(id), null);
});
test('reset is exact and does not erase a similarly prefixed key', () => {
  beginPack(id, t1);
  data.set(`${key}.other`, 'untouched');
  data.set(`nq.${id}.other.v1`, 'untouched');
  data.set('other.app', 'untouched');
  resetPack(id);
  assert.equal(data.get(`nq.${id}.other.v1`), 'untouched');
  assert.equal(data.get(`${key}.other`), 'untouched');
  assert.equal(data.get('other.app'), 'untouched');
});
test('reset with a removal failure cannot resurrect old progress in this session', () => {
  beginPack(id, t1);
  saveDay(id, 1, day, t2);
  storage.removeItem = () => { throw new Error('denied'); };
  resetPack(id);
  assert.equal(loadProgress(id), null);
});
test('corrupt or malformed stored progress is rejected without throwing', () => {
  const base = { v: 1, startedAt: t1, updatedAt: t2, days: {} };
  const bad = [null, [], { ...base, startedAt: 'bad' }, { ...base, days: [] },
    { ...base, days: { 1: null } }, { ...base, days: { 1: { ...day, correctCount: 9 } } },
    { ...base, days: { 0: day } }, { ...base, days: { 1: { ...day, selfRating: 'unknown' } } }];
  for (const value of bad) {
    data.set(key, JSON.stringify(value));
    assert.equal(loadProgress(id), null, JSON.stringify(value));
  }
  data.set(key, '{bad');
  assert.equal(loadProgress(id), null);
});
test('unknown stored versions survive begin and save until an explicit reset', () => {
  const raw = JSON.stringify({ v: 99, synthetic: true });
  data.set(key, raw);
  beginPack(id, t1);
  saveDay(id, 1, day, t2);
  assert.equal(data.get(key), raw);
  assert.deepEqual(loadProgress(id).days[1], day);
});
test('callers cannot mutate session progress by retaining a returned object', () => {
  storage.setItem = () => { throw new Error('quota'); };
  const initial = beginPack(id, t1);
  initial.days[1] = day;
  assert.equal(loadProgress(id).days[1], undefined);
  const input = { ...day };
  saveDay(id, 1, input, t2);
  input.correctCount = 100;
  const loaded = loadProgress(id);
  loaded.days[1].correctCount = 200;
  assert.equal(loadProgress(id).days[1].correctCount, 2);
});
test('extra input fields are never written into progress', () => {
  saveDay(id, 1, { ...day, attempt: 'SYNTHETIC-PRIVATE-ATTEMPT' }, t1);
  assert.equal(data.get(key).includes('SYNTHETIC-PRIVATE-ATTEMPT'), false);
});
test('invalid API input fails before storage changes', () => {
  assert.throws(() => beginPack('../pack', t1), TypeError);
  assert.throws(() => beginPack(id, 'invalid'), RangeError);
  assert.throws(() => saveDay(id, 1.5, day, t1), RangeError);
  assert.throws(() => saveDay(id, 1, { ...day, correctCount: -1 }, t1), TypeError);
  assert.equal(data.size, 0);
});
