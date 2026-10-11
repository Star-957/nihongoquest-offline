// Versioned local progress. Only aggregate scores and ratings are persisted.
// Modified for the offline export: strict validation, exact reset, safe copies
// and coherent session fallback after a write or removal failure.
import { assertIso, MAX_DAYS } from './unlock.js';

export interface DayProgress {
  done: boolean;
  correctCount: number;
  gradedCount: number;
  anyWrong: boolean;
  selfRating?: 'easy' | 'appropriate' | 'difficult';
  realWorldDone?: boolean;
}
export interface PackProgress {
  v: 1;
  startedAt: string;
  updatedAt: string;
  days: Record<number, DayProgress>;
}

const memory = new Map<string, PackProgress | null>();
const copy = <T>(value: T): T => structuredClone(value);
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function key(id: string): string {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id)) {
    throw new TypeError('Pack ID must contain 1-80 letters, digits, underscores or hyphens.');
  }
  return `nq.${id}.v1`;
}
function cleanDay(value: unknown): DayProgress {
  if (!object(value) || typeof value.done !== 'boolean' || typeof value.anyWrong !== 'boolean' ||
      !Number.isInteger(value.correctCount) || !Number.isInteger(value.gradedCount) ||
      (value.correctCount as number) < 0 || (value.correctCount as number) > (value.gradedCount as number) ||
      (value.gradedCount as number) > 1000 ||
      (value.selfRating !== undefined && !['easy', 'appropriate', 'difficult'].includes(value.selfRating as string)) ||
      (value.realWorldDone !== undefined && typeof value.realWorldDone !== 'boolean')) {
    throw new TypeError('Invalid day progress. Counts must be integers from 0 to 1000.');
  }
  return {
    done: value.done, correctCount: value.correctCount as number,
    gradedCount: value.gradedCount as number, anyWrong: value.anyWrong,
    ...(value.selfRating === undefined ? {} : { selfRating: value.selfRating as DayProgress['selfRating'] }),
    ...(value.realWorldDone === undefined ? {} : { realWorldDone: value.realWorldDone as boolean })
  };
}
function parse(raw: string | null): PackProgress | null {
  if (raw === null || raw.length > 150_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.v !== 1 || !object(value.days)) return null;
    assertIso(value.startedAt);
    assertIso(value.updatedAt);
    const days: Record<number, DayProgress> = {};
    for (const [day, progress] of Object.entries(value.days)) {
      const number = Number(day);
      if (!Number.isInteger(number) || String(number) !== day || number < 1 || number > MAX_DAYS) return null;
      days[number] = cleanDay(progress);
    }
    return { v: 1, startedAt: value.startedAt, updatedAt: value.updatedAt, days };
  } catch { return null; }
}
function read(k: string): PackProgress | null {
  if (memory.has(k)) return copy(memory.get(k) ?? null);
  try { return parse(localStorage.getItem(k)); }
  catch { return null; }
}
function write(k: string, progress: PackProgress): void {
  try {
    const prior = localStorage.getItem(k);
    // Preserve unreadable or future data until the user explicitly resets it.
    if (prior !== null && parse(prior) === null) throw new Error('Unreadable existing record');
    localStorage.setItem(k, JSON.stringify(progress));
    memory.delete(k);
  } catch { memory.set(k, copy(progress)); }
}

export function loadProgress(packId: string): PackProgress | null { return read(key(packId)); }
export function beginPack(packId: string, nowIso: string): PackProgress {
  const k = key(packId);
  assertIso(nowIso);
  const existing = read(k);
  if (existing) return existing;
  const fresh: PackProgress = { v: 1, startedAt: nowIso, updatedAt: nowIso, days: {} };
  write(k, fresh);
  return copy(fresh);
}
export function saveDay(packId: string, day: number, progress: DayProgress, nowIso: string): PackProgress {
  const k = key(packId);
  assertIso(nowIso);
  if (!Number.isInteger(day) || day < 1 || day > MAX_DAYS) throw new RangeError('Day must be an integer from 1 to 366.');
  const safe = cleanDay(progress);
  const current = read(k) ?? { v: 1 as const, startedAt: nowIso, updatedAt: nowIso, days: {} };
  const next: PackProgress = { ...current, updatedAt: nowIso, days: { ...current.days, [day]: safe } };
  write(k, next);
  return copy(next);
}
/** True means disk removal succeeded. False means only this session is reset. */
export function resetPack(packId: string): boolean {
  const k = key(packId);
  try { localStorage.removeItem(k); memory.delete(k); return true; }
  catch { memory.set(k, null); return false; }
}
/** Session mode cannot guarantee persistence after reload. */
export function persistenceMode(packId: string): 'local' | 'session' {
  const k = key(packId);
  if (memory.has(k)) return 'session';
  try { localStorage.getItem(k); return 'local'; } catch { return 'session'; }
}
