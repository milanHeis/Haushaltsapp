import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppData, AppSettings, Room, Person, Task, RecurringInterval } from './types'
import { GitHubService } from './services/github'

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextDueDate(from: string, recurring: RecurringInterval): string {
  if (recurring === 'none') return ''
  const d = new Date(from)
  if (recurring === 'daily') d.setDate(d.getDate() + 1)
  else if (recurring === 'weekly') d.setDate(d.getDate() + 7)
  else if (recurring === 'biweekly') d.setDate(d.getDate() + 14)
  else if (recurring === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

interface StoreState {
  data: AppData
  settings: AppSettings
  syncStatus: 'idle' | 'syncing' | 'error' | 'ok'
  syncError: string

  // Settings
  setSettings: (s: Partial<AppSettings>) => void

  // Sync
  syncFromGitHub: () => Promise<void>
  syncToGitHub: () => Promise<void>

  // Rooms
  addRoom: (room: Omit<Room, 'id'>) => void
  updateRoom: (id: string, room: Partial<Room>) => void
  deleteRoom: (id: string) => void

  // Persons
  addPerson: (person: Omit<Person, 'id'>) => void
  updatePerson: (id: string, person: Partial<Person>) => void
  deletePerson: (id: string) => void

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>) => void
  updateTask: (id: string, task: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
}

const EMPTY_DATA: AppData = { rooms: [], persons: [], tasks: [], version: 1 }
const EMPTY_SETTINGS: AppSettings = { githubToken: '', gistId: '', lastSync: '' }

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: EMPTY_DATA,
      settings: EMPTY_SETTINGS,
      syncStatus: 'idle',
      syncError: '',

      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      syncFromGitHub: async () => {
        const { settings } = get()
        if (!settings.githubToken || !settings.gistId) return
        set({ syncStatus: 'syncing' })
        try {
          const svc = new GitHubService(settings.githubToken, settings.gistId)
          const remote = await svc.load()
          if (remote) {
            set({ data: remote, syncStatus: 'ok', settings: { ...settings, lastSync: new Date().toISOString() } })
          } else {
            set({ syncStatus: 'ok' })
          }
        } catch (e) {
          set({ syncStatus: 'error', syncError: (e as Error).message })
        }
      },

      syncToGitHub: async () => {
        const { settings, data } = get()
        if (!settings.githubToken || !settings.gistId) return
        set({ syncStatus: 'syncing' })
        try {
          const svc = new GitHubService(settings.githubToken, settings.gistId)
          await svc.save(data)
          set({ syncStatus: 'ok', settings: { ...settings, lastSync: new Date().toISOString() } })
        } catch (e) {
          set({ syncStatus: 'error', syncError: (e as Error).message })
        }
      },

      addRoom: (room) => {
        const newRoom: Room = { ...room, id: newId() }
        set((s) => ({ data: { ...s.data, rooms: [...s.data.rooms, newRoom] } }))
        get().syncToGitHub()
      },

      updateRoom: (id, room) => {
        set((s) => ({
          data: { ...s.data, rooms: s.data.rooms.map((r) => (r.id === id ? { ...r, ...room } : r)) },
        }))
        get().syncToGitHub()
      },

      deleteRoom: (id) => {
        set((s) => ({
          data: {
            ...s.data,
            rooms: s.data.rooms.filter((r) => r.id !== id),
            tasks: s.data.tasks.filter((t) => t.roomId !== id),
          },
        }))
        get().syncToGitHub()
      },

      addPerson: (person) => {
        const newPerson: Person = { ...person, id: newId() }
        set((s) => ({ data: { ...s.data, persons: [...s.data.persons, newPerson] } }))
        get().syncToGitHub()
      },

      updatePerson: (id, person) => {
        set((s) => ({
          data: { ...s.data, persons: s.data.persons.map((p) => (p.id === id ? { ...p, ...person } : p)) },
        }))
        get().syncToGitHub()
      },

      deletePerson: (id) => {
        set((s) => ({
          data: {
            ...s.data,
            persons: s.data.persons.filter((p) => p.id !== id),
            tasks: s.data.tasks.map((t) => ({ ...t, assignedTo: t.assignedTo.filter((pid) => pid !== id) })),
          },
        }))
        get().syncToGitHub()
      },

      addTask: (task) => {
        const newTask: Task = { ...task, id: newId(), completed: false, completedAt: '', createdAt: today() }
        set((s) => ({ data: { ...s.data, tasks: [...s.data.tasks, newTask] } }))
        get().syncToGitHub()
      },

      updateTask: (id, task) => {
        set((s) => ({
          data: { ...s.data, tasks: s.data.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)) },
        }))
        get().syncToGitHub()
      },

      deleteTask: (id) => {
        set((s) => ({ data: { ...s.data, tasks: s.data.tasks.filter((t) => t.id !== id) } }))
        get().syncToGitHub()
      },

      completeTask: (id) => {
        const { data } = get()
        const task = data.tasks.find((t) => t.id === id)
        if (!task) return

        if (task.recurring !== 'none' && task.dueDate) {
          // Create next occurrence instead of just marking done
          const next: Task = {
            ...task,
            id: newId(),
            completed: false,
            completedAt: '',
            dueDate: nextDueDate(task.dueDate, task.recurring),
            createdAt: today(),
          }
          set((s) => ({
            data: {
              ...s.data,
              tasks: s.data.tasks
                .map((t) => (t.id === id ? { ...t, completed: true, completedAt: today() } : t))
                .concat(next),
            },
          }))
        } else {
          set((s) => ({
            data: {
              ...s.data,
              tasks: s.data.tasks.map((t) => (t.id === id ? { ...t, completed: true, completedAt: today() } : t)),
            },
          }))
        }
        get().syncToGitHub()
      },

      uncompleteTask: (id) => {
        set((s) => ({
          data: {
            ...s.data,
            tasks: s.data.tasks.map((t) => (t.id === id ? { ...t, completed: false, completedAt: '' } : t)),
          },
        }))
        get().syncToGitHub()
      },
    }),
    {
      name: 'haushaltsapp-store',
      partialize: (s) => ({ data: s.data, settings: s.settings }),
    }
  )
)
