import { useState } from 'react'
import { useStore } from '../store'
import { GitHubService } from '../services/github'
import Button from '../components/Button'
import Input from '../components/Input'

export default function SettingsPage() {
  const { settings, setSettings, syncFromGitHub, syncToGitHub, syncStatus, syncError, data } = useStore()
  const [token, setToken] = useState(settings.githubToken)
  const [gistId, setGistId] = useState(settings.gistId)
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [createStatus, setCreateStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle')
  const [newGistId, setNewGistId] = useState('')

  async function validateToken() {
    if (!token.trim()) return
    setTokenStatus('checking')
    const ok = await GitHubService.validateToken(token.trim())
    setTokenStatus(ok ? 'ok' : 'error')
  }

  async function createGist() {
    if (!token.trim()) return
    setCreateStatus('creating')
    try {
      const id = await GitHubService.createGist(token.trim())
      setNewGistId(id)
      setGistId(id)
      setCreateStatus('done')
    } catch {
      setCreateStatus('error')
    }
  }

  function saveSettings() {
    setSettings({ githubToken: token.trim(), gistId: gistId.trim() })
  }

  const isSaved = settings.githubToken === token.trim() && settings.gistId === gistId.trim()
  const lastSync = settings.lastSync
    ? new Date(settings.lastSync).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Noch nie'

  const stats = {
    rooms: data.rooms.length,
    persons: data.persons.length,
    tasks: data.tasks.filter((t) => !t.completed).length,
    done: data.tasks.filter((t) => t.completed).length,
  }

  return (
    <div className="flex-1 p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Einstellungen</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Räume', value: stats.rooms, icon: '🏠' },
          { label: 'Personen', value: stats.persons, icon: '👤' },
          { label: 'Offene Aufgaben', value: stats.tasks, icon: '📋' },
          { label: 'Erledigt', value: stats.done, icon: '✅' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="text-2xl">{s.icon}</div>
            <div className="text-2xl font-bold text-white mt-1">{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* GitHub Sync */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐙</span>
          <h2 className="font-semibold text-white">GitHub Sync</h2>
          {syncStatus === 'syncing' && <span className="text-xs text-amber-400 ml-auto animate-pulse">Synchronisiert…</span>}
          {syncStatus === 'ok' && <span className="text-xs text-emerald-400 ml-auto">✓ Synchronisiert</span>}
          {syncStatus === 'error' && <span className="text-xs text-red-400 ml-auto">Fehler</span>}
        </div>

        <p className="text-xs text-slate-400">
          Daten werden in einem privaten GitHub Gist gespeichert und automatisch mit jedem Gerät synchronisiert.
        </p>

        {syncStatus === 'error' && (
          <p className="text-xs text-red-400 bg-red-900/20 rounded-xl px-3 py-2">{syncError}</p>
        )}

        <div className="space-y-3">
          <div>
            <Input
              label="GitHub Personal Access Token"
              value={token}
              onChange={(e) => { setToken(e.target.value); setTokenStatus('idle') }}
              placeholder="ghp_xxxxxxxxxxxx"
              type="password"
              hint="Benötigt: gist scope. Erstelle ihn unter github.com → Settings → Developer settings → Tokens"
            />
            <Button
              variant="ghost"
              onClick={validateToken}
              disabled={!token.trim() || tokenStatus === 'checking'}
              className="mt-2 text-xs !py-1.5 !px-3"
            >
              {tokenStatus === 'idle' && 'Token prüfen'}
              {tokenStatus === 'checking' && '⏳ Prüfe…'}
              {tokenStatus === 'ok' && '✅ Token gültig'}
              {tokenStatus === 'error' && '❌ Token ungültig'}
            </Button>
          </div>

          <div>
            <Input
              label="Gist ID"
              value={gistId}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="z.B. abc123def456..."
              hint="Die Gist-ID aus der URL: gist.github.com/{user}/{id}"
            />
            {tokenStatus === 'ok' && !gistId && (
              <Button
                variant="ghost"
                onClick={createGist}
                disabled={createStatus === 'creating'}
                className="mt-2 text-xs !py-1.5 !px-3"
              >
                {createStatus === 'idle' && '➕ Neuen Gist erstellen'}
                {createStatus === 'creating' && '⏳ Erstelle…'}
                {createStatus === 'done' && `✅ Gist erstellt: ${newGistId.slice(0, 12)}…`}
                {createStatus === 'error' && '❌ Fehler beim Erstellen'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={saveSettings} disabled={isSaved || !token || !gistId} fullWidth>
            Speichern
          </Button>
        </div>

        {settings.githubToken && settings.gistId && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={syncFromGitHub}
              disabled={syncStatus === 'syncing'}
              fullWidth
            >
              ⬇️ Von GitHub laden
            </Button>
            <Button
              variant="secondary"
              onClick={syncToGitHub}
              disabled={syncStatus === 'syncing'}
              fullWidth
            >
              ⬆️ Zu GitHub speichern
            </Button>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">Letzter Sync: {lastSync}</p>
      </div>

      {/* About */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
        <p className="font-medium text-slate-300">Haushaltsorganisation</p>
        <p>Version 1.0 · PWA · Daten lokal + GitHub Gist</p>
        <p>WhatsApp-Benachrichtigungen via CallMeBot</p>
      </div>
    </div>
  )
}
