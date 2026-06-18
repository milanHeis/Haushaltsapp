export type RecurringInterval = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface Room {
  id: string
  name: string
  icon: string
  color: string
}

export interface Person {
  id: string
  name: string
  avatar: string     // emoji
  phone?: string     // deprecated: WhatsApp number
  callMeBotKey?: string  // deprecated: CallMeBot API key
}

export interface Task {
  id: string
  title: string
  roomId: string
  assignedTo: string[]   // person IDs
  dueDate: string        // ISO date string YYYY-MM-DD, empty = no due date
  completed: boolean
  completedAt: string    // ISO date string
  recurring: RecurringInterval
  notes: string
  createdAt: string
}

export interface AppData {
  rooms: Room[]
  persons: Person[]
  tasks: Task[]
  version: number
}

export interface AppSettings {
  githubToken: string
  gistId: string
  lastSync: string
}

export const ROOM_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
]

export const ROOM_ICONS = [
  '🛋️', '🛏️', '🚿', '🍳', '🚪', '🌿', '💪', '📚', '🖥️', '🧸',
  '👗', '🚗', '🏠', '🧹', '🪣', '🌡️', '🎮', '🛁', '🍽️', '🪴',
]

export const PERSON_AVATARS = [
  '👤', '🧑', '👦', '👧', '👨', '👩', '🧔', '👱', '🧓', '🐱',
  '🐶', '🦊', '🐼', '🐨', '🦁', '🐸', '🐧', '🦋', '🌟', '⚡',
]

export const RECURRING_LABELS: Record<RecurringInterval, string> = {
  none: 'Einmalig',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  biweekly: 'Alle 2 Wochen',
  monthly: 'Monatlich',
}
