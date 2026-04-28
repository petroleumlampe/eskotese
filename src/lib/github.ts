const TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO || 'eskotese'

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

async function getFileSha(slug: string): Promise<string | null> {
  const res = await ghFetch(`/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`)
  if (!res.ok) return null
  const data = await res.json()
  return data.sha ?? null
}

export function isGithubConfigured(): boolean {
  return !!(TOKEN && OWNER)
}

export async function githubSaveText(slug: string, fileContent: string): Promise<boolean> {
  const sha = await getFileSha(slug)
  const body: Record<string, unknown> = {
    message: sha ? `update: ${slug}` : `add: ${slug}`,
    content: Buffer.from(fileContent, 'utf-8').toString('base64'),
  }
  if (sha) body.sha = sha

  const res = await ghFetch(
    `/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`,
    { method: 'PUT', body: JSON.stringify(body) }
  )
  return res.ok
}

export async function githubDeleteText(slug: string): Promise<boolean> {
  const sha = await getFileSha(slug)
  if (!sha) return false

  const res = await ghFetch(
    `/repos/${OWNER}/${REPO}/contents/content/texte/${slug}.md`,
    {
      method: 'DELETE',
      body: JSON.stringify({ message: `delete: ${slug}`, sha }),
    }
  )
  return res.ok
}
