import type { AppData } from '../types'

const GIST_FILENAME = 'haushaltsapp-data.json'

export class GitHubService {
  private token: string
  private gistId: string

  constructor(token: string, gistId: string) {
    this.token = token
    this.gistId = gistId
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    }
  }

  async load(): Promise<AppData | null> {
    if (!this.token || !this.gistId) return null
    const res = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      headers: this.headers,
    })
    if (!res.ok) throw new Error(`GitHub API Fehler: ${res.status}`)
    const gist = await res.json()
    const file = gist.files?.[GIST_FILENAME]
    if (!file) return null
    return JSON.parse(file.content) as AppData
  }

  async save(data: AppData): Promise<void> {
    if (!this.token || !this.gistId) return
    const res = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    })
    if (!res.ok) throw new Error(`GitHub API Fehler: ${res.status}`)
  }

  static async createGist(token: string): Promise<string> {
    const emptyData: AppData = { rooms: [], persons: [], tasks: [], version: 1 }
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Haushaltsapp Daten',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(emptyData, null, 2),
          },
        },
      }),
    })
    if (!res.ok) throw new Error(`GitHub API Fehler: ${res.status}`)
    const gist = await res.json()
    return gist.id
  }

  static async validateToken(token: string): Promise<boolean> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    return res.ok
  }
}
