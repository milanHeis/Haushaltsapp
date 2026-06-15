import { useState } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'
import { RECURRING_LABELS } from '../types'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Input from '../components/Input'

type Mode = { type: 'none' } | { type: 'add' } | { type: 'edit'; task: Task }

interface Props {
  roomId: string
  onBack: () => void
}

export default function TasksPage({ roomId, onBack }: Props) {
  const { data, addTask, updateTask, deleteTask, completeTask, uncompleteTask } = useStore()
  const room = data.rooms.find((r) => r.id === roomId)
  const [mode, setMode] = useState<Mode>({ type: 'none' })
  const [showCompleted, setShowCompleted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurring, setRecurring] = useState<Task['recurring']>('none')
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [taskRoomId, setTaskRoomId] = useState(roomId)

  const tasks = data.tasks.filter((t) => t.roomId === roomId)
  const openTasks = tasks.filter((t) => !t.completed)
  const doneTasks = tasks.filter((t) => t.completed)

  function openAdd() {
    setTitle('')
    setDueDate('')
    setRecurring('none')
    setAssignedTo([])
    setNotes('')
    setTaskRoomId(roomId)
    setMode({ type: 'add' })
  }

  function openEdit(task: Task) {
    setTitle(task.title)
    setDueDate(task.dueDate)
    setRecurring(task.recurring)
    setAssignedTo([...task.assignedTo])
    setNotes(task.notes)
    setTaskRoomId(task.roomId)
    setMode({ type: 'edit', task })
  }

  function save() {
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      roomId: taskRoomId,
      dueDate,
      recurring,
      assignedTo,
      notes,
    }
    if (mode.type === 'add') {
      addTask(payload)
    } else if (mode.type === 'edit') {
      updateTask(mode.task.id, payload)
    }
    setMode({ type: 'none' })
  }

  function togglePerson(id: string) {
    setAssignedTo((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  if (!room) return null

  return (
    <div className="flex-1 flex flex-col">
      <div
        className="px-4 pt-4 pb-5"
        style={{ borderBottom: `3px solid ${room.color}` }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 text-sm transition-colors"
        >
          ← Alle Räume
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{room.icon}</span>
            <h1 className="text-2xl font-bold text-white">{room.name}</h1>
          </div>
          <Button onClick={openAdd} className="!py-2 !px-3 text-sm">+ Aufgabe</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {openTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">Alle erledigt!</p>
          </div>
        )}

        {openTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => completeTask(task.id)}
            onEdit={() => openEdit(task)}
            persons={data.persons}
            rooms={data.rooms}
          />
        ))}

        {doneTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-sm text-slate-400 hover:text-slate-200 py-2 flex items-center gap-2 justify-center"
          >
            {showCompleted ? '▾' : '▸'} Erledigt ({doneTasks.length})
          </button>
        )}

        {showCompleted && doneTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => uncompleteTask(task.id)}
            onEdit={() => openEdit(task)}
            persons={data.persons}
            rooms={data.rooms}
            completed
          />
        ))}
      </div>

      {(mode.type === 'add' || mode.type === 'edit') && (
        <Modal
          title={mode.type === 'add' ? 'Aufgabe erstellen' : 'Aufgabe bearbeiten'}
          onClose={() => setMode({ type: 'none' })}
          actions={
            <>
              {mode.type === 'edit' && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(mode.type === 'edit' ? mode.task.id : null)}
                  className="mr-auto"
                >
                  Löschen
                </Button>
              )}
              <Button variant="secondary" onClick={() => setMode({ type: 'none' })}>Abbrechen</Button>
              <Button onClick={save} disabled={!title.trim()}>Speichern</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Aufgabe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Staubsaugen"
              autoFocus
            />

            <label className="block">
              <span className="block text-sm font-medium text-slate-300 mb-1.5">Raum</span>
              <select
                value={taskRoomId}
                onChange={(e) => setTaskRoomId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {data.rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-300 mb-1.5">Fälligkeitsdatum</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-300 mb-1.5">Wiederholung</span>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as Task['recurring'])}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(RECURRING_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>

            {data.persons.length > 0 && (
              <div>
                <span className="block text-sm font-medium text-slate-300 mb-2">Zugewiesen an</span>
                <div className="flex flex-wrap gap-2">
                  {data.persons.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePerson(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        assignedTo.includes(p.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {p.avatar} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="block">
              <span className="block text-sm font-medium text-slate-300 mb-1.5">Notiz (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weitere Details…"
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </label>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Aufgabe löschen?"
          onClose={() => setConfirmDelete(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
              <Button
                variant="danger"
                onClick={() => { deleteTask(confirmDelete); setConfirmDelete(null); setMode({ type: 'none' }) }}
              >
                Löschen
              </Button>
            </>
          }
        >
          <p className="text-slate-300">Diese Aufgabe wird dauerhaft gelöscht.</p>
        </Modal>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onComplete: () => void
  onEdit: () => void
  persons: import('../types').Person[]
  rooms: import('../types').Room[]
  completed?: boolean
}

function TaskCard({ task, onComplete, onEdit, persons, completed }: TaskCardProps) {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = !completed && task.dueDate && task.dueDate < today
  const isDueToday = !completed && task.dueDate === today
  const assignedPersons = persons.filter((p) => task.assignedTo.includes(p.id))

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl p-4 border transition-all ${
        completed
          ? 'bg-slate-800/50 border-slate-700/50 opacity-60'
          : isOverdue
          ? 'bg-red-900/20 border-red-700/50'
          : isDueToday
          ? 'bg-amber-900/20 border-amber-700/50'
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      <button
        onClick={onComplete}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-500 hover:border-indigo-400'
        }`}
      >
        {completed && '✓'}
      </button>

      <div className="flex-1 min-w-0" onClick={onEdit}>
        <p className={`font-medium ${completed ? 'line-through text-slate-400' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-slate-400'}`}>
              {isOverdue ? '⚠️ ' : isDueToday ? '📅 ' : '📅 '}
              {task.dueDate === today ? 'Heute' : new Date(task.dueDate + 'T00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          )}
          {task.recurring !== 'none' && (
            <span className="text-xs text-slate-400">🔄 {RECURRING_LABELS[task.recurring]}</span>
          )}
          {assignedPersons.map((p) => (
            <span key={p.id} className="text-xs text-slate-400">{p.avatar} {p.name}</span>
          ))}
        </div>
        {task.notes && <p className="text-xs text-slate-500 mt-1 truncate">{task.notes}</p>}
      </div>
    </div>
  )
}
