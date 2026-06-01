const TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO || 'eskotese'
const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_URL

export async function triggerDeploy() {
  if (DEPLOY_HOOK) await fetch(DEPLOY_HOOK, { method: 'POST' }).catch(() => null)
}

function ghFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  })
}

async function getFileSha(slug: string): Promise<{ sha: string | null; status: number; message?: string }> {
  const res = await ghFetch(`/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { sha: null, status: res.status, message: body.message }
  }
  const data = await res.json()
  return { sha: data.sha ?? null, status: 200 }
}

export function isGithubConfigured(): boolean {
  return !!(TOKEN && OWNER)
}

export async function githubSaveText(slug: string, fileContent: string): Promise<{ ok: boolean; error?: string }> {
  const { sha } = await getFileSha(slug)
  const body: Record<string, unknown> = {
    message: sha ? `update: ${slug}` : `add: ${slug}`,
    content: Buffer.from(fileContent, 'utf-8').toString('base64'),
  }
  if (sha) body.sha = sha

  const res = await ghFetch(
    `/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`,
    { method: 'PUT', body: JSON.stringify(body) }
  )
  if (res.ok) return { ok: true }
  const errBody = await res.json().catch(() => ({}))
  const error = `GitHub ${res.status}: ${errBody.message ?? 'unbekannter Fehler'}`
  console.error('[github] Fehler beim Speichern:', error)
  return { ok: false, error }
}

export async function githubDeleteText(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { sha, status, message } = await getFileSha(slug)
  if (!sha) return { ok: false, error: `GitHub ${status}: ${message ?? 'Datei nicht gefunden'} (${OWNER}/${REPO}/content/texte/${slug}.md)` }

  const res = await ghFetch(
    `/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`,
    {
      method: 'DELETE',
      body: JSON.stringify({ message: `delete: ${slug}`, sha }),
    }
  )
  if (res.ok) return { ok: true }
  const body = await res.json().catch(() => ({}))
  return { ok: false, error: `GitHub ${res.status}: ${body.message ?? 'unbekannter Fehler'}` }
}
