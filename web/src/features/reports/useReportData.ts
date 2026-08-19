import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { addDays, addMonths, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from '../../lib/dates'
import type { TaskItem } from '../replanning/useTasks'

export type PeriodType = 'week' | 'month'

export type DateRange = { start: string; end: string }

export function currentRangeFor(periodType: PeriodType, referenceDate: string): DateRange {
  if (periodType === 'week') return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) }
  const start = startOfMonth(referenceDate)
  return { start, end: endOfMonth(referenceDate) }
}

function previousRangeFor(periodType: PeriodType, range: DateRange): DateRange {
  if (periodType === 'week') return { start: addDays(range.start, -7), end: addDays(range.end, -7) }
  const prevStart = addMonths(range.start, -1)
  return { start: prevStart, end: endOfMonth(prevStart) }
}

function useTaskRange(uid: string, range: DateRange) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const q = query(
      collection(db, 'users', uid, 'tasks'),
      where('planDate', '>=', range.start),
      where('planDate', '<=', range.end),
      orderBy('planDate', 'asc'),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskItem))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useReportData onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [uid, range.start, range.end])

  return { tasks, loading, error }
}

export function useReportData(periodType: PeriodType, referenceDate: string) {
  const { user } = useAuth()
  const currentRange = useMemo(() => currentRangeFor(periodType, referenceDate), [periodType, referenceDate])
  const previousRange = useMemo(
    () => previousRangeFor(periodType, currentRange),
    [periodType, currentRange],
  )

  const current = useTaskRange(user.uid, currentRange)
  const previous = useTaskRange(user.uid, previousRange)

  return {
    currentTasks: current.tasks,
    previousTasks: previous.tasks,
    currentRange,
    previousRange,
    loading: current.loading || previous.loading,
    error: current.error ?? previous.error,
  }
}
