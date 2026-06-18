import type { Task, Room, Person } from '../types'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export async function checkAndNotifyTodayTasks(
  tasks: Task[],
  rooms: Room[],
  persons: Person[]
): Promise<number> {
  if (Notification.permission !== 'granted') return 0

  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter((t) => t.dueDate === today && !t.completed)

  if (todayTasks.length === 0) return 0

  // Group by person
  const byPerson = new Map<string, Task[]>()
  for (const task of todayTasks) {
    if (task.assignedTo.length === 0) {
      if (!byPerson.has('unassigned')) byPerson.set('unassigned', [])
      byPerson.get('unassigned')!.push(task)
    } else {
      for (const personId of task.assignedTo) {
        if (!byPerson.has(personId)) byPerson.set(personId, [])
        byPerson.get(personId)!.push(task)
      }
    }
  }

  let notified = 0

  for (const [personId, pTasks] of byPerson.entries()) {
    const person = personId === 'unassigned' ? null : persons.find((p) => p.id === personId)
    const taskList = pTasks
      .map((t) => {
        const room = rooms.find((r) => r.id === t.roomId)
        return `${room?.icon} ${t.title}`
      })
      .join('\n')

    const title = person ? `${person.avatar} ${person.name}` : '📋 Nicht zugewiesen'
    const aufgabe = pTasks.length !== 1 ? 'n' : ''
    const body = `${pTasks.length} Aufgabe${aufgabe} heute:\n${taskList}`

    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `householdapp-${personId}`,
      requireInteraction: false,
    })
    notified++
  }

  return notified
}

export async function registerPeriodicSync(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false
    await navigator.serviceWorker.ready
    return true
  } catch {
    return false
  }
}
