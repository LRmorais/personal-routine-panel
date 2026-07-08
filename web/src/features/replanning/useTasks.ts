import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { todayDateString, tomorrowDateString } from '../../lib/dates'
import { capitalizeFirst } from '../../lib/text'

export type TaskStatus = 'pending' | 'done'

export type ReplanReason =
  | 'ran_out_of_time'
  | 'procrastinated'
  | 'deprioritized'
  | 'blocked_by_other'
  | 'other'

export const REPLAN_REASONS: { value: ReplanReason; label: string }[] = [
  { value: 'ran_out_of_time', label: 'Não deu tempo' },
  { value: 'procrastinated', label: 'Procrastinei' },
  { value: 'deprioritized', label: 'Despriorizei' },
  { value: 'blocked_by_other', label: 'Bloqueado por outra coisa' },
  { value: 'other', label: 'Outro motivo' },
]

export type TaskItem = {
  id: string
  title: string
  notes: string | null
  planDate: string
  status: TaskStatus
  pushCount: number
  sourceInboxItemId: string | null
  createdAt: Timestamp | null
}

export type ReplanHistoryEntry = {
  id: string
  fromDate: string
  toDate: string
  reason: ReplanReason
  reasonNote: string | null
  decidedAt: Timestamp | null
}

export function useReplanHistory(taskId: string | null) {
  const { user } = useAuth()
  const [history, setHistory] = useState<ReplanHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'tasks', taskId, 'replanHistory'),
      orderBy('decidedAt', 'desc'),
    )
    return onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ReplanHistoryEntry))
      setLoading(false)
    })
  }, [user.uid, taskId])

  return { history, loading }
}

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = todayDateString()
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('planDate', '==', today),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskItem))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useTasks onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [user.uid])

  const addTask = (title: string, sourceInboxItemId: string | null = null) => {
    const capitalized = capitalizeFirst(title)
    if (!capitalized) return
    const today = todayDateString()
    return addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: capitalized,
      notes: null,
      planDate: today,
      originDate: today,
      status: 'pending' satisfies TaskStatus,
      pushCount: 0,
      sourceInboxItemId,
      createdAt: serverTimestamp(),
    })
  }

  const updateTaskNotes = (id: string, notes: string) =>
    updateDoc(doc(db, 'users', user.uid, 'tasks', id), { notes: capitalizeFirst(notes) || null })

  const completeTask = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
      status: 'done' satisfies TaskStatus,
      doneAt: serverTimestamp(),
    })

  const cancelTask = (id: string) => deleteDoc(doc(db, 'users', user.uid, 'tasks', id))

  const pushTaskToTomorrow = (task: TaskItem, reason: ReplanReason, reasonNote: string) => {
    const toDate = tomorrowDateString(task.planDate)
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', user.uid, 'tasks', task.id), {
      planDate: toDate,
      pushCount: task.pushCount + 1,
    })
    batch.set(doc(collection(db, 'users', user.uid, 'tasks', task.id, 'replanHistory')), {
      fromDate: task.planDate,
      toDate,
      reason,
      reasonNote: capitalizeFirst(reasonNote) || null,
      decidedAt: serverTimestamp(),
    })
    return batch.commit()
  }

  return { tasks, loading, error, addTask, completeTask, cancelTask, pushTaskToTomorrow, updateTaskNotes }
}
