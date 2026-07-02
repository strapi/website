import dayjs from "dayjs"
import en from "dayjs/locale/en"
import localizedFormat from "dayjs/plugin/localizedFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

export const DATE_FORMAT = "DD/MM/YY"
export const TIME_FORMAT = "H:mm"
export const DATE_TIME_FORMAT = "DD/MM/YY HH:mm"

/**
 * All date rendering is pinned to this timezone so server (Vercel runs in UTC)
 * and client (visitor's local zone) always produce identical strings. Without
 * it, `dayjs(date).format()` uses the runtime's system zone and a post
 * published near midnight UTC renders a different calendar day on each side —
 * a React hydration text mismatch (#418) that regenerates the tree and breaks
 * interactive components (e.g. the sticky header nav).
 *
 * Pinned to Strapi's HQ timezone (San Francisco / US Pacific) so publish dates
 * reflect the editorial day the content team actually published on.
 */
export const DEFAULT_TIMEZONE = "America/Los_Angeles"

/**
 * Extend dayjs at module load (idempotent) so `.tz()` is available regardless
 * of whether `setupDayJs` was called first in the current context.
 */
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.locale(en)
dayjs.tz.setDefault(DEFAULT_TIMEZONE)

export const setupDayJs = () => {
  dayjs.extend(utc)
  dayjs.extend(timezone)
  dayjs.extend(localizedFormat)
  dayjs.locale(en)
  dayjs.tz.setDefault(DEFAULT_TIMEZONE)
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  format = DATE_FORMAT
) {
  const start = dayjs(startDate).tz(DEFAULT_TIMEZONE)
  const end = dayjs(endDate).tz(DEFAULT_TIMEZONE)
  if (end.isSame(start, "day")) {
    return end.format(format)
  }
  if (end.isSame(start, "month")) {
    return `${start.format("DD")}–${end.format(format)}`
  }
  if (!end.isSame(start, "month") && end.isSame(start, "year")) {
    return `${start.format("DD/MM")}–${end.format(format)}`
  }
  if (!end.isSame(start, "year")) {
    return `${start.format(format)}–${end.format(format)}`
  }
}

export function formatDate(
  date: string | Date | undefined,
  format = DATE_FORMAT
): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format(format)
}

export function getToday(format = DATE_FORMAT): string {
  return dayjs().tz(DEFAULT_TIMEZONE).format(format)
}

export function getDiffInDays(startDate: string, endDate: string): number {
  const start = dayjs(startDate)
  const end = dayjs(endDate)

  return end.diff(start, "day")
}
