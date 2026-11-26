import { addDays, startOfDay } from "date-fns";

/** Normalize dates to local midnight to avoid time-of-day shifting calendar blocks. */
export function day(date: Date) {
  return startOfDay(date);
}
export function reviewDates(completedAt: Date) {
  const base = day(completedAt);
  return [1, 7, 30].map((offset) => addDays(base, offset));
}
