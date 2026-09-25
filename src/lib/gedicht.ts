// Cut-up-Gedichte: Zeilen entstehen aus echten Wortfolgen der Texte und
// springen an gemeinsamen Wörtern ("Drehpunkten") in einen anderen Text.
// So bleibt die Grammatik innerhalb der Stücke erhalten, die Überraschung
// liegt an den Nahtstellen.

const STOPWORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines',
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'als', 'wie', 'dass', 'ob',
  'in', 'an', 'auf', 'von', 'zu', 'mit', 'bei', 'nach', 'aus', 'für', 'um',
  'über', 'unter', 'vor', 'hinter', 'zwischen', 'durch', 'gegen', 'ohne',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich',
  'mein', 'dein', 'sein', 'unser', 'euer', 'mir', 'dir', 'uns', 'euch',
  'ist', 'bin', 'bist', 'sind', 'seid', 'war', 'waren', 'wird', 'werden',
  'hat', 'haben', 'hatte', 'hatten', 'nicht', 'noch', 'schon', 'auch', 'nur',
  'dann', 'da', 'hier', 'so', 'ja', 'nein', 'wo', 'was', 'wer', '&',
])

// Wörter, mit denen eine Zeile nicht enden soll (klingt abgeschnitten)
const WEAK_ENDINGS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines',
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'als', 'wie', 'dass', 'ob', '&',
  'in', 'an', 'auf', 'von', 'zu', 'mit', 'bei', 'nach', 'aus', 'für', 'um',
  'über', 'unter', 'vor', 'hinter', 'zwischen', 'durch', 'gegen', 'ohne',
  'vom', 'zum', 'zur', 'im', 'am', 'ins', 'beim',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'meine', 'deine', 'seine', 'ihre',
  'meines', 'deines', 'seines', 'ihres', 'meinem', 'deinem', 'seinem', 'ihrem',
  'meinen', 'deinen', 'seinen', 'ihren', 'meiner', 'deiner', 'seiner', 'ihrer',
])

// Wie oft eine Zeile ohne Sprung aus demselben Text weiterlaufen darf
const MAX_RUN = 3
const JUMP_CHANCE = 0.45
const ANAPHORA_CHANCE = 0.2
const PARENS_CHANCE = 0.2
const AMPERSAND_CHANCE = 0.4 // 'und' wird zu '&'

interface Token { w: string; p: string } // p: Satzzeichen, das im Original folgt
interface SourceLine { text: number; tokens: Token[]; joined: string }
interface Pos { line: number; i: number }

interface Corpus {
  lines: SourceLine[]
  single: Map<string, Pos[]>
  pair: Map<string, Pos[]>
  starts: Pos[]
}

const TOKEN_RE = new RegExp("([\\p{L}\\p{N}&'’]+(?:-[\\p{L}\\p{N}]+)*)|([.,;:!?…]+|[–—])", 'gu')
const BREAK_RE = /[.,;:!?…–—]/

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  for (const m of line.toLowerCase().matchAll(TOKEN_RE)) {
    if (m[1]) tokens.push({ w: m[1], p: '' })
    else if (tokens.length > 0) tokens[tokens.length - 1].p += m[2]
  }
  return tokens
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

export function buildCorpus(texts: string[]): Corpus {
  const lines: SourceLine[] = []
  const single = new Map<string, Pos[]>()
  const pair = new Map<string, Pos[]>()
  const starts: Pos[] = []

  texts.forEach((text, t) => {
    for (const raw of text.split(/\n+/)) {
      const tokens = tokenizeLine(raw)
      if (tokens.length === 0) continue
      const line = lines.length
      lines.push({ text: t, tokens, joined: ' ' + tokens.map(x => x.w).join(' ') + ' ' })
      tokens.forEach((tok, i) => {
        push(single, tok.w, { line, i })
        if (i > 0) push(pair, `${tokens[i - 1].w} ${tok.w}`, { line, i })
        // Zeilenanfänge: Beginn der Originalzeile oder nach einem Satzzeichen
        const isStart = i === 0 || BREAK_RE.test(tokens[i - 1].p)
        if (isStart && i < tokens.length - 1) starts.push({ line, i })
      })
    }
  })

  return { lines, single, pair, starts }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 2→20%, 3→30%, 4→30%, 5→15%, 6→5%
function pickLineLength(): number {
  const r = Math.random()
  if (r < 0.20) return 2
  if (r < 0.50) return 3
  if (r < 0.80) return 4
  if (r < 0.95) return 5
  return 6
}

function isContent(w: string) {
  return w.length >= 4 && !STOPWORDS.has(w)
}

function canEndOn(tok: Token) {
  return !WEAK_ENDINGS.has(tok.w)
}

// Andere Stellen im Korpus, an denen die letzten Wörter ebenfalls stehen
function pivots(c: Corpus, out: Token[], pos: Pos): Pos[] {
  const elsewhere = (p: Pos) =>
    p.line !== pos.line && p.i < c.lines[p.line].tokens.length - 1
  if (out.length >= 2 && Math.random() < 0.8) {
    const key = `${out[out.length - 2].w} ${out[out.length - 1].w}`
    const found = (c.pair.get(key) ?? []).filter(elsewhere)
    if (found.length > 0) return found
  }
  return (c.single.get(out[out.length - 1].w) ?? []).filter(elsewhere)
}

function tryLine(c: Corpus, target: number, startWord?: string, avoidSecond?: string): { tokens: Token[]; jumps: number } | null {
  let pos: Pos
  if (startWord) {
    // Anapher: gleicher Anfang, aber anders weitergeführt
    const opts = (c.single.get(startWord) ?? []).filter(p => {
      const toks = c.lines[p.line].tokens
      return p.i < toks.length - 1 && toks[p.i + 1].w !== avoidSecond
    })
    if (opts.length === 0) return null
    pos = pick(opts)
  } else {
    pos = pick(c.starts)
  }

  const out: Token[] = [c.lines[pos.line].tokens[pos.i]]
  let run = 1
  let jumps = 0

  while (true) {
    const src = c.lines[pos.line].tokens
    const tok = src[pos.i]
    const atEnd = pos.i === src.length - 1
    const n = out.length

    const naturalEnd = atEnd || BREAK_RE.test(tok.p)
    if (n >= target && naturalEnd && canEndOn(tok)) break
    if (n >= target + 2) {
      if (canEndOn(tok)) break
      return null
    }

    const wantJump = atEnd || run >= MAX_RUN || Math.random() < JUMP_CHANCE
    if (wantJump) {
      let cand = pivots(c, out, pos)
      // Kurz vor dem Ziel: bevorzugt Stellen, die bald natürlich enden
      if (n >= target - 1) {
        const closing = cand.filter(p => c.lines[p.line].tokens.length - 1 - p.i <= 3)
        if (closing.length > 0) cand = closing
      }
      // Bevorzugt Sprünge in einen anderen Text
      const otherText = cand.filter(p => c.lines[p.line].text !== c.lines[pos.line].text)
      if (otherText.length > 0) cand = otherText
      if (cand.length > 0) {
        pos = pick(cand)
        // Drehpunkt übernimmt das Satzzeichen seines neuen Kontexts
        out[out.length - 1] = c.lines[pos.line].tokens[pos.i]
        jumps++
        run = 0
      } else if (atEnd) {
        if (n >= 2 && canEndOn(tok)) break
        return null
      }
    }

    pos = { line: pos.line, i: pos.i + 1 }
    out.push(c.lines[pos.line].tokens[pos.i])
    run++
  }

  return { tokens: out, jumps }
}

function render(tokens: Token[]): string {
  return tokens
    .map((t, i) => {
      let p = t.p
      if (i === tokens.length - 1) p = p.replace(/[:;]+$/, '')
      const w = t.w === 'und' && Math.random() < AMPERSAND_CHANCE ? '&' : t.w
      if (/^[–—]/.test(p)) return `${w} ${p}`
      return w + p
    })
    .join(' ')
}

function generateLine(c: Corpus, used: Set<string>, startWord?: string, avoidSecond?: string): Token[] {
  let fallback: Token[] | null = null
  for (let attempt = 0; attempt < 80; attempt++) {
    const res = tryLine(c, pickLineLength(), startWord, avoidSecond)
    if (!res) continue
    const { tokens, jumps } = res
    // Inhaltswörter nicht über Zeilen hinweg wiederholen (außer Anapher)
    if (tokens.some((t, i) => isContent(t.w) && used.has(t.w) && !(i === 0 && startWord))) continue
    fallback ??= tokens
    // Nicht einfach eine Originalzeile abschreiben
    if (tokens.length >= 4 && jumps === 0) continue
    if (tokens.length >= 4 && c.lines.some(l => l.joined.includes(' ' + tokens.map(t => t.w).join(' ') + ' '))) continue
    return tokens
  }
  return fallback ?? [pick(c.lines[pick(c.starts).line].tokens)]
}

export function generateGedicht(texts: string[], lineCount = 4): string[] {
  const c = buildCorpus(texts)
  if (c.starts.length < 5) return ['zu wenig worte']

  const used = new Set<string>()
  const result: Token[][] = []
  const anaphoraAt = Math.random() < ANAPHORA_CHANCE ? 1 + Math.floor(Math.random() * (lineCount - 1)) : -1

  for (let i = 0; i < lineCount; i++) {
    // Anapher: Zeile beginnt mit demselben Wort wie die vorige
    const prev = i === anaphoraAt ? result[i - 1] : undefined
    const tokens = generateLine(c, used, prev?.[0].w, prev?.[1]?.w)
    tokens.forEach(t => isContent(t.w) && used.add(t.w))
    result.push(tokens)
  }

  const parensIndex = Math.random() < PARENS_CHANCE ? Math.floor(Math.random() * lineCount) : -1
  return result.map((tokens, i) => (i === parensIndex ? `(${render(tokens)})` : render(tokens)))
}
