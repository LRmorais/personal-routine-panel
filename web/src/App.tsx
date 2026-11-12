import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthGate, useAuth } from './auth/AuthGate'
import { ActionSheet } from './components/ActionSheet'
import { ProgressProvider, useProgress } from './features/progress/ProgressProvider'

const InboxView = lazy(() => import('./features/inbox/InboxView').then((m) => ({ default: m.InboxView })))
const ReplanView = lazy(() =>
  import('./features/replanning/ReplanView').then((m) => ({ default: m.ReplanView })),
)
const WorkView = lazy(() => import('./features/work/WorkView').then((m) => ({ default: m.WorkView })))
const ReportsView = lazy(() =>
  import('./features/reports/ReportsView').then((m) => ({ default: m.ReportsView })),
)

const TABS = [
  { key: 'inbox', label: 'Inbox', icon: '📥', view: InboxView },
  { key: 'replan', label: 'Hoje', icon: '🎯', view: ReplanView },
  { key: 'work', label: 'Trabalho', icon: '💼', view: WorkView },
  { key: 'reports', label: 'Evolução', icon: '📈', view: ReportsView },
] as const

type TabKey = (typeof TABS)[number]['key']

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((tab) => tab.key === value)
}

function StreakPill() {
  const { loading, streak, atRisk, today } = useProgress()
  if (loading) return null
  const alive = streak > 0
  const doneToday = today.done > 0
  return (
    <div
      title={atRisk ? 'Conclua uma tarefa hoje para manter a sequência' : 'Sequência de dias com tarefas concluídas'}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
        alive
          ? doneToday
            ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-[0_4px_16px_-4px_rgb(249_115_22/0.8)]'
            : 'border border-orange-400/60 bg-orange-500/10 text-orange-300'
          : 'bg-slate-800 text-slate-400'
      }`}
    >
      <span className={alive && doneToday ? 'animate-flame inline-block' : alive ? 'inline-block' : 'inline-block grayscale'}>
        🔥
      </span>
      <span>{streak}</span>
      {atRisk && <span className="text-[10px] font-medium">salve hoje</span>}
    </div>
  )
}

function RoutineApp() {
  const { user, signOutUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('view')
    return isTabKey(fromUrl) ? fromUrl : 'inbox'
  })
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', activeTab)
    window.history.replaceState({}, '', url)
  }, [activeTab])

  const ActiveView = TABS.find((tab) => tab.key === activeTab)!.view
  const initial = (user.email ?? '?')[0].toUpperCase()

  return (
    <div className="app-bg flex h-dvh flex-col overflow-hidden text-slate-100">
      <header className="flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl btn-primary text-lg font-black text-white">
            R
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-50">Ritmo</span>
        </div>
        <div className="flex items-center gap-2">
          <StreakPill />
          <button
            onClick={() => setAccountMenuOpen(true)}
            aria-label="Conta"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-slate-200 active:bg-slate-700"
          >
            {initial}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Carregando...</div>}>
          <ActiveView />
        </Suspense>
      </main>

      <nav className="mx-3 mb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex gap-1 rounded-2xl border border-slate-700/60 bg-slate-900/90 p-1.5 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.8)] backdrop-blur">
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
                active ? 'btn-primary text-white' : 'text-slate-400 active:bg-slate-800'
              }`}
            >
              <span className={`text-lg leading-none ${active ? '' : 'opacity-70 grayscale'}`}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </nav>

      {accountMenuOpen && (
        <ActionSheet
          title={user.email ?? ''}
          onClose={() => setAccountMenuOpen(false)}
          actions={[{ label: 'Sair', onClick: signOutUser, danger: true }]}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthGate>
      <ProgressProvider>
        <RoutineApp />
      </ProgressProvider>
    </AuthGate>
  )
}

export default App
