import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { lastNDateStrings, todayDateString } from '../../lib/dates'

export type HabitCheckin = {
  date: string
  wakeTime: string | null
  exerciseDone: boolean
}

const STREAK_DAYS = 7

function emptyCheckin(date: string): HabitCheckin {
  return { date, wakeTime: null, exerciseDone: false }
}

export function useHabitCheckins() {
  const { user } = useAuth()
  const today = todayDateString()
  const [today_, setToday] = useState<HabitCheckin>(emptyCheckin(today))
  const [recent, setRecent] = useState<Record<string, HabitCheckin>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const days = lastNDateStrings(STREAK_DAYS)
    const q = query(
      collection(db, 'users', user.uid, 'habitCheckins'),
      where(documentId(), 'in', days),
    )
    return onSnapshot(q, (snapshot) => {
      const byDate: Record<string, HabitCheckin> = {}
      snapshot.docs.forEach((d) => {
        byDate[d.id] = { date: d.id, ...d.data() } as HabitCheckin
      })
      setRecent(byDate)
      setToday(byDate[today] ?? emptyCheckin(today))
      setLoading(false)
    })
  }, [user.uid, today])

  const setWakeTime = (wakeTime: string) =>
    setDoc(
      doc(db, 'users', user.uid, 'habitCheckins', today),
      { date: today, wakeTime },
      { merge: true },
    )

  const toggleExercise = () =>
    setDoc(
      doc(db, 'users', user.uid, 'habitCheckins', today),
      { date: today, exerciseDone: !today_.exerciseDone },
      { merge: true },
    )

  const streakDays = lastNDateStrings(STREAK_DAYS).map(
    (date) => recent[date] ?? emptyCheckin(date),
  )

  return { today: today_, streakDays, loading, setWakeTime, toggleExercise }
}
