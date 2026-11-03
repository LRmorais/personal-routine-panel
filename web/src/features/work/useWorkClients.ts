import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
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
import { reorderItem, sortByOrder } from '../../lib/reorder'
import { capitalizeFirst } from '../../lib/text'

export type WorkClient = {
  id: string
  name: string
  archived: boolean
  order?: number
  createdAt: Timestamp | null
}

const DELETE_BATCH_SIZE = 500

export function useWorkClients() {
  const { user } = useAuth()
  const [allClients, setAllClients] = useState<WorkClient[]>([])
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users', user.uid, 'workClients'),
      (snapshot) => {
        setAllClients(sortByOrder(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkClient)))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useWorkClients onSnapshot error', err)
        setError(err.message)
        setLoading(false)
      },
    )
  }, [user.uid])

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'workTasks'),
      where('status', 'in', ['pending', 'in_progress']),
    )
    return onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {}
      snapshot.docs.forEach((d) => {
        const clientId = d.data().clientId as string
        counts[clientId] = (counts[clientId] ?? 0) + 1
      })
      setOpenCounts(counts)
    })
  }, [user.uid])

  const clients = allClients.filter((c) => !c.archived)
  const archivedClients = allClients.filter((c) => c.archived)

  const addClient = (name: string) => {
    const capitalized = capitalizeFirst(name)
    if (!capitalized) return
    const orders = clients.map((c) => c.order).filter((o): o is number => typeof o === 'number')
    const order = orders.length ? Math.min(...orders) - 1 : 0
    return addDoc(collection(db, 'users', user.uid, 'workClients'), {
      name: capitalized,
      archived: false,
      order,
      createdAt: serverTimestamp(),
    })
  }

  const renameClient = (id: string, name: string) => {
    const capitalized = capitalizeFirst(name)
    if (!capitalized) return
    return updateDoc(doc(db, 'users', user.uid, 'workClients', id), { name: capitalized })
  }

  const archiveClient = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workClients', id), { archived: true })

  const unarchiveClient = (id: string) =>
    updateDoc(doc(db, 'users', user.uid, 'workClients', id), { archived: false })

  const deleteClient = async (id: string) => {
    // Tasks first, client doc last: if this gets interrupted mid-way, orphaned
    // task docs are harmless leftovers rather than a client pointing nowhere.
    const tasksSnapshot = await getDocs(
      query(collection(db, 'users', user.uid, 'workTasks'), where('clientId', '==', id)),
    )
    const taskDocs = tasksSnapshot.docs
    for (let i = 0; i < taskDocs.length; i += DELETE_BATCH_SIZE) {
      const batch = writeBatch(db)
      taskDocs.slice(i, i + DELETE_BATCH_SIZE).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    return deleteDoc(doc(db, 'users', user.uid, 'workClients', id))
  }

  const moveClient = (fromIndex: number, toIndex: number) =>
    reorderItem(db, ['users', user.uid, 'workClients'], clients, fromIndex, toIndex)

  return {
    clients,
    archivedClients,
    openCounts,
    loading,
    error,
    addClient,
    renameClient,
    archiveClient,
    unarchiveClient,
    deleteClient,
    moveClient,
  }
}
