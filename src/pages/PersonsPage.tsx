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
  const [phone, setPhone] = useState('')
  const [callMeBotKey, setCallMeBotKey] = useState('')
  const [avatar, setAvatar] = useState(PERSON_AVATARS[0])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function openAdd() {
    setName('')
    setPhone('')
    setCallMeBotKey('')
    setAvatar(PERSON_AVATARS[0])
    setTestStatus('idle')
    setMode({ type: 'add' })
  }

  function openEdit(person: Person) {
    setName(person.name)
    setPhone(person.phone)
    setCallMeBotKey(person.callMeBotKey)
    setAvatar(person.avatar)
    setTestStatus('idle')
    setMode({ type: 'edit', person })
  }

  function save() {
    if (!name.trim()) return
    if (mode.type === 'add') {
      addPerson({ name: name.trim(), phone: phone.trim(), callMeBotKey: callMeBotKey.trim(), avatar })
    } else if (mode.type === 'edit') {
      updatePerson(mode.person.id, { name: name.trim(), phone: phone.trim(), callMeBotKey: callMeBotKey.trim(), avatar })
    }
    setMode({ type: 'none' })
  }

  async function testWhatsApp() {
    if (!phone || !callMeBotKey) return
    setTestStatus('sending')
    try {
      const text = encodeURIComponent('🏠 Haushaltsapp Test – WhatsApp funktioniert!')
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${callMeBotKey}`, { mode: 'no-cors' })
      setTestStatus('sent')
    } catch {
      setTestStatus('error')
    }
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
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    {person.phone ? (
                      <span className="flex items-center gap-1">📱 {person.phone}</span>
                    ) : (
                      <span className="text-amber-400">Kein WhatsApp eingerichtet</span>
                    )}
                  </div>
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
            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm font-semibold text-slate-200 mb-1">WhatsApp-Benachrichtigungen</p>
              <p className="text-xs text-slate-400 mb-4">
                Sende einmalig <span className="text-white font-mono">"I allow callmebot to send me messages"</span> an{' '}
                <span className="text-green-400 font-mono">+34 644 44 10 26</span> auf WhatsApp. Der Bot antwortet mit deinem API-Key.
              </p>
              <div className="space-y-3">
                <Input
                  label="Handynummer (mit Ländervorwahl)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+491234567890"
                  type="tel"
                />
                <Input
                  label="CallMeBot API-Key"
                  value={callMeBotKey}
                  onChange={(e) => setCallMeBotKey(e.target.value)}
                  placeholder="Vom Bot erhaltener Key"
                />
                {phone && callMeBotKey && (
                  <Button
                    variant="secondary"
                    onClick={testWhatsApp}
                    disabled={testStatus === 'sending'}
                    fullWidth
                  >
                    {testStatus === 'idle' && '📨 Test-Nachricht senden'}
                    {testStatus === 'sending' && '⏳ Wird gesendet…'}
                    {testStatus === 'sent' && '✅ Gesendet! Nachricht prüfen'}
                    {testStatus === 'error' && '❌ Fehler beim Senden'}
                  </Button>
                )}
              </div>
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
