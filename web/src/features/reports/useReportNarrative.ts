import { doc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthGate'
import { db } from '../../firebase'
import { GeminiApiError, generateReportNarrative } from '../../lib/gemini'
import type { PeriodType } from './useReportData'
import { statsFingerprint, type ReportStats, type StatsComparison } from './reportStats'

export type CachedReport = {
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  narrative: string
  highlights: string[]
  suggestions: string[]
  statsFingerprint: string
  generatedAt: Timestamp | null
  model: string
}

const MODEL_LABEL = 'gemini-3.5-flash-lite'

export function useReportNarrative(periodType: PeriodType, periodStart: string, periodEnd: string) {
  const { user } = useAuth()
  const reportId = `${periodType}-${periodStart}`
  const [cachedReport, setCachedReport] = useState<CachedReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setGenerateError(null)
    return onSnapshot(doc(db, 'users', user.uid, 'reports', reportId), (snapshot) => {
      setCachedReport(snapshot.exists() ? (snapshot.data() as CachedReport) : null)
      setLoading(false)
    })
  }, [user.uid, reportId])

  const generateNarrative = async (stats: ReportStats, comparison: StatsComparison | null, periodLabel: string) => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const result = await generateReportNarrative(
        JSON.stringify(stats),
        comparison ? JSON.stringify(comparison) : null,
        periodLabel,
      )
      await setDoc(doc(db, 'users', user.uid, 'reports', reportId), {
        periodType,
        periodStart,
        periodEnd,
        narrative: result.narrative,
        highlights: result.highlights,
        suggestions: result.suggestions,
        statsFingerprint: statsFingerprint(stats),
        generatedAt: serverTimestamp(),
        model: MODEL_LABEL,
      } satisfies Omit<CachedReport, 'generatedAt'> & { generatedAt: ReturnType<typeof serverTimestamp> })
    } catch (err) {
      setGenerateError(err instanceof GeminiApiError ? err.message : 'Não foi possível gerar o resumo.')
    } finally {
      setGenerating(false)
    }
  }

  return { cachedReport, loading, generating, generateError, generateNarrative }
}
