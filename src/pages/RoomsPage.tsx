import { useState } from 'react'
import { useStore } from '../store'
import type { Room } from '../types'
import { ROOM_ICONS, ROOM_COLORS } from '../types'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Input from '../components/Input'
import EmojiPicker from '../components/EmojiPicker'
import ColorPicker from '../components/ColorPicker'

type Mode = { type: 'none' } | { type: 'add' } | { type: 'edit'; room: Room }

export default function RoomsPage({ onSelectRoom }: { onSelectRoom: (id: string) => void }) {
  const { data, addRoom, updateRoom, deleteRoom } = useStore()
  const [mode, setMode] = useState<Mode>({ type: 'none' })
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ROOM_ICONS[0])
  const [color, setColor] = useState(ROOM_COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openAdd() {
    setName('')
    setIcon(ROOM_ICONS[0])
    setColor(ROOM_COLORS[0])
    setMode({ type: 'add' })
  }

  function openEdit(room: Room) {
    setName(room.name)
    setIcon(room.icon)
    setColor(room.color)
    setMode({ type: 'edit', room })
  }

  function save() {
    if (!name.trim()) return
    if (mode.type === 'add') {
      addRoom({ name: name.trim(), icon, color })
    } else if (mode.type === 'edit') {
      updateRoom(mode.room.id, { name: name.trim(), icon, color })
    }
    setMode({ type: 'none' })
  }

  const taskCounts = (roomId: string) =>
    data.tasks.filter((t) => t.roomId === roomId && !t.completed).length

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Räume</h1>
        <Button onClick={openAdd} className="!py-2 !px-3 text-sm">+ Raum</Button>
      </div>

      {data.rooms.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-lg font-medium">Noch keine Räume</p>
          <p className="text-sm mt-1">Erstelle deinen ersten Raum</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.rooms.map((room) => {
            const count = taskCounts(room.id)
            return (
              <div key={room.id} className="relative group">
                <button
                  onClick={() => onSelectRoom(room.id)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-left hover:border-slate-600 active:scale-95 transition-all"
                  style={{ borderTopColor: room.color, borderTopWidth: 3 }}
                >
                  <div className="text-3xl mb-2">{room.icon}</div>
                  <div className="font-semibold text-white truncate">{room.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {count === 0 ? 'Keine offenen Aufgaben' : `${count} Aufgabe${count !== 1 ? 'n' : ''}`}
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(room) }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-sm"
                >
                  ✏️
                </button>
              </div>
            )
          })}
        </div>
      )}

      {(mode.type === 'add' || mode.type === 'edit') && (
        <Modal
          title={mode.type === 'add' ? 'Raum erstellen' : 'Raum bearbeiten'}
          onClose={() => setMode({ type: 'none' })}
          actions={
            <>
              {mode.type === 'edit' && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(mode.type === 'edit' ? mode.room.id : null)}
                  className="mr-auto"
                >
                  Löschen
                </Button>
              )}
              <Button variant="secondary" onClick={() => setMode({ type: 'none' })}>Abbrechen</Button>
              <Button onClick={save} disabled={!name.trim()}>Speichern</Button>
            </>
          }
        >
          <div className="space-y-5">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Wohnzimmer"
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
            />
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Icon</p>
              <EmojiPicker options={ROOM_ICONS} value={icon} onChange={setIcon} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Farbe</p>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Raum löschen?"
          onClose={() => setConfirmDelete(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
              <Button
                variant="danger"
                onClick={() => { deleteRoom(confirmDelete); setConfirmDelete(null); setMode({ type: 'none' }) }}
              >
                Löschen
              </Button>
            </>
          }
        >
          <p className="text-slate-300">Alle Aufgaben in diesem Raum werden ebenfalls gelöscht. Dies kann nicht rückgängig gemacht werden.</p>
        </Modal>
      )}
    </div>
  )
}
