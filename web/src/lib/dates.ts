const TIME_ZONE = 'America/Sao_Paulo'

function dateStringFor(date: Date): string {
  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

export function todayDateString(): string {
  return dateStringFor(new Date())
}

export function tomorrowDateString(fromDate: string = todayDateString()): string {
  const [year, month, day] = fromDate.split('-').map(Number)
  // noon UTC avoids DST/timezone edge cases from shifting the calendar day
  const next = new Date(Date.UTC(year, month - 1, day, 12))
  next.setUTCDate(next.getUTCDate() + 1)
  return dateStringFor(next)
}

export function isWeekday(dateString: string): boolean {
  const day = new Date(`${dateString}T12:00:00Z`).getUTCDay()
  return day >= 1 && day <= 5
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
