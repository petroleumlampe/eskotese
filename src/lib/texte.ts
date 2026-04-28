import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

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
