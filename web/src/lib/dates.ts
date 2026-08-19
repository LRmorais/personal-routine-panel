import { capitalizeFirst } from './text'

const TIME_ZONE = 'America/Sao_Paulo'

function dateStringFor(date: Date): string {
  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

export function todayDateString(): string {
  return dateStringFor(new Date())
}

export function addDays(fromDate: string, delta: number): string {
  const [year, month, day] = fromDate.split('-').map(Number)
  // noon UTC avoids DST/timezone edge cases from shifting the calendar day
  const next = new Date(Date.UTC(year, month - 1, day, 12))
  next.setUTCDate(next.getUTCDate() + delta)
  return dateStringFor(next)
}

export function tomorrowDateString(fromDate: string = todayDateString()): string {
  return addDays(fromDate, 1)
}

/** 0=domingo .. 6=sábado */
export function weekdayNumber(dateString: string): number {
  return new Date(`${dateString}T12:00:00Z`).getUTCDay()
}

/** Monday of the week (Monday-first) containing `dateString`. */
export function startOfWeek(dateString: string): string {
  const weekday = weekdayNumber(dateString)
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday
  return addDays(dateString, offsetToMonday)
}

export function endOfWeek(dateString: string): string {
  return addDays(startOfWeek(dateString), 6)
}

/** First day (the 1st) of the month containing `dateString`. */
export function startOfMonth(dateString: string): string {
  const [year, month] = dateString.split('-').map(Number)
  return dateStringFor(new Date(Date.UTC(year, month - 1, 1, 12)))
}

/** Last day of the month containing `dateString`. */
export function endOfMonth(dateString: string): string {
  const [year, month] = dateString.split('-').map(Number)
  // day 0 of next month = last day of this month
  return dateStringFor(new Date(Date.UTC(year, month, 0, 12)))
}

/**
 * Adds `delta` months to a month-start anchor (the 1st of a month).
 * Only valid for day-1 inputs — avoids end-of-month rollover ambiguity
 * (e.g. "Jan 31 + 1 month").
 */
export function addMonths(monthStart: string, delta: number): string {
  const [year, month] = monthStart.split('-').map(Number)
  return dateStringFor(new Date(Date.UTC(year, month - 1 + delta, 1, 12)))
}

const SHORT_WEEKDAY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
})

export function shortWeekdayLabel(dateString: string): string {
  return SHORT_WEEKDAY_FORMAT.format(new Date(`${dateString}T12:00:00Z`)).replace('.', '').toUpperCase()
}

const DAY_NUMBER_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
})

export function dayNumberLabel(dateString: string): string {
  return DAY_NUMBER_FORMAT.format(new Date(`${dateString}T12:00:00Z`))
}

const SHORT_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  month: 'short',
})

function shortMonthLabel(dateString: string): string {
  return SHORT_MONTH_FORMAT.format(new Date(`${dateString}T12:00:00Z`)).replace('.', '')
}

/** e.g. "11–17 ago" (same month) or "29 jul–4 ago" (spanning months). */
export function formatWeekRangeLabel(start: string, end: string): string {
  const startMonth = shortMonthLabel(start)
  const endMonth = shortMonthLabel(end)
  if (startMonth === endMonth) return `${dayNumberLabel(start)}–${dayNumberLabel(end)} ${endMonth}`
  return `${dayNumberLabel(start)} ${startMonth}–${dayNumberLabel(end)} ${endMonth}`
}

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  month: 'long',
  year: 'numeric',
})

/** e.g. "Agosto de 2026" for a month-start anchor (the 1st of a month). */
export function formatMonthLabel(monthStart: string): string {
  return capitalizeFirst(MONTH_YEAR_FORMAT.format(new Date(`${monthStart}T12:00:00Z`)))
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(date: Date): string {
  return DATE_TIME_FORMAT.format(date)
}

const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

export function formatDayLabel(dateString: string): string {
  const today = todayDateString()
  if (dateString === today) return 'Hoje'
  if (dateString === addDays(today, 1)) return 'Amanhã'
  if (dateString === addDays(today, -1)) return 'Ontem'
  return DAY_LABEL_FORMAT.format(new Date(`${dateString}T12:00:00Z`)).replace('.', '')
}

/** Oldest first, e.g. lastNDateStrings(7) => the last 7 days ending today. */
export function lastNDateStrings(n: number): string[] {
  const [year, month, day] = todayDateString().split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, day, 12))
    d.setUTCDate(d.getUTCDate() - (n - 1 - i))
    return dateStringFor(d)
  })
}
