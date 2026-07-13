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
