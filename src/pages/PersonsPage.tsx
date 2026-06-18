import { useState } from 'react'
import { useStore } from '../store'
import type { Person } from '../types'
import { PERSON_AVATARS } from '../types'
import Modal from '../components/Modal'
import Button from '../components/Button'
import Input from '../components/Input'
import EmojiPicker from '../components/EmojiPicker'

type Mode = { type: 'none' } | { type: 'add' } | { type: 'edit'; person: Person }

export default function PersonsPage() {
  const { data, addPerson, updatePerson, deletePerson } = useStore()
  const [mode, setMode] = useState<Mode>({ type: 'none' })
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(PERSON_AVATARS[0])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openAdd() {
    setName('')
    setAvatar(PERSON_AVATARS[0])
    setMode({ type: 'add' })
  }

  function openEdit(person: Person) {
    setName(person.name)
    setAvatar(person.avatar)
    setMode({ type: 'edit', person })
  }

  function save() {
    if (!name.trim()) return
    if (mode.type === 'add') {
      addPerson({ name: name.trim(), avatar, phone: '', callMeBotKey: '' })
    } else if (mode.type === 'edit') {
      updatePerson(mode.person.id, { name: name.trim(), avatar })
    }
    setMode({ type: 'none' })
  }

  const taskCount = (personId: string) =>
    data.tasks.filter((t) => t.assignedTo.includes(personId) && !t.completed).length

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Personen</h1>
        <Button onClick={openAdd} className="!py-2 !px-3 text-sm">+ Person</Button>
      </div>

      {data.persons.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-lg font-medium">Noch keine Personen</p>
          <p className="text-sm mt-1">Füge Haushaltsmitglieder hinzu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.persons.map((person) => {
            const count = taskCount(person.id)
            return (
              <div
                key={person.id}
                className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-2xl p-4 group"
              >
                <div className="text-3xl w-12 h-12 flex items-center justify-center bg-slate-700 rounded-xl shrink-0">
                  {person.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{person.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {count === 0 ? 'Keine offenen Aufgaben' : `${count} offene Aufgabe${count !== 1 ? 'n' : ''}`}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(person)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
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
          title={mode.type === 'add' ? 'Person hinzufügen' : 'Person bearbeiten'}
          onClose={() => setMode({ type: 'none' })}
          actions={
            <>
              {mode.type === 'edit' && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(mode.type === 'edit' ? mode.person.id : null)}
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
              placeholder="z.B. Milan"
              autoFocus
            />
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Avatar</p>
              <EmojiPicker options={PERSON_AVATARS} value={avatar} onChange={setAvatar} />
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Person löschen?"
          onClose={() => setConfirmDelete(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
              <Button
                variant="danger"
                onClick={() => { deletePerson(confirmDelete); setConfirmDelete(null); setMode({ type: 'none' }) }}
              >
                Löschen
              </Button>
            </>
          }
        >
          <p className="text-slate-300">Die Person wird aus allen Aufgaben entfernt. Dies kann nicht rückgängig gemacht werden.</p>
        </Modal>
      )}
    </div>
  )
}
