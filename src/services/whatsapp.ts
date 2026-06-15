import type { Person, Task, Room } from '../types'

// CallMeBot: free WhatsApp notifications, each person needs their own API key.
// Setup: send "I allow callmebot to send me messages" to +34 644 44 10 26 on WhatsApp,
// then the bot replies with the apikey for that phone number.

export async function sendWhatsAppNotification(
  person: Person,
  task: Task,
  room: Room
): Promise<boolean> {
  if (!person.phone || !person.callMeBotKey) return false

  const text = encodeURIComponent(
    `🏠 Haushaltsaufgabe heute:\n📍 ${room.name}\n✅ ${task.title}${task.notes ? `\n📝 ${task.notes}` : ''}`
  )
  const url = `https://api.callmebot.com/whatsapp.php?phone=${person.phone}&text=${text}&apikey=${person.callMeBotKey}`

  try {
    // CallMeBot uses CORS-restricted API, so we use no-cors mode and assume success
    await fetch(url, { mode: 'no-cors' })
    return true
  } catch {
    return false
  }
}

export async function sendBulkNotifications(
  tasks: Task[],
  persons: Person[],
  rooms: Room[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  const today = new Date().toISOString().slice(0, 10)

  const todayTasks = tasks.filter(
    (t) => !t.completed && t.dueDate === today && t.assignedTo.length > 0
  )

  for (const task of todayTasks) {
    const room = rooms.find((r) => r.id === task.roomId)
    if (!room) continue

    for (const personId of task.assignedTo) {
      const person = persons.find((p) => p.id === personId)
      if (!person) continue

      const ok = await sendWhatsAppNotification(person, task, room)
      if (ok) sent++
      else failed++

      // Rate limit: CallMeBot allows ~1 msg/sec
      await new Promise((r) => setTimeout(r, 1200))
    }
  }

  return { sent, failed }
}
