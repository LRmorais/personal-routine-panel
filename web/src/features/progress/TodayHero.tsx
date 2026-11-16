import { shortWeekdayLabel } from '../../lib/dates'
import { useProgress } from './ProgressProvider'

function ProgressRing({ value, size = 84 }: { value: number; size?: number }) {
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const complete = value >= 1
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={complete ? '#34d399' : '#a78bfa'} />
          <stop offset="100%" stopColor={complete ? '#10b981' : '#e879f9'} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#262146" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(value, 1))}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  )
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    ),
  )
  if (hour < 5) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function milestone(streak: number) {
  if (streak >= 30) return 'Lenda: 30+ dias seguidos'
  if (streak >= 14) return 'Hábito formado: 2 semanas!'
  if (streak >= 7) return 'Uma semana inteira!'
  if (streak >= 3) return 'Pegando embalo'
  return null
}

function message(done: number, total: number, streak: number, atRisk: boolean) {
  if (total === 0) return atRisk ? 'Adicione uma tarefa e mantenha sua sequência viva.' : 'Planeje o dia: uma tarefa já é um começo.'
  if (done === total) return 'Dia fechado! Você cumpriu tudo hoje. 🎉'
  if (done === 0) {
    return atRisk
      ? `Conclua 1 tarefa hoje e proteja sua sequência de ${streak} dia${streak === 1 ? '' : 's'}.`
      : 'Comece pela mais fácil — o primeiro check destrava o resto.'
  }
  const left = total - done
  return left === 1 ? 'Falta só uma. Termina agora!' : `Boa! Faltam ${left} para fechar o dia.`
}

/** Daily motivation panel: progress ring, streak and the last 7 days. */
export function TodayHero() {
  const { loading, streak, bestStreak, atRisk, today, week, doneThisWeek } = useProgress()
  if (loading) return null

  const todayDate = today.date
  const ratio = today.total === 0 ? 0 : today.done / today.total
  const badge = milestone(streak)

  return (
    <section className="card animate-rise p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ProgressRing value={ratio} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none text-slate-50">{Math.round(ratio * 100)}%</span>
            <span className="mt-0.5 text-[10px] text-slate-400">
              {today.done}/{today.total}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-300">{greeting()}</p>
          <p className="mt-1 text-sm font-medium leading-snug text-slate-100">
            {message(today.done, today.total, streak, atRisk)}
          </p>
          {badge && (
            <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {week.map((day) => {
          const isToday = day.date === todayDate
          const hit = day.done > 0
          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-full items-center justify-center rounded-xl text-xs font-semibold ${
                  hit
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_12px_-4px_rgb(16_185_129/0.8)]'
                    : isToday
                      ? 'border border-dashed border-blue-400 text-blue-300'
                      : 'bg-slate-800 text-slate-600'
                }`}
              >
                {hit ? '✓' : ''}
              </span>
              <span className={`text-[10px] ${isToday ? 'font-semibold text-slate-100' : 'text-slate-500'}`}>
                {shortWeekdayLabel(day.date).slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          <b className="text-slate-100">{doneThisWeek}</b> concluídas nesta semana
        </span>
        <span>
          Recorde: <b className="text-slate-100">{bestStreak}</b> dia{bestStreak === 1 ? '' : 's'}
        </span>
      </div>
    </section>
  )
}
