import React, { useMemo, useState } from 'react'
import type { Mark, Row } from '../types'

interface Props {
  onApply: (raceNo: number, rows: Row[]) => void
  totalRaces?: number
}

type SimpleHorse = { horse_no: string; horse_name: string }
type ParsedRace = { race_no: number; horses: SimpleHorse[] }

function normalizeSpaces(s: string): string {
  return s.replace(/[\u3000\s]+/g, ' ').trim()
}

function parseSingleTable(table: HTMLTableElement): SimpleHorse[] {
  const headerText = (table.querySelector('thead') || table.querySelector('tr'))?.textContent || ''
  if (!(headerText.includes('馬番') && headerText.includes('馬名'))) return []
  const rows = Array.from(table.querySelectorAll('tbody tr')).length
    ? Array.from(table.querySelectorAll('tbody tr'))
    : Array.from(table.querySelectorAll('tr')).slice(1)
  const ths = Array.from((table.querySelector('thead') || table).querySelectorAll('th')).map(th => normalizeSpaces(th.textContent || ''))
  let noIdx = ths.findIndex(t => t.includes('馬番'))
  let nameIdx = ths.findIndex(t => t.includes('馬名'))
  if (noIdx < 0) noIdx = 0
  if (nameIdx < 0) nameIdx = 1
  const results: SimpleHorse[] = []
  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll('td')).map(td => normalizeSpaces(td.textContent || ''))
    if (cells.length < 2) continue
    const horse_no = (cells[noIdx] || '').replace(/^0+/, '')
    const horse_name = (cells[nameIdx] || '')
    if (/^\d{1,2}$/.test(horse_no) && horse_name) results.push({ horse_no, horse_name })
  }
  return results
}

function parseTextFallback(text: string): SimpleHorse[] {
  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.map(s => normalizeSpaces(s)).filter(s => s.length > 0)
  const results: SimpleHorse[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line === 'ブリンカー着用') continue

    // Pattern A: "1 タイトルホース"
    let m = line.match(/^(\d{1,2})\s*(?:番)?\s+([^\s]+)(?:\s|$)/)
    if (m) {
      const horse_no = m[1].replace(/^0+/, '')
      const horse_name = m[2]
      if (horse_name) { results.push({ horse_no, horse_name }); continue }
    }

    // Pattern B: "枠... 1 タイトルホース ..."
    m = line.match(/^枠[^\s]*\s+(\d{1,2})\s+([^\s]+)(?:\s|$)/)
    if (m) {
      const horse_no = m[1].replace(/^0+/, '')
      const horse_name = m[2]
      if (horse_name) { results.push({ horse_no, horse_name }); continue }
    }

    // Pattern C: "枠... 1" on one line, optional "ブリンカー着用" on next, then name on the following line
    m = line.match(/^枠[^\s]*\s+(\d{1,2})$/)
    if (m) {
      const horse_no = m[1].replace(/^0+/, '')
      let j = i + 1
      if (j < lines.length && lines[j] === 'ブリンカー着用') j++
      if (j < lines.length) {
        const nameLine = lines[j]
        const nm = nameLine.match(/^([^\s]+)(?:\s|$)/)
        if (nm) {
          const horse_name = nm[1]
          results.push({ horse_no, horse_name })
          i = j // skip consumed name line
          continue
        }
      }
    }
  }
  return results
}

function parseFromHtml(html: string, forcedRaceNo?: number): { single: SimpleHorse[]; multi: ParsedRace[] } {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 1) Line-based multi-race segmentation: detect lines like "1レース", "第1R", "1 競走"
    const textAll = doc.body?.textContent || html
    const lines = (textAll || '').split(/\r?\n/).map(s => normalizeSpaces(s)).filter(Boolean)
    const headerLineRegex = /^(?:第\s*)?(\d{1,2})\s*(?:R|レース|競走)\s*$/
    const headerIdx: { line: number; race_no: number }[] = []
    for (let i = 0; i < lines.length; i++) {
      const mm = lines[i].match(headerLineRegex)
      if (mm) {
        const n = Number(mm[1])
        if (n >= 1 && n <= 12) headerIdx.push({ line: i, race_no: n })
      }
    }
    const multi: ParsedRace[] = []
    if (headerIdx.length >= 1) {
      for (let i = 0; i < headerIdx.length; i++) {
        const startLine = headerIdx[i].line
        const endLine = i + 1 < headerIdx.length ? headerIdx[i + 1].line : lines.length
        const slice = lines.slice(startLine, endLine).join('\n')
        const horses = parseTextFallback(slice)
        if (horses.length >= 3) multi.push({ race_no: headerIdx[i].race_no, horses })
      }
      if (multi.length >= 1) {
        return { single: [], multi: dedupeByRaceLocal(multi) }
      }
    }

    // 2) If no or weak multi, look for race-scoped tables and infer race_no from nearby text
    if (multi.length === 0) {
      const tables = Array.from(doc.querySelectorAll('table'))
      const candidates: ParsedRace[] = []
      for (const table of tables) {
        const horses = parseSingleTable(table as HTMLTableElement)
        if (horses.length === 0) continue
        // infer race number by searching around the table
        let raceNo = forcedRaceNo || 0
        if (!raceNo) {
          const context = normalizeSpaces((table.closest('section, article, div')?.textContent || '').slice(0, 300))
          const mm = context.match(/^(?:第\s*)?(\d{1,2})\s*(?:R|レース|競走)/)
          if (mm) {
            const n = Number(mm[1] || 0)
            if (n >= 1 && n <= 12) raceNo = n
          }
        }
        candidates.push({ race_no: raceNo, horses })
      }
      // If we found multiple tables with inferred raceNo, prefer them as multi
      const withNo = candidates.filter(c => c.race_no >= 1 && c.race_no <= 12)
      if (withNo.length >= 2) {
        return { single: [], multi: dedupeByRaceLocal(withNo) }
      }
      // else fall back to single (no raceNo)
      if (candidates.length > 0) return { single: candidates[0].horses, multi: [] }
    }

    // 3) Last resort: parse entire text as single
    const single = parseTextFallback(normalizeSpaces(textAll))
    return { single, multi: [] }
  } catch {
    return { single: [], multi: [] }
  }
}

function dedupeByRaceLocal(arr: ParsedRace[]): ParsedRace[] {
  const map = new Map<number, ParsedRace>()
  for (const r of arr) {
    if (!map.has(r.race_no)) map.set(r.race_no, r)
  }
  return Array.from(map.values()).sort((a, b) => a.race_no - b.race_no)
}

export default function ManualImport({ onApply, totalRaces = 12 }: Props) {
  const [raw, setRaw] = useState('')
  const [raceNo, setRaceNo] = useState(1)
  const parsed = useMemo(() => parseFromHtml(raw, raceNo), [raw, raceNo])

  // no-op in component scope (kept for potential future use)

  const toRows = (items: SimpleHorse[]): Row[] => {
    return items.map(it => ({
      horse_no: String(it.horse_no || ''),
      horse_name: String(it.horse_name || ''),
      marks: { A: '' as Mark, B: '' as Mark, C: '' as Mark, D: '' as Mark },
      comment: '',
    }))
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-end gap-2">
        <div>
          <label className="label">対象レース</label>
          <select className="input" value={raceNo} onChange={e => setRaceNo(Number(e.target.value))}>
            {Array.from({ length: totalRaces }).map((_, i) => (
              <option key={i + 1} value={i + 1}>R{i + 1}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-600">
          貼り付け: JRA出馬表ページのHTML全体／複数Rまとめて可
        </div>
      </div>
      <textarea
        className="input w-full h-40 font-mono"
        placeholder="ここにHTMLまたはテキストを貼り付け"
        value={raw}
        onChange={e => setRaw(e.target.value)}
      />
      {parsed.multi.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-600">検出: {parsed.multi.length}R / 合計{parsed.multi.reduce((a, r) => a + r.horses.length, 0)}頭</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={() => setRaw('')}>クリア</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                parsed.multi.forEach(r => onApply(r.race_no, toRows(r.horses)))
              }}
            >検出した全Rを置換</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parsed.multi.map(r => (
              <div key={r.race_no} className="border border-gray-200 rounded-md p-2 bg-gray-50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">R{r.race_no}（{r.horses.length}頭）</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => onApply(r.race_no, toRows(r.horses))}>このRを置換</button>
                </div>
                <ol className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {r.horses.map((h, i) => (
                    <li key={i} className="truncate">{h.horse_no}. {h.horse_name}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-600">検出: {parsed.single.length}頭</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={() => setRaw('')}>クリア</button>
            <button
              className="btn btn-primary"
              disabled={parsed.single.length === 0}
              onClick={() => onApply(raceNo, toRows(parsed.single))}
            >この内容でR{raceNo}を置換</button>
          </div>
          {parsed.single.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50 text-xs">
              <div className="font-semibold mb-1">プレビュー</div>
              <ol className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                {parsed.single.map((h, i) => (
                  <li key={i} className="truncate">{h.horse_no}. {h.horse_name}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  )
}
