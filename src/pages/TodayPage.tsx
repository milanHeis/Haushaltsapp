import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { checkAndNotifyTodayTasks } from '../services/notifications'
import { RECURRING_LABELS } from '../types'
import Button from '../components/Button'

export default function TodayPage() {
  const { data } = useStore()
  const [notifStatus, setNotifStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (Notification.permission === 'granted') {
      checkAndNotifyTodayTasks(data.tasks, data.rooms, data.persons).then(setNotifCount)
    }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = data.tasks.filter((t) => t.dueDate === today && !t.completed)
  const overdueOpen = data.tasks.filter((t) => t.dueDate && t.dueDate < today && !t.completed)
  const todayDone = data.tasks.filter((t) => t.dueDate === today && t.completed)

  const weekday = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })

  async function sendNotifications() {
    setNotifStatus('sending')
    const count = await checkAndNotifyTodayTasks(data.tasks, data.rooms, data.persons)
    setNotifCount(count)
    setNotifStatus('done')
  }

  const tasksByPerson = (personId: string) =>
    todayTasks.filter((t) => t.assignedTo.includes(personId))

  const unassigned = todayTasks.filter((t) => t.assignedTo.length === 0)

  return (
    <div className="flex-1 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Heute</h1>
        <p className="text-slate-400 text-sm capitalize">{weekday}</p>
      </div>

      {overdueOpen.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
            ⚠️ Überfällig ({overdueOpen.length})
          </h2>
          <div className="space-y-2">
            {overdueOpen.map((task) => {
              const room = data.rooms.find((r) => r.id === task.roomId)
              return (
                <TodayTaskCard
                  key={task.id}
                  task={task}
                  room={room}
                  persons={data.persons.filter((p) => task.assignedTo.includes(p.id))}
                  overdue
                />
              )
            })}
          </div>
        </section>
      )}

      {todayTasks.length === 0 && overdueOpen.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-medium text-white">Nichts zu tun!</p>
          <p className="text-sm mt-1">Genieße den freien Tag</p>
        </div>
      ) : (
        <>
          {data.persons.map((person) => {
            const pTasks = tasksByPerson(person.id)
            if (pTasks.length === 0) return null
            return (
              <section key={person.id} className="mb-6">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>{person.avatar}</span> {person.name}
                  <span className="ml-auto text-indigo-400 font-normal normal-case tracking-normal">
                    {pTasks.length} Aufgabe{pTasks.length !== 1 ? 'n' : ''}
                  </span>
                </h2>
                <div className="space-y-2">
                  {pTasks.map((task) => {
                    const room = data.rooms.find((r) => r.id === task.roomId)
                    return (
                      <TodayTaskCard
                        key={task.id}
                        task={task}
                        room={room}
                        persons={data.persons.filter((p) => task.assignedTo.includes(p.id))}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}

          {unassigned.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Nicht zugewiesen
              </h2>
              <div className="space-y-2">
                {unassigned.map((task) => {
                  const room = data.rooms.find((r) => r.id === task.roomId)
                  return (
                    <TodayTaskCard
                      key={task.id}
                      task={task}
                      room={room}
                      persons={[]}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {todayDone.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-2">
            ✅ Heute erledigt ({todayDone.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {todayDone.map((task) => {
              const room = data.rooms.find((r) => r.id === task.roomId)
              return (
                <TodayTaskCard
                  key={task.id}
                  task={task}
                  room={room}
                  persons={data.persons.filter((p) => task.assignedTo.includes(p.id))}
                  completed
                />
              )
            })}
          </div>
        </section>
      )}

      {(todayTasks.length > 0 || overdueOpen.length > 0) && Notification.permission === 'granted' && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Button
            onClick={sendNotifications}
            disabled={notifStatus === 'sending'}
            variant="secondary"
            fullWidth
          >
            {notifStatus === 'idle' && '🔔 Benachrichtigungen senden'}
            {notifStatus === 'sending' && '⏳ Wird gesendet…'}
            {notifStatus === 'done' && `✅ ${notifCount} gesendet`}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-2">
            Sendet eine Benachrichtigung an alle Personen mit Aufgaben heute
          </p>
        </div>
      )}
    </div>
  )
}

interface TodayTaskCardProps {
  task: import('../types').Task
  room: import('../types').Room | undefined
  persons: import('../types').Person[]
  completed?: boolean
  overdue?: boolean
}

function TodayTaskCard({ task, room, persons, completed, overdue }: TodayTaskCardProps) {
  const { completeTask, uncompleteTask } = useStore()

  return (
    <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
      completed
        ? 'bg-slate-800/40 border-slate-700/40'
        : overdue
        ? 'bg-red-900/20 border-red-700/40'
        : 'bg-slate-800 border-slate-700'
    }`}>
      <button
        onClick={() => completed ? uncompleteTask(task.id) : completeTask(task.id)}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-500 hover:border-indigo-400'
        }`}
      >
        {completed && <span className="text-sm">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${completed ? 'line-through text-slate-400' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {room && (
            <span className="text-xs text-slate-400">
              {room.icon} {room.name}
            </span>
          )}
          {task.recurring !== 'none' && (
            <span className="text-xs text-slate-500">🔄 {RECURRING_LABELS[task.recurring]}</span>
          )}
          {persons.map((p) => (
            <span key={p.id} className="text-xs text-indigo-300">{p.avatar} {p.name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
