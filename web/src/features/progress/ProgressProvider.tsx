import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { addDays, startOfWeek, todayDateString } from '../../lib/dates'

const HISTORY_DAYS = 120

export type DayProgress = { date: string; done: number; total: number }

type ProgressValue = {
  loading: boolean
  /** Consecutive days (ending today, or yesterday if today is still empty) with at least one done task. */
  streak: number
  bestStreak: number
  /** Today has no completed task yet but yesterday kept the streak alive. */
  atRisk: boolean
  today: DayProgress
  /** The current calendar week, Monday to Sunday (days after today are still empty). */
  week: DayProgress[]
  doneThisWeek: number
}

const ProgressContext = createContext<ProgressValue | null>(null)

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}

type Counts = Record<string, { done: number; total: number }>

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Counts>({})
  const [loading, setLoading] = useState(true)
  // Re-derive when the calendar day rolls over while the app stays open.
  const [todayKey, setTodayKey] = useState(todayDateString())

  useEffect(() => {
    const id = window.setInterval(() => setTodayKey(todayDateString()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    // Single-field range query: no composite index needed.
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('planDate', '>=', addDays(todayDateString(), -HISTORY_DAYS)),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        const next: Counts = {}
        for (const d of snapshot.docs) {
          const { planDate, status } = d.data() as { planDate: string; status: string }
          const entry = (next[planDate] ??= { done: 0, total: 0 })
          entry.total += 1
          if (status === 'done') entry.done += 1
        }
        setCounts(next)
        setLoading(false)
      },
      (err) => {
        console.error('ProgressProvider onSnapshot error', err)
        setLoading(false)
      },
    )
  }, [user.uid])

  const value = useMemo<ProgressValue>(() => {
    const today = todayKey
    const get = (date: string): DayProgress => ({ date, done: counts[date]?.done ?? 0, total: counts[date]?.total ?? 0 })

    // Current streak: walk back from today; an empty today doesn't break it yet.
    let cursor = get(today).done > 0 ? today : addDays(today, -1)
    const atRisk = get(today).done === 0 && get(cursor).done > 0
    let streak = 0
    while (get(cursor).done > 0) {
      streak += 1
      cursor = addDays(cursor, -1)
    }

    let bestStreak = 0
    let run = 0
    for (let i = HISTORY_DAYS; i >= 0; i--) {
      if (get(addDays(today, -i)).done > 0) {
        run += 1
        bestStreak = Math.max(bestStreak, run)
      } else {
        run = 0
      }
    }

    const weekStart = startOfWeek(today)
    const week = Array.from({ length: 7 }, (_, i) => get(addDays(weekStart, i)))
    return {
      loading,
      streak,
      bestStreak: Math.max(bestStreak, streak),
      atRisk,
      today: get(today),
      week,
      doneThisWeek: week.reduce((sum, d) => sum + d.done, 0),
    }
  }, [counts, loading, todayKey])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
