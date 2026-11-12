import { useMemo, useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner'
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
  startOfMonth,
  startOfWeek,
  todayDateString,
} from '../../lib/dates'
import { compareStats, computeReportStats } from './reportStats'
import { currentRangeFor, useReportData, type PeriodType } from './useReportData'

function PeriodNavigator({
  periodType,
  referenceDate,
  onChange,
}: {
  periodType: PeriodType
  referenceDate: string
  onChange: (date: string) => void
}) {
  const range = currentRangeFor(periodType, referenceDate)
  const label =
    periodType === 'week' ? formatWeekRangeLabel(range.start, range.end) : formatMonthLabel(range.start)
  const today = todayDateString()
  const isCurrentPeriod =
    periodType === 'week' ? startOfWeek(today) === range.start : startOfMonth(today) === range.start

  const goPrev = () => onChange(periodType === 'week' ? addDays(range.start, -7) : addMonths(range.start, -1))
  const goNext = () => {
    if (isCurrentPeriod) return
    onChange(periodType === 'week' ? addDays(range.start, 7) : addMonths(range.start, 1))
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={goPrev}
        aria-label="Período anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-lg text-slate-300 active:bg-slate-700"
      >
        ‹
      </button>
      <span className="min-w-32 text-center text-sm font-medium text-slate-100">{label}</span>
      <button
        onClick={goNext}
        disabled={isCurrentPeriod}
        aria-label="Próximo período"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-lg text-slate-300 active:bg-slate-700 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function TrendBadge({ delta, suffix }: { delta: number; suffix: 'h' | '%' }) {
  if (Math.abs(delta) < 0.05) return <span className="text-xs text-slate-500">estável</span>
  const up = delta > 0
  return (
    <span className={`text-xs ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
      {suffix}
    </span>
  )
}

export function ReportsView() {
  const [periodType, setPeriodType] = useState<PeriodType>('week')
  const [referenceDate, setReferenceDate] = useState(todayDateString())

  const { currentTasks, previousTasks, currentRange, previousRange, loading, error } = useReportData(
    periodType,
    referenceDate,
  )

  const stats = useMemo(
    () => computeReportStats(currentTasks, currentRange.start, currentRange.end),
    [currentTasks, currentRange],
  )
  const previousStats = useMemo(
    () => computeReportStats(previousTasks, previousRange.start, previousRange.end),
    [previousTasks, previousRange],
  )
  const comparison = useMemo(() => compareStats(stats, previousStats), [stats, previousStats])
  const hasPreviousData = previousStats.totalTasks > 0

  const maxWeekdayHours = Math.max(...stats.byWeekday.map((d) => d.hours), 1)

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Evolução</h2>
      <p className="mt-1 text-sm text-slate-400">Sua produtividade por semana ou mês.</p>

      <div className="mt-3 flex justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
        <button
          onClick={() => setPeriodType('week')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
            periodType === 'week' ? 'btn-primary text-white' : 'text-slate-400'
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => setPeriodType('month')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
            periodType === 'month' ? 'btn-primary text-white' : 'text-slate-400'
          }`}
        >
          Mês
        </button>
      </div>

      <div className="mt-3">
        <PeriodNavigator periodType={periodType} referenceDate={referenceDate} onChange={setReferenceDate} />
      </div>

      <ErrorBanner message={error} />

      {loading && <p className="mt-4 text-sm text-slate-500">Carregando...</p>}

      {!loading && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard label="Total de tarefas" value={String(stats.totalTasks)} />
            <StatCard label="Concluídas" value={String(stats.doneCount)} />
            <StatCard label="Não concluídas" value={String(stats.notDoneCount)} />
            <StatCard label="Em aberto" value={String(stats.openCount)} />
            <StatCard label="Taxa de conclusão" value={`${Math.round(stats.completionRate * 100)}%`} />
            <StatCard label="Horas totais" value={`${stats.totalHours.toFixed(1)}h`} />
          </div>

          {hasPreviousData && (
            <div className="mt-3 flex flex-wrap gap-4 card p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Conclusão vs período anterior</span>
                <TrendBadge delta={comparison.completionRateDelta * 100} suffix="%" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Horas vs período anterior</span>
                <TrendBadge delta={comparison.totalHoursDelta} suffix="h" />
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Por dia da semana</p>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {stats.byWeekday.map((d) => (
                <div key={d.weekday} className="flex flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end rounded bg-slate-900">
                    <div
                      className="w-full rounded btn-primary"
                      style={{ height: `${(d.hours / maxWeekdayHours) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
            {stats.busiestWeekday && (
              <p className="mt-1 text-xs text-slate-500">
                Dia mais produtivo: {stats.busiestWeekday.label} ({stats.busiestWeekday.hours.toFixed(1)}h)
              </p>
            )}
          </div>

          {stats.byCategory.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              {(['work', 'life'] as const).map((groupType) => {
                const group = stats.byCategory.filter((c) => c.type === groupType)
                if (group.length === 0) return null
                return (
                  <div key={groupType}>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {groupType === 'work' ? 'Trabalho' : 'Vida pessoal'}
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      {group.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between card px-3 py-2"
                        >
                          <span className="text-sm text-slate-200">{c.label}</span>
                          <span className="text-xs text-slate-400">
                            {c.done}/{c.total} concluídas · {Math.round(c.completionRate * 100)}%
                            {c.hours > 0 && <> · {c.hours.toFixed(1)}h</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

    </div>
  )
}
