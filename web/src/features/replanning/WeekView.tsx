import { addDays, dayNumberLabel, shortWeekdayLabel, startOfWeek, todayDateString } from '../../lib/dates'
import { DayColumn } from './DayColumn'

function formatWeekRangeLabel(weekStart: string) {
  return `${dayNumberLabel(weekStart)}–${dayNumberLabel(addDays(weekStart, 6))}`
}

function WeekNavigator({
  weekStart,
  onChange,
}: {
  weekStart: string
  onChange: (weekStart: string) => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(addDays(weekStart, -7))}
        aria-label="Semana anterior"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
      >
        ‹
      </button>
      <button
        onClick={() => onChange(startOfWeek(todayDateString()))}
        className="min-w-28 text-center text-base font-medium text-slate-100 active:text-blue-400"
      >
        {formatWeekRangeLabel(weekStart)}
      </button>
      <button
        onClick={() => onChange(addDays(weekStart, 7))}
        aria-label="Próxima semana"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
      >
        ›
      </button>
    </div>
  )
}

export function WeekView({
  weekStart,
  onChangeWeek,
}: {
  weekStart: string
  onChangeWeek: (weekStart: string) => void
}) {
  const today = todayDateString()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="mt-3 flex flex-1 flex-col overflow-hidden">
      <WeekNavigator weekStart={weekStart} onChange={onChangeWeek} />

      <div className="mt-3 flex flex-1 gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:gap-2">
        {days.map((date) => {
          const isToday = date === today
          return (
            <div
              key={date}
              className={`h-full w-[86%] shrink-0 snap-center rounded-lg border p-3 md:w-[48%] md:snap-start md:p-2 ${
                isToday ? 'border-blue-700 bg-blue-950/10' : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <DayColumn
                date={date}
                boundedHeight
                header={
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-slate-100'}`}
                    >
                      {shortWeekdayLabel(date)} · {dayNumberLabel(date)}
                    </span>
                    {isToday && <span className="text-xs text-blue-400">hoje</span>}
                  </div>
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
