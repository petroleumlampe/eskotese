import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { WEAK_ENDINGS } from '@/lib/gedicht'

const contentDir = path.join(process.cwd(), 'content', 'texte')

export interface Text {
  slug: string
  title: string
  date: string
  content: string
}

export function getAllTexte(): Text[] {
  if (!fs.existsSync(contentDir)) return []

  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'))

  const texte = files.map(filename => {
    const slug = filename.replace('.md', '')
    const raw = fs.readFileSync(path.join(contentDir, filename), 'utf-8')
    const { data, content } = matter(raw)
    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      content: content.trim(),
    }
  })

  return texte.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getTextBySlug(slug: string): Text | null {
  const filePath = path.join(contentDir, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    content: content.trim(),
  }
}

export interface TextLink {
  slug: string
  title: string
  short: string
}

const SHORT_MAX = 26
const isFiller = (w: string) => w === '+' || WEAK_ENDINGS.has(w.toLowerCase())

// Kürzt lange Titel: erst am ersten Satzzeichen abschneiden, dann auf ganze Wörter
// bis SHORT_MAX Zeichen, zuletzt Füllwörter am Ende entfernen.
export function shortTitle(title: string): string {
  let t = title.trim()
  if (t.length <= SHORT_MAX) return t
  const cut = t.search(/[,;:(–—]/)
  if (cut > 0) t = t.slice(0, cut).trim()
  if (t.length > SHORT_MAX) {
    let out = ''
    for (const w of t.split(/\s+/)) {
      const next = out ? `${out} ${w}` : w
      if (next.length > SHORT_MAX && out) break
      out = next
    }
    t = out
  }
  const words = t.split(/\s+/)
  while (words.length > 1 && isFiller(words[words.length - 1])) words.pop()
  return words.join(' ')
}

// Text samt chronologischen Nachbarn; Dateien ohne Slug (z. B. ".md") sind nicht verlinkbar.
export function getTextWithNeighbors(slug: string): { text: Text; older: TextLink | null; newer: TextLink | null } | null {
  const texte = getAllTexte().filter(t => t.slug)
  const i = texte.findIndex(t => t.slug === slug)
  if (i === -1) return null
  const link = (t?: Text) => (t ? { slug: t.slug, title: t.title, short: shortTitle(t.title) } : null)
  return { text: texte[i], older: link(texte[i + 1]), newer: link(texte[i - 1]) }
}

export function saveText(slug: string, title: string, date: string, content: string): void {
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true })
  const body = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: "${date}"\n---\n${content}`
  fs.writeFileSync(path.join(contentDir, `${slug}.md`), body, 'utf-8')
}

export function deleteText(slug: string): void {
  const filePath = path.join(contentDir, `${slug}.md`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function textExists(slug: string): boolean {
  return fs.existsSync(path.join(contentDir, `${slug}.md`))
}
