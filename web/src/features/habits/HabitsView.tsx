import { ErrorBanner } from '../../components/ErrorBanner'
import { useHabitCheckins } from './useHabitCheckins'

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })

function weekdayLabel(dateString: string) {
  // noon UTC avoids the date shifting a day back/forward across timezones
  const d = new Date(`${dateString}T12:00:00Z`)
  return WEEKDAY_FORMAT.format(d).replace('.', '')
}

export function HabitsView() {
  const { today, streakDays, loading, error, setWakeTime, toggleExercise } = useHabitCheckins()

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold text-slate-100">Hábitos</h2>
      <p className="mt-1 text-sm text-slate-400">Check-in de hoje.</p>

      <ErrorBanner message={error} />

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-300">Horário que acordou</span>
          <input
            type="time"
            value={today.wakeTime ?? ''}
            onChange={(e) => setWakeTime(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100"
          />
        </label>

        <button
          onClick={toggleExercise}
          className={`mt-4 w-full rounded-lg px-4 py-2.5 font-medium ${
            today.exerciseDone
              ? 'bg-green-600 text-white active:bg-green-700'
              : 'border border-slate-700 text-slate-300 active:bg-slate-800'
          }`}
        >
          {today.exerciseDone ? 'Treinei hoje ✓' : 'Marcar treino de hoje'}
        </button>
      </div>

      <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">Últimos 7 dias</p>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {!loading &&
          streakDays.map((day) => (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 ${
                day.exerciseDone ? 'border-green-700 bg-green-950/40' : 'border-slate-800 bg-slate-900'
              }`}
            >
              <span className="text-[10px] uppercase text-slate-500">{weekdayLabel(day.date)}</span>
              <span className={day.exerciseDone ? 'text-green-400' : 'text-slate-600'}>
                {day.exerciseDone ? '✓' : '·'}
              </span>
              <span className="text-[10px] text-slate-500">{day.wakeTime ?? '—'}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
