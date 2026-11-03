import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
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
import { todayDateString } from '../../lib/dates'
import { reorderItem, sortByOrder } from '../../lib/reorder'
import { capitalizeFirst } from '../../lib/text'

export type WorkTaskStatus = 'pending' | 'in_progress' | 'done'

export type WorkSubtask = {
  id: string
  title: string
  done: boolean
  inProgress?: boolean
}

export type WorkTask = {
  id: string
  clientId: string
  title: string
  notes: string | null
  status: WorkTaskStatus
  order?: number
  subtasks: WorkSubtask[]
  createdAt: Timestamp | null
  doneAt?: Timestamp | null
  lastScheduledDate?: string | null
}

export function useWorkTasks(clientId: string) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'workTasks'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(
      q,
      (snapshot) => {
        setTasks(sortByOrder(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkTask)))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useWorkTasks onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [user.uid, clientId])

  const addTask = (title: string) => {
    const capitalized = capitalizeFirst(title)
    if (!capitalized) return
    const orders = tasks.map((t) => t.order).filter((o): o is number => typeof o === 'number')
    const order = orders.length ? Math.min(...orders) - 1 : 0
    return addDoc(collection(db, 'users', user.uid, 'workTasks'), {
      clientId,
      title: capitalized,
      notes: null,
      status: 'pending' satisfies WorkTaskStatus,
      order,
      subtasks: [],
      createdAt: serverTimestamp(),
    })
  }

  const updateTaskTitle = (id: string, title: string) => {
    const capitalized = capitalizeFirst(title)
    if (!capitalized) return
    return updateDoc(doc(db, 'users', user.uid, 'workTasks', id), { title: capitalized })
  }

  const updateTaskNotes = (id: string, notes: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workTasks', id), { notes: capitalizeFirst(notes) || null })

  const completeTask = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workTasks', id), {
      status: 'done' satisfies WorkTaskStatus,
      doneAt: serverTimestamp(),
    })

  const startTask = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workTasks', id), {
      status: 'in_progress' satisfies WorkTaskStatus,
    })

  const pauseTask = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workTasks', id), {
      status: 'pending' satisfies WorkTaskStatus,
    })

  const cancelTask = (id: string) => deleteDoc(doc(db, 'users', user.uid, 'workTasks', id))

  const clearDoneTasks = () => {
    const doneTasks = tasks.filter((t) => t.status === 'done')
    if (doneTasks.length === 0) return
    const batch = writeBatch(db)
    doneTasks.forEach((t) => batch.delete(doc(db, 'users', user.uid, 'workTasks', t.id)))
    return batch.commit()
  }

  const moveTask = (fromIndex: number, toIndex: number) => {
    const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
    return reorderItem(db, ['users', user.uid, 'workTasks'], activeTasks, fromIndex, toIndex)
  }

  const addSubtask = (taskId: string, title: string) => {
    const capitalized = capitalizeFirst(title)
    if (!capitalized) return
    return updateDoc(doc(db, 'users', user.uid, 'workTasks', taskId), {
      subtasks: arrayUnion({ id: crypto.randomUUID(), title: capitalized, done: false, inProgress: false }),
    })
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done, inProgress: false } : s,
    )
    return updateDoc(doc(db, 'users', user.uid, 'workTasks', taskId), { subtasks: nextSubtasks })
  }

  const setSubtaskInProgress = (taskId: string, subtaskId: string, inProgress: boolean) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextSubtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, inProgress } : s))
    return updateDoc(doc(db, 'users', user.uid, 'workTasks', taskId), { subtasks: nextSubtasks })
  }

  const removeSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextSubtasks = task.subtasks.filter((s) => s.id !== subtaskId)
    return updateDoc(doc(db, 'users', user.uid, 'workTasks', taskId), { subtasks: nextSubtasks })
  }

  const scheduleForToday = async (task: WorkTask) => {
    const today = todayDateString()
    // Same "top of today's queue" order computation as duplicateTasks in useTasks.ts.
    const todaySnapshot = await getDocs(
      query(collection(db, 'users', user.uid, 'tasks'), where('planDate', '==', today)),
    )
    const orders = todaySnapshot.docs
      .map((d) => d.data().order)
      .filter((o): o is number => typeof o === 'number')
    const order = orders.length ? Math.min(...orders) - 1 : 0

    const batch = writeBatch(db)
    batch.set(doc(collection(db, 'users', user.uid, 'tasks')), {
      title: task.title,
      notes: task.notes,
      planDate: today,
      originDate: today,
      status: 'pending',
      pushCount: 0,
      sourceInboxItemId: null,
      sourceWorkTaskId: task.id,
      order,
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, 'users', user.uid, 'workTasks', task.id), { lastScheduledDate: today })
    return batch.commit()
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTaskTitle,
    updateTaskNotes,
    completeTask,
    startTask,
    pauseTask,
    cancelTask,
    clearDoneTasks,
    moveTask,
    addSubtask,
    toggleSubtask,
    setSubtaskInProgress,
    removeSubtask,
    scheduleForToday,
  }
}
