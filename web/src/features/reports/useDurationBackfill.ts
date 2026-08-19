import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { extractDurationsBatch, GeminiApiError, type DurationExtractionResult } from '../../lib/gemini'
import { writeTaskDuration, type TaskItem } from '../replanning/useTasks'

const DURATION_MENTION_REGEX = /durou|\d+\s*(h|hs|horas?|min(?:utos?)?)\b/i
const BATCH_SIZE = 15
const BATCH_DELAY_MS = 3500

export type ReviewRow = DurationExtractionResult & {
  title: string
  selected: boolean
  editedHours: number | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useDurationBackfill() {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<TaskItem[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const [rows, setRows] = useState<ReviewRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const [failedIds, setFailedIds] = useState<string[]>([])

  const [applying, setApplying] = useState(false)
  const [lastApplied, setLastApplied] = useState<{ id: string; previousValue: number | null }[]>([])

  const scanForCandidates = async () => {
    setScanning(true)
    setScanError(null)
    setRows([])
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users', user.uid, 'tasks'), orderBy('planDate', 'asc')),
      )
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskItem)
      const found = tasks.filter(
        (t) =>
          t.durationHours == null &&
          (DURATION_MENTION_REGEX.test(t.title) || (!!t.notes && DURATION_MENTION_REGEX.test(t.notes))),
      )
      setCandidates(found)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Não foi possível buscar as tarefas.')
    } finally {
      setScanning(false)
    }
  }

  const runExtraction = async () => {
    if (candidates.length === 0) return
    setProcessing(true)
    setProcessError(null)
    setFailedIds([])
    const batches: TaskItem[][] = []
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      batches.push(candidates.slice(i, i + BATCH_SIZE))
    }

    const results: ReviewRow[] = []
    const seenIds = new Set<string>()
    try {
      for (let i = 0; i < batches.length; i++) {
        setProgress({ current: i + 1, total: batches.length })
        const batch = batches[i]
        const extracted = await extractDurationsBatch(
          batch.map((t) => ({ id: t.id, title: t.title, notes: t.notes })),
        )
        const batchIds = new Set(batch.map((t) => t.id))
        for (const item of extracted) {
          if (!batchIds.has(item.id)) continue // ignore ids the model invented
          seenIds.add(item.id)
          const task = batch.find((t) => t.id === item.id)!
          results.push({
            ...item,
            title: task.title,
            selected: item.confidence !== 'low' && item.durationHours != null,
            editedHours: item.durationHours,
          })
        }
        if (i < batches.length - 1) await sleep(BATCH_DELAY_MS)
      }
      setFailedIds(candidates.filter((t) => !seenIds.has(t.id)).map((t) => t.id))
      setRows(results)
    } catch (err) {
      setProcessError(err instanceof GeminiApiError ? err.message : 'Não foi possível extrair as durações.')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  const toggleRow = (id: string, selected: boolean) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected } : r)))

  const editRow = (id: string, hours: number | null) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, editedHours: hours } : r)))

  const applySelected = async () => {
    const toApply = rows.filter((r) => r.selected && r.editedHours != null)
    if (toApply.length === 0) return
    setApplying(true)
    try {
      const previousValues = toApply.map((r) => ({
        id: r.id,
        previousValue: candidates.find((t) => t.id === r.id)?.durationHours ?? null,
      }))
      await Promise.all(toApply.map((r) => writeTaskDuration(user.uid, r.id, r.editedHours)))
      setLastApplied(previousValues)
      const appliedIds = new Set(toApply.map((r) => r.id))
      setRows((prev) => prev.filter((r) => !appliedIds.has(r.id)))
      setCandidates((prev) => prev.filter((t) => !appliedIds.has(t.id)))
    } finally {
      setApplying(false)
    }
  }

  const undoLastApply = async () => {
    if (lastApplied.length === 0) return
    setApplying(true)
    try {
      await Promise.all(lastApplied.map((r) => writeTaskDuration(user.uid, r.id, r.previousValue)))
      setLastApplied([])
    } finally {
      setApplying(false)
    }
  }

  return {
    candidates,
    scanning,
    scanError,
    scanForCandidates,
    rows,
    processing,
    progress,
    processError,
    failedIds,
    runExtraction,
    toggleRow,
    editRow,
    applying,
    applySelected,
    lastApplied,
    undoLastApply,
  }
}
