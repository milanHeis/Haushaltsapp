import { useState, useEffect } from 'react'
import { useStore } from './store'
import TodayPage from './pages/TodayPage'
import RoomsPage from './pages/RoomsPage'
import TasksPage from './pages/TasksPage'
import PersonsPage from './pages/PersonsPage'
import SettingsPage from './pages/SettingsPage'

type Tab = 'today' | 'rooms' | 'persons' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const { syncFromGitHub, settings, data } = useStore()

  useEffect(() => {
    if (settings.githubToken && settings.gistId) {
      syncFromGitHub()
    }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayCount = data.tasks.filter((t) => t.dueDate === today && !t.completed).length
  const overdueCount = data.tasks.filter((t) => t.dueDate && t.dueDate < today && !t.completed).length
  const urgentCount = todayCount + overdueCount

  function handleRoomSelect(roomId: string) {
    setSelectedRoom(roomId)
    setTab('rooms')
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto bg-slate-900 relative">
      <main className="flex-1 flex flex-col overflow-y-auto">
        {tab === 'today' && <TodayPage />}
        {tab === 'rooms' && !selectedRoom && (
          <RoomsPage onSelectRoom={handleRoomSelect} />
        )}
        {tab === 'rooms' && selectedRoom && (
          <TasksPage roomId={selectedRoom} onBack={() => setSelectedRoom(null)} />
        )}
        {tab === 'persons' && <PersonsPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      <nav className="shrink-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/80" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {([
            { id: 'today' as const, label: 'Heute', icon: '📅', badge: urgentCount },
            { id: 'rooms' as const, label: 'Räume', icon: '🏠', badge: 0 },
            { id: 'persons' as const, label: 'Personen', icon: '👤', badge: 0 },
            { id: 'settings' as const, label: 'Einstellungen', icon: '⚙️', badge: 0 },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id !== 'rooms') setSelectedRoom(null)
                setTab(item.id)
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors relative ${
                tab === item.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {tab === item.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
