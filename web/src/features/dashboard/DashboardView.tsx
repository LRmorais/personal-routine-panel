import { useState, type FormEvent, type ReactNode } from 'react'
import { fireConfettiFrom } from '../../lib/confetti'
import { formatDayLabel, shortWeekdayLabel, todayDateString } from '../../lib/dates'
import { useInboxItems } from '../inbox/useInboxItems'
import { useProgress } from '../progress/ProgressProvider'
import { TodayHero } from '../progress/TodayHero'
import { useOverdueTasks, useTasks, useUpcomingTasks } from '../replanning/useTasks'
import { useWorkClients } from '../work/useWorkClients'

export type DashboardTarget = 'inbox' | 'replan' | 'work' | 'reports'

function Section({
  title,
  icon,
  action,
  onAction,
  tone = 'default',
  children,
}: {
  title: string
  icon: string
  action?: string
  onAction?: () => void
  tone?: 'default' | 'warn'
  children: ReactNode
}) {
  return (
    <section
      className={`animate-rise p-4 ${
        tone === 'warn' ? 'rounded-[1.25rem] border border-amber-500/40 bg-amber-950/20' : 'card'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-50">
          <span>{icon}</span>
          {title}
        </h3>
        {action && onAction && (
          <button onClick={onAction} className="text-xs font-semibold text-blue-300 active:text-blue-200">
            {action} ›
          </button>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function QuickCapture({ onOpenInbox }: { onOpenInbox: () => void }) {
  const { items, addItem } = useInboxItems()
  const [text, setText] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    addItem(text)
    setText('')
  }

  return (
    <Section
      title="Captura rápida"
      icon="📥"
      action={items.length > 0 ? `${items.length} no inbox` : 'Inbox'}
      onAction={onOpenInbox}
    >
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que você precisa lembrar?"
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-primary shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Anotar
        </button>
      </form>
      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="truncate rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
              {item.text}
            </li>
          ))}
          {items.length > 3 && <li className="px-1 text-xs text-slate-500">+ {items.length - 3} item(ns)</li>}
        </ul>
      )}
    </Section>
  )
}

function TodayFocus({ onOpen }: { onOpen: () => void }) {
  const today = todayDateString()
  const { tasks, loading, completeTask } = useTasks(today)
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  // Tasks already in progress come first: finishing what's started beats starting more.
  const focus = [...pending].sort((a, b) => Number(b.status === 'in_progress') - Number(a.status === 'in_progress')).slice(0, 5)

  return (
    <Section title="Foco de hoje" icon="🎯" action="Abrir dia" onAction={onOpen}>
      {loading && <p className="text-sm text-slate-500">Carregando...</p>}
      {!loading && tasks.length === 0 && (
        <button onClick={onOpen} className="w-full rounded-xl border border-dashed border-slate-600 py-4 text-sm text-slate-400 active:bg-slate-800">
          Nenhuma tarefa hoje. Toque para planejar.
        </button>
      )}
      {!loading && tasks.length > 0 && pending.length === 0 && (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-4 text-center text-sm font-medium text-emerald-300">
          Tudo concluído hoje. Descanse, você mereceu. 🎉
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {focus.map((task) => (
          <li
            key={task.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              task.status === 'in_progress' ? 'border border-blue-500/60 bg-blue-950/40' : 'bg-slate-800/60'
            }`}
          >
            <button
              onClick={(e) => {
                fireConfettiFrom(e.currentTarget, pending.length === 1 ? 70 : 24)
                completeTask(task.id)
              }}
              aria-label="Concluir"
              className="h-7 w-7 shrink-0 rounded-full border-2 border-slate-500 transition active:scale-90 active:border-green-400"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{task.title}</span>
            {task.status === 'in_progress' && <span className="text-xs text-blue-300">em andamento</span>}
          </li>
        ))}
      </ul>
      {pending.length > focus.length && (
        <p className="mt-2 text-xs text-slate-500">+ {pending.length - focus.length} pendente(s)</p>
      )}
    </Section>
  )
}

function Overdue({ onOpen }: { onOpen: () => void }) {
  const { tasks } = useOverdueTasks()
  if (tasks.length === 0) return null
  return (
    <Section title={`${tasks.length} tarefa${tasks.length === 1 ? '' : 's'} atrasada${tasks.length === 1 ? '' : 's'}`} icon="⚠️" tone="warn" action="Resolver" onAction={onOpen}>
      <p className="text-xs text-amber-200/80">
        Ficaram abertas em dias anteriores. Conclua, adie com motivo ou marque como não feita.
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {tasks.slice(0, 3).map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/60 px-3 py-2 text-sm">
            <span className="truncate text-slate-200">{task.title}</span>
            <span className="shrink-0 text-xs text-amber-300">{formatDayLabel(task.planDate)}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function WorkOverview({ onOpen }: { onOpen: () => void }) {
  const { clients, openCounts, loading } = useWorkClients()
  const rows = clients.map((c) => ({ id: c.id, name: c.name, open: openCounts[c.id] ?? 0 }))
  const max = Math.max(...rows.map((r) => r.open), 1)
  const total = rows.reduce((sum, r) => sum + r.open, 0)

  return (
    <Section title="Trabalho" icon="💼" action={total > 0 ? `${total} em aberto` : 'Abrir'} onAction={onOpen}>
      {loading && <p className="text-sm text-slate-500">Carregando...</p>}
      {!loading && rows.length === 0 && <p className="text-sm text-slate-500">Nenhum cliente ainda.</p>}
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.id}>
            <button onClick={onOpen} className="block w-full text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-slate-200">{row.name}</span>
                <span className={row.open === 0 ? 'text-xs text-emerald-400' : 'text-xs font-semibold text-slate-300'}>
                  {row.open === 0 ? 'em dia ✓' : row.open}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                  style={{ width: `${(row.open / max) * 100}%` }}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Upcoming({ onOpen }: { onOpen: () => void }) {
  const { tasks, loading } = useUpcomingTasks(todayDateString())
  if (loading || tasks.length === 0) return null

  const groups: { date: string; titles: string[] }[] = []
  for (const task of tasks) {
    const last = groups[groups.length - 1]
    if (last?.date === task.planDate) last.titles.push(task.title)
    else groups.push({ date: task.planDate, titles: [task.title] })
  }

  return (
    <Section title="Próximos dias" icon="🗓️" action="Ver semana" onAction={onOpen}>
      <ul className="flex flex-col gap-2">
        {groups.slice(0, 3).map((group) => (
          <li key={group.date} className="flex items-start gap-3">
            <span className="w-16 shrink-0 pt-0.5 text-xs font-semibold text-blue-300">{formatDayLabel(group.date)}</span>
            <span className="min-w-0 flex-1 text-sm text-slate-300">
              {group.titles.slice(0, 2).join(' · ')}
              {group.titles.length > 2 && <span className="text-slate-500"> +{group.titles.length - 2}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function WeekSummary({ onOpen }: { onOpen: () => void }) {
  const { week, doneThisWeek, loading } = useProgress()
  if (loading) return null
  const totalWeek = week.reduce((sum, d) => sum + d.total, 0)
  const rate = totalWeek === 0 ? 0 : Math.round((doneThisWeek / totalWeek) * 100)
  const max = Math.max(...week.map((d) => d.total), 1)
  const today = todayDateString()

  return (
    <Section title="Sua semana" icon="📈" action="Evolução" onAction={onOpen}>
      <div className="flex items-end justify-between gap-1.5">
        {week.map((day) => {
          const doneH = (day.done / max) * 64
          const restH = ((day.total - day.done) / max) * 64
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full flex-col justify-end overflow-hidden rounded-lg bg-slate-800/60">
                <div className="w-full bg-slate-600/70" style={{ height: restH }} />
                <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400" style={{ height: doneH }} />
              </div>
              <span className={`text-[10px] ${day.date === today ? 'font-bold text-slate-100' : 'text-slate-500'}`}>
                {shortWeekdayLabel(day.date).slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-slate-800/60 py-2">
          <p className="text-lg font-bold text-slate-50">{doneThisWeek}</p>
          <p className="text-[11px] text-slate-400">concluídas</p>
        </div>
        <div className="rounded-xl bg-slate-800/60 py-2">
          <p className="text-lg font-bold text-slate-50">{rate}%</p>
          <p className="text-[11px] text-slate-400">taxa de conclusão</p>
        </div>
      </div>
    </Section>
  )
}

export function DashboardView({ onNavigate }: { onNavigate: (tab: DashboardTarget) => void }) {
  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Início</h2>
      <TodayHero />
      <Overdue onOpen={() => onNavigate('replan')} />
      <TodayFocus onOpen={() => onNavigate('replan')} />
      <QuickCapture onOpenInbox={() => onNavigate('inbox')} />
      <WorkOverview onOpen={() => onNavigate('work')} />
      <Upcoming onOpen={() => onNavigate('replan')} />
      <WeekSummary onOpen={() => onNavigate('reports')} />
    </div>
  )
}
