import { useState } from 'react'
import { DayColumn } from './DayColumn'
import { addDays, formatDayLabel, startOfWeek, todayDateString } from '../../lib/dates'
import { useUpcomingTasks, type TaskItem } from './useTasks'
import { WeekView } from './WeekView'
import { TodayHero } from '../progress/TodayHero'

function DayNavigator({
  date,
  onChange,
}: {
  date: string
  onChange: (date: string) => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Dia anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-lg text-slate-300 active:bg-slate-700"
      >
        ‹
      </button>
      <button
        onClick={() => onChange(todayDateString())}
        className="min-w-28 text-center text-base font-bold text-slate-50 active:text-blue-400"
      >
        {formatDayLabel(date)}
      </button>
      <button
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Próximo dia"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-lg text-slate-300 active:bg-slate-700"
      >
        ›
      </button>
    </div>
  )
}

function UpcomingSection({
  afterDate,
  onJumpTo,
}: {
  afterDate: string
  onJumpTo: (date: string) => void
}) {
  const { tasks, loading } = useUpcomingTasks(afterDate)
  if (loading || tasks.length === 0) return null

  const groups: { date: string; tasks: TaskItem[] }[] = []
  for (const task of tasks) {
    const group = groups[groups.length - 1]
    if (group?.date === task.planDate) group.tasks.push(task)
    else groups.push({ date: task.planDate, tasks: [task] })
  }

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Próximos dias</p>
      <div className="mt-2 flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.date}>
            <button
              onClick={() => onJumpTo(group.date)}
              className="text-xs font-medium text-blue-400 active:text-blue-300"
            >
              {formatDayLabel(group.date)}
            </button>
            <div className="mt-1 flex flex-col gap-1.5">
              {group.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onJumpTo(group.date)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-left text-sm text-slate-300 active:bg-slate-800"
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReplanView({ initialDate }: { initialDate?: string }) {
  const [viewDate, setViewDate] = useState(initialDate ?? todayDateString())
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate ?? todayDateString()))

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden p-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Hoje</h2>
      <p className="mt-1 text-sm text-slate-400">
        No fim do dia, toda tarefa pendente precisa de um motivo pra ir pra amanhã.
      </p>

      <div className="mt-3 flex justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
        <button
          onClick={() => setMode('day')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
            mode === 'day' ? 'btn-primary text-white' : 'text-slate-400'
          }`}
        >
          Dia
        </button>
        <button
          onClick={() => {
            setWeekStart(startOfWeek(viewDate))
            setMode('week')
          }}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
            mode === 'week' ? 'btn-primary text-white' : 'text-slate-400'
          }`}
        >
          Semana
        </button>
      </div>

      {mode === 'week' && <WeekView weekStart={weekStart} onChangeWeek={setWeekStart} />}

      {mode === 'day' && (
        <>
          <div className="mt-3">
            <DayNavigator date={viewDate} onChange={setViewDate} />
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-4">
            <div className="mt-3">
              <TodayHero />
            </div>
            <DayColumn date={viewDate} />
            <UpcomingSection
              afterDate={viewDate > todayDateString() ? viewDate : todayDateString()}
              onJumpTo={setViewDate}
            />
          </div>
        </>
      )}
    </div>
  )
}
