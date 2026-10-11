// All clock input is explicit. Unlocks use the device's local calendar day.
// Modified for the offline export: reject malformed time and numeric bounds.
export const MAX_DAYS = 366;

export function assertIso(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new RangeError('Expected a canonical UTC ISO timestamp from Date.toISOString().');
  }
}
export function localDayIndex(iso: string): number {
  assertIso(iso);
  const d = new Date(iso);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}
export function unlockedDayCount(startedAtIso: string, nowIso: string, dayCount: number): number {
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_DAYS) {
    throw new RangeError('Pack size must be an integer from 1 to 366.');
  }
  const elapsed = localDayIndex(nowIso) - localDayIndex(startedAtIso);
  return Math.max(1, Math.min(dayCount, elapsed + 1));
}
export function isUnlocked(day: number, startedAtIso: string, nowIso: string, dayCount: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= unlockedDayCount(startedAtIso, nowIso, dayCount);
}
