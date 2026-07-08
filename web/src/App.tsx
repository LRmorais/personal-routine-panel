import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthGate, useAuth } from './auth/AuthGate'
import { ActionSheet } from './components/ActionSheet'

const InboxView = lazy(() => import('./features/inbox/InboxView').then((m) => ({ default: m.InboxView })))
const ReplanView = lazy(() =>
  import('./features/replanning/ReplanView').then((m) => ({ default: m.ReplanView })),
)
const HabitsView = lazy(() =>
  import('./features/habits/HabitsView').then((m) => ({ default: m.HabitsView })),
)
const AgendaView = lazy(() =>
  import('./features/agenda/AgendaView').then((m) => ({ default: m.AgendaView })),
)

const TABS = [
  { key: 'inbox', label: 'Inbox', view: InboxView },
  { key: 'replan', label: 'Tarefas', view: ReplanView },
  { key: 'habits', label: 'Hábitos', view: HabitsView },
  { key: 'agenda', label: 'Agenda', view: AgendaView },
] as const

type TabKey = (typeof TABS)[number]['key']

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((tab) => tab.key === value)
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-lg font-semibold tracking-tight text-slate-100">Ritmo</span>
        </div>
        <button
          onClick={() => setAccountMenuOpen(true)}
          aria-label="Conta"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-200 active:bg-slate-700"
        >
          {initial}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Carregando...</div>}>
          <ActiveView />
        </Suspense>
      </main>

      <nav className="flex border-t border-slate-800 bg-slate-900 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === tab.key ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
      <RoutineApp />
    </AuthGate>
  )
}

export default App
