import { useEffect, useState } from 'react'
import { AuthGate, useAuth } from './auth/AuthGate'
import { InboxView } from './features/inbox/InboxView'
import { ReplanView } from './features/replanning/ReplanView'
import { HabitsView } from './features/habits/HabitsView'
import { AgendaView } from './features/agenda/AgendaView'

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

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', activeTab)
    window.history.replaceState({}, '', url)
  }, [activeTab])

  const ActiveView = TABS.find((tab) => tab.key === activeTab)!.view

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 pt-[env(safe-area-inset-top)]">
        <span className="font-semibold">ctrl_routine</span>
        <button onClick={signOutUser} className="text-sm text-slate-400 active:text-slate-200">
          Sair ({user.email})
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <ActiveView />
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
